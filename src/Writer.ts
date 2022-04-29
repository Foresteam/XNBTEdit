import fs from 'fs';
import { XMLParser } from 'fast-xml-parser';
import { gzipSync } from 'zlib';
import { TYPES, TYPE, IS_INLINE, IS_ARRAY, Entry, NBTType, Entry2Mojangson, PipeOptions } from './Common.js';
import mojangson from 'mojangson'
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
		let nameLen = name ? Buffer.from(name, 'utf-8').byteLength : 0;
		let buf = Buffer.alloc(1 + 2 + nameLen);
		buf.writeUInt8(type);
		buf.writeUInt16BE(nameLen, 1);
		if (name)
			buf.write(name, 3, 'utf-8');
		this.WriteBuf(buf);
	}
	WriteInline(type: number, entry: Entry, name?: string, headless = false) {
		this.WriteTypeAndName(type, name, headless);
		let buf: Buffer;
		if (type == TYPE('byte')) {
			buf = Buffer.alloc(1);
			buf.writeInt8(Number(entry.value));
		}
		if (type == TYPE('short')) {
			buf = Buffer.alloc(2);
			buf.writeInt16BE(entry.value);
		}
		if (type == TYPE('int')) {
			buf = Buffer.alloc(4);
			buf.writeInt32BE(entry.value);
		}
		if (type == TYPE('long')) {
			buf = Buffer.alloc(8);
			buf.writeBigInt64BE(BigInt(entry.value));
		}
		if (type == TYPE('float')) {
			buf = Buffer.alloc(4);
			buf.writeFloatBE(entry.value);
		}
		if (type == TYPE('double')) {
			buf = Buffer.alloc(8);
			buf.writeDoubleBE(entry.value);
		}
		if (type == TYPE('snbt')) {
			type = TYPE('string');
			entry.value = mojangson.stringify(Entry2Mojangson(entry.value));
			console.log(typeof entry.value, entry.value);
		}
		if (type == TYPE('string')) {
			let len = Buffer.from(String(entry.value), 'utf-8').byteLength;
			buf = Buffer.alloc(2 + len);
			buf.writeUInt16BE(len);
			buf.write(String(entry.value), 2, 'utf-8');
		}
		// if (buf == undefined) {
		// 	console.log(name, type);
		// 	console.trace();
		// }
		this.WriteBuf(buf);
	}
	WriteArray(entry: Entry, name?: string, headless = false) {
		this.WriteTypeAndName(entry.type, name, headless);
		let length = Buffer.alloc(4);
		length.writeInt32BE((entry.value as Entry[]).length);
		this.WriteBuf(length);
		for (let v of entry.value as Entry[])
			this.WriteInline(entry.contentType, v, null, true);
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
		let info = Buffer.alloc(1 + 4);
		info.writeUInt8(entry.contentType);
		info.writeInt32BE((entry.value as Entry[]).length, 1);
		this.WriteBuf(info);
		for (let v of entry.value as Entry[]) 
			this.WriteSwitch(entry.contentType, v, null, true);
	}
	// headless = !!name
	WriteCompound(entry: Entry, name?: string, headless = false) {
		this.WriteTypeAndName(TYPE('compound'), name, headless);
		for (let [name, child] of Object.entries(entry.value) as [string, Entry][])
			this.WriteSwitch(child.type, child, name);
		// WriteInline(TYPE('byte'), , 'seenCredits');
		let buf = Buffer.alloc(1);
		buf.writeUInt8(TYPE('end'));
		this.WriteBuf(buf);
	}

	End(gzip = false) {
		let buf = Buffer.concat(this.#buffers);
		if (gzip)
			buf = gzipSync(buf.toString(), { info: false, 'level': 6 });
		return buf;
	}
}

interface XMLEntryDescriptor {
	name: string;
	of: string;
}
interface XMLEntry {
	[type: string]: XMLEntry[] | XMLEntryDescriptor;
	':@'?: XMLEntryDescriptor;
}
const Entrify = (tag: XMLEntry): [string | number, Entry] => {
	let [type, entries] = Object.entries(tag)[0];
	let entry: Entry = { type: 0, value: null };

	if (type == 'array')
		entry.value = (entries as XMLEntry[]).map(e => Entrify(e)[1]);
	else
		entry.type = TYPE(type as NBTType);
	if (type == 'snbt')
		entry.value = entries ? Entrify((entries as XMLEntry[])[0])[1] : {};
	else if (IS_INLINE(TYPE(type as NBTType)))
		entry.value = (entries as XMLEntry[])[0]['#text'];
	else if (type == 'list')
		entry.value = (entries as XMLEntry[]).map(e => Entrify(e)[1]);
	else if (type == 'compound')
		entry.value = Object.fromEntries((entries as XMLEntry[]).map(e => Entrify(e)));
	if (tag[':@']?.of) {
		entry.contentType = TYPE(tag[':@'].of as NBTType);
		if (type == 'array')
			entry.type = TYPE(`${TYPES[entry.contentType]}[]` as NBTType);
	}
	return [tag[':@']?.name, entry];
}

const ReadXML = ({ xml, filename }: { xml?: string, filename?: string}): Entry => {
	let parser = new XMLParser({ preserveOrder: true, ignoreAttributes: false, attributeNamePrefix: "", allowBooleanAttributes: true, ignoreDeclaration: true });
	let json = parser.parse(filename ? fs.readFileSync(filename) : xml) as XMLEntry[];
	return Entrify(json[0])[1];
}
const WriteNBT = async ({ filename, root, gzip = false }: { filename?: string, root: Entry, gzip?: boolean }): Promise<Buffer|void> => {
	let writer = new Writer();
	writer.WriteCompound(root);
	let buf = writer.End(gzip);
	if (filename)
		await promisify(fs.writeFile)(filename, buf, 'binary');
	else
		return buf;
}
const X2NPipe = async (xmlInput: string, nbtOutput: string, { gzip }: PipeOptions = {}): Promise<void> => {
	await WriteNBT({ filename: nbtOutput, root: ReadXML({ filename: xmlInput }), gzip });
}
export default { ReadXML, WriteNBT, X2NPipe };