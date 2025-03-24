import fs from 'fs';
import { XMLParser } from 'fast-xml-parser';
import { gzipSync } from 'zlib';
import { TYPES, TYPE, IS_INLINE, IS_ARRAY, Entry, NBTType, Entry2Mojangson, PipeOptions } from './Common';
import mojangson from '@foresteam/mojangson';
import { promisify } from 'util';

class Writer {
	#buffers: Buffer[];
	constructor() {
		this.#buffers = [];
	}

	WriteBuf(buf: Buffer) {
		this.#buffers.push(buf);
	}
	WriteTypeAndName(type: number, name?: string, headless = false) {
		if (headless)
			return;
		const nameLen = name ? Buffer.from(name, 'binary').byteLength : 0;
		const buf = Buffer.alloc(1 + 2 + nameLen);
		buf.writeUInt8(type);
		buf.writeUInt16BE(nameLen, 1);
		if (name)
			buf.write(name, 3, 'binary');
		this.WriteBuf(buf);
	}
	WriteInline(type: number, entry: Entry, name?: string, headless = false) {
		let buf: Buffer | undefined;
		if (type == TYPE('byte')) {
			buf = Buffer.alloc(1);
			buf.writeInt8(Number(entry.value));
		}
		if (type == TYPE('short')) {
			buf = Buffer.alloc(2);
			buf.writeInt16BE(entry.value as number);
		}
		if (type == TYPE('int')) {
			buf = Buffer.alloc(4);
			buf.writeInt32BE(entry.value as number);
		}
		if (type == TYPE('long')) {
			buf = Buffer.alloc(8);
			buf.writeBigInt64BE(BigInt(entry.value as bigint));
		}
		if (type == TYPE('float')) {
			buf = Buffer.alloc(4);
			buf.writeFloatBE(entry.value as number);
		}
		if (type == TYPE('double')) {
			buf = Buffer.alloc(8);
			buf.writeDoubleBE(entry.value as number);
		}
		if (type == TYPE('snbt')) {
			type = TYPE('string');
			entry.value = mojangson.stringify(Entry2Mojangson(entry.value as Entry), true);
		}
		if (type == TYPE('string')) {
			const len = Buffer.from(String(entry.value), 'utf-8').byteLength;
			buf = Buffer.alloc(2 + len);
			buf.writeUInt16BE(len);
			buf.write(String(entry.value), 2, 'utf-8');
		}

		if (!buf)
			throw new Error();
		// should be in the end, 'cause otherwise it'll write the artificient SNBT tag
		this.WriteTypeAndName(type, name, headless);

		this.WriteBuf(buf);
	}
	WriteArray(entry: Entry, name?: string, headless = false) {
		this.WriteTypeAndName(entry.type, name, headless);
		const length = Buffer.alloc(4);
		length.writeInt32BE((entry.value as Entry[]).length);
		this.WriteBuf(length);
		for (const v of entry.value as Entry[])
			this.WriteInline(entry.contentType as number, v, undefined, true);
	}
	WriteSwitch(type: number, entry: Entry, name?: string, headless = false) {
		if (IS_INLINE(entry.type))
			this.WriteInline(type, entry, name, headless);
		if (IS_ARRAY(entry.type))
			this.WriteArray(entry, name, headless);
		if (entry.type == TYPE('list'))
			this.WriteList(entry, name, headless);
		if (TYPES[entry.type] == 'compound')
			this.WriteCompound(entry, name, headless);
	}
	WriteList(entry: Entry, name?: string, headless = false) {
		this.WriteTypeAndName(entry.type, name, headless);
		const info = Buffer.alloc(1 + 4);
		info.writeUInt8(entry.contentType as number);
		info.writeInt32BE((entry.value as Entry[]).length, 1);
		this.WriteBuf(info);
		for (const v of entry.value as Entry[]) 
			this.WriteSwitch(entry.contentType as number, v, undefined, true);
	}
	// headless = !!name
	WriteCompound(entry: Entry, name?: string, headless = false) {
		this.WriteTypeAndName(TYPE('compound'), name, headless);
		for (const [name, child] of Object.entries(entry.value) as [string, Entry][])
			this.WriteSwitch(child.type, child, name);
		// WriteInline(TYPE('byte'), , 'seenCredits');
		const buf = Buffer.alloc(1);
		buf.writeUInt8(TYPE('end'));
		this.WriteBuf(buf);
	}

	End(gzip = false) {
		let buf = Buffer.concat(this.#buffers as any);
		if (gzip)
			buf = gzipSync(buf as any, { info: false });
		return buf;
	}
}

interface XMLEntryDescriptor {
	name: string;
	of: string;
}
interface XMLEntry {
	[type: string]: XMLEntry[] | XMLEntryDescriptor | undefined;
	':@'?: XMLEntryDescriptor;
}
const Entrify = (tag: XMLEntry): [string | number, Entry] => {
	const [type, entries] = Object.entries(tag)[0];
	const entry = { type: 0 } as Entry;

	if (type == 'array')
		entry.value = (entries as XMLEntry[]).map(e => Entrify(e)[1]);
	else
		entry.type = TYPE(type as NBTType);
	if (type == 'snbt')
		entry.value = entries ? Entrify((entries as XMLEntry[])[0])[1] : {};
	else if (IS_INLINE(TYPE(type as NBTType)))
		entry.value = (entries as XMLEntry[])[0]['#text'] as any;
	else if (type == 'list')
		entry.value = (entries as XMLEntry[]).map(e => Entrify(e)[1]);
	else if (type == 'compound')
		entry.value = Object.fromEntries((entries as XMLEntry[]).map(e => Entrify(e)));
	if (tag[':@']?.of) {
		entry.contentType = TYPE(tag[':@'].of as NBTType);
		if (type == 'array')
			entry.type = TYPE(`${TYPES[entry.contentType]}[]` as NBTType);
	}
	return [tag[':@']?.name as (number | string), entry];
}

const ReadXML = ({ xml, filename }: { xml?: string, filename?: string}): Entry => {
	if (!filename && !xml)
		throw new Error();
	const parser = new XMLParser({
		preserveOrder: true,
		ignoreAttributes: false,
		attributeNamePrefix: "",
		allowBooleanAttributes: true,
		ignoreDeclaration: true,
		ignorePiTags: true
	});
	const json = parser.parse(filename ? fs.readFileSync(filename) : xml as string) as XMLEntry[];
	return Entrify(json[0])[1];
}
const WriteNBT = async ({ filename, root, gzip = false }: { filename?: string, root: Entry, gzip?: boolean }): Promise<Buffer|void> => {
	const writer = new Writer();
	writer.WriteCompound(root);
	const buf = writer.End(gzip);
	if (filename)
		await promisify(fs.writeFile)(filename, buf as any, 'binary');
	else
		return buf;
}
const X2NPipe = async (xmlInput: string, nbtOutput: string, { gzip }: PipeOptions = {}): Promise<void> => {
	await WriteNBT({ filename: nbtOutput, root: ReadXML({ filename: xmlInput }), gzip });
}

/** XML->NBT */
export default { ReadXML, WriteNBT, X2NPipe };