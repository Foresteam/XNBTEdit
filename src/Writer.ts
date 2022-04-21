import fs from 'fs';
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
			entry.type = TYPE(`${entry.contentType}[]` as NBTType);
	}
	return [tag[':@']?.name, entry];
}

let nbtOut: fs.WriteStream;
const WriteBuf = (buf: Buffer) => new Promise(resolve => nbtOut.write(buf, 'binary', resolve));
const WriteTypeAndName = async (type: number, name?: string, headless = false) => {
	if (headless)
		return false;
	let nameLen = name ? Buffer.from(name, 'utf-8').byteLength : 0;
	let buf = Buffer.alloc(1 + 2 + nameLen);
	buf.writeUInt8(type);
	buf.writeUInt16BE(nameLen, 1);
	if (name)
		buf.write(name, 3, 'utf-8');
	await WriteBuf(buf);
}
const WriteInline = async (type: number, entry: Entry, name?: string, headless = false) => {
	await WriteTypeAndName(type, name, headless);
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
	console.log(name, buf.toString('hex'), nbtOut.bytesWritten);
	await WriteBuf(buf);
	console.log(name, buf.toString('hex'), nbtOut.bytesWritten);
}
const WriteArray = async (entry: Entry, name?: string, headless = false) => {
	await WriteTypeAndName(entry.type, name, headless);
	let length = Buffer.alloc(4);
	length.writeInt32BE((entry.value as Entry[]).length);
	await WriteBuf(length);
	for (let v of entry.value as Entry[])
	await WriteInline(entry.contentType, v, null, true);
}
const WriteSwitch = async (type: number, entry: Entry, name?: string, headless = false) => {
	if (IS_INLINE(entry.type))
		await WriteInline(type, entry, name, headless);
	if (IS_ARRAY(entry.type))
		await WriteArray(entry, name, headless);
	if (entry.type == TYPE('list'))
		await WriteList(entry, name, headless);
	if (TYPES[entry.type] == 'compound')
		await WriteCompound(entry, name, headless);
}
const WriteList = async (entry: Entry, name?: string, headless = false) => {
	await WriteTypeAndName(entry.type, name, headless);
	let info = Buffer.alloc(1 + 4);
	info.writeUInt8(entry.contentType);
	info.writeInt32BE((entry.value as Entry[]).length);
	await WriteBuf(info);
	for (let v of entry.value as Entry[])
		await WriteSwitch(entry.contentType, v, null, true);
}
// headless = !!name
const WriteCompound = async (entry: Entry, name?: string, headless = false) => {
	await WriteTypeAndName(TYPE('compound'), name, headless);
	for (let [name, child] of Object.entries(entry.value) as [string, Entry][])
		await WriteSwitch(child.type, child, name);
	// WriteInline(TYPE('byte'), , 'seenCredits');
	let buf = Buffer.alloc(1);
	buf.writeUInt8(TYPE('end'));
	await WriteBuf(buf);
}

import { XMLParser } from 'fast-xml-parser';
import { exit } from 'process';
let parser = new XMLParser({ preserveOrder: true, ignoreAttributes: false, attributeNamePrefix: "", allowBooleanAttributes: true, ignoreDeclaration: true });
let json = parser.parse(fs.readFileSync('tests/lol.xml')) as XMLEntry[];
let root = Entrify(json[0])[1];
nbtOut = fs.createWriteStream('tests/result.dat.uncompressed', 'binary');
WriteCompound(root).then(() => nbtOut.close);