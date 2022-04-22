import fs from 'fs';
import { XMLParser } from 'fast-xml-parser';
import { TYPES, TYPE, IS_INLINE, IS_ARRAY, Entry, NBTType } from './Common';

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
	if (IS_INLINE(TYPE(type as NBTType)))
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

const WriteBuf = (out: fs.WriteStream, buf: Buffer) => new Promise(resolve => out.write(buf, 'binary', resolve));
const WriteTypeAndName = async (out: fs.WriteStream, type: number, name?: string, headless = false) => {
	if (headless)
		return;
	let nameLen = name ? Buffer.from(name, 'utf-8').byteLength : 0;
	let buf = Buffer.alloc(1 + 2 + nameLen);
	buf.writeUInt8(type);
	buf.writeUInt16BE(nameLen, 1);
	if (name)
		buf.write(name, 3, 'utf-8');
	await WriteBuf(out, buf);
}
const WriteInline = async (out: fs.WriteStream, type: number, entry: Entry, name?: string, headless = false) => {
	await WriteTypeAndName(out, type, name, headless);
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
		buf.writeBigInt64BE(entry.value);
	}
	if (type == TYPE('float')) {
		buf = Buffer.alloc(4);
		buf.writeFloatBE(entry.value);
	}
	if (type == TYPE('double')) {
		buf = Buffer.alloc(8);
		buf.writeDoubleBE(entry.value);
	}
	if (type == TYPE('string')) {
		let len = Buffer.from(entry.value, 'utf-8').byteLength;
		buf = Buffer.alloc(2 + len);
		buf.writeUInt16BE(len);
		buf.write(entry.value, 2, 'utf-8');
	}
	await WriteBuf(out, buf);
}
const WriteArray = async (out: fs.WriteStream, entry: Entry, name?: string, headless = false) => {
	await WriteTypeAndName(out, entry.type, name, headless);
	let length = Buffer.alloc(4);
	length.writeInt32BE((entry.value as Entry[]).length);
	await WriteBuf(out, length);
	for (let v of entry.value as Entry[])
		await WriteInline(out, entry.contentType, v, null, true);
}
const WriteSwitch = async (out: fs.WriteStream, type: number, entry: Entry, name?: string, headless = false) => {
	if (IS_INLINE(entry.type))
		await WriteInline(out, type, entry, name, headless);
	if (IS_ARRAY(entry.type))
		await WriteArray(out, entry, name, headless);
	if (entry.type == TYPE('list'))
		await WriteList(out, entry, name, headless);
	if (TYPES[entry.type] == 'compound')
		await WriteCompound(out, entry, name, headless);
}
const WriteList = async (out: fs.WriteStream, entry: Entry, name?: string, headless = false) => {
	await WriteTypeAndName(out, entry.type, name, headless);
	let info = Buffer.alloc(1 + 4);
	info.writeUInt8(entry.contentType);
	info.writeInt32BE((entry.value as Entry[]).length, 1);
	await WriteBuf(out, info);
	for (let v of entry.value as Entry[])
		await WriteSwitch(out, entry.contentType, v, null, true);
}
// headless = !!name
const WriteCompound = async (out: fs.WriteStream, entry: Entry, name?: string, headless = false) => {
	await WriteTypeAndName(out, TYPE('compound'), name, headless);
	for (let [name, child] of Object.entries(entry.value) as [string, Entry][])
		await WriteSwitch(out, child.type, child, name);
	// WriteInline(TYPE('byte'), , 'seenCredits');
	let buf = Buffer.alloc(1);
	buf.writeUInt8(TYPE('end'));
	await WriteBuf(out, buf);
}

export default {
	ReadXML(filename: string): Entry {
		let parser = new XMLParser({ preserveOrder: true, ignoreAttributes: false, attributeNamePrefix: "", allowBooleanAttributes: true, ignoreDeclaration: true });
		let json = parser.parse(fs.readFileSync(filename)) as XMLEntry[];
		return Entrify(json[0])[1];
	},
	// 'tests/result.dat.uncompressed'
	async WriteNBT(filename: string, root: Entry): Promise<void> {
		let nbtOut = fs.createWriteStream(filename, 'binary');
		await WriteCompound(nbtOut, root);
		await nbtOut.close();
	}
}