import XMLBuilder, { XMLElement } from 'xmlbuilder';
import fs from 'fs';
import { TYPES, TYPE, Entry, NBTType } from './Common';

let nbtBytes: Buffer;

let data: Entry;

const GetName = (pos: number, bytes: Buffer, headless: boolean) => {
	if (headless)
		return { name: null, offset: 0 };
	let len = bytes.readUInt16BE(pos);
	return {
		name: bytes.toString('utf-8', pos + 2, pos + 2 + len),
		offset: 2 + len
	};
};

interface RSReturn {
	entry: Entry;
	endPos: number;
	name?: string;
};
const ReadNumber = (buffer: Buffer, pos: number, type: number, headless = false): RSReturn => {
	let self: Entry = { type, value: null };
	let { name, offset: nameOffset } = GetName(pos, buffer, headless);
	pos += nameOffset;
	switch (type) {
		case TYPE('byte'):
			self.value = nbtBytes.readInt8(pos);
			pos += 1;
			break;
		case TYPE('short'):
			self.value = nbtBytes.readInt16BE(pos);
			pos += 2;
			break;
		case TYPE('int'):
			self.value = nbtBytes.readInt32BE(pos);
			pos += 4;
			break;
		case TYPE('long'):
			self.value = nbtBytes.readBigUInt64BE(pos);
			pos += 8;
			break;
		case TYPE('float'):
			self.value = nbtBytes.readFloatBE(pos);
			pos += 4;
			break;
		case TYPE('double'):
			self.value = nbtBytes.readDoubleBE(pos);
			pos += 8;
			break;
	}
	return { entry: self, endPos: pos, name };
};
const ReadString = (buffer: Buffer, pos: number, type: number, headless = false): RSReturn => {
	let self: Entry = { type, value: null };
	let { name, offset: nameOffset } = GetName(pos, buffer, headless);
	pos += nameOffset;
	let len = buffer.readUInt16BE(pos);
	pos += 2;
	self.value = buffer.toString('utf-8', pos, pos + len);
	return { entry: self, endPos: pos + len, name };
};
const ReadArray = (buffer: Buffer, pos: number, type: number, headless = false): RSReturn => {
	let self: Entry = { type, value: [], contentType: TYPE(TYPES[type].replace('[]', '') as NBTType) };
	let { name, offset: nameOffset } = GetName(pos, buffer, headless);
	pos += nameOffset;
	let len = buffer.readInt32BE(pos);
	pos += 4;
	for (let i = 0; i < len; i++) {
		let entryInfo = ReadNumber(buffer, pos, self.contentType, true);
		(self.value as Entry[]).push(entryInfo.entry);
		pos = entryInfo.endPos;
	}
	return { entry: self, endPos: pos, name }
};

const _TheSwitch = (buffer: Buffer, pos: number, type: number, headless: boolean): RSReturn => {
	let entryInfo: RSReturn;
	if (type <= TYPE('double'))
		entryInfo = ReadNumber(buffer, pos, type, headless);
	else if (type == TYPE('string'))
		entryInfo = ReadString(buffer, pos, type, headless);
	else if (type == TYPE('list'))
		entryInfo = ReadList(buffer, pos, type, headless);
	else if (type == TYPE('compound'))
		entryInfo = ReadCompound(buffer, pos, type, headless);
	else if (type == TYPE('byte[]') || type >= TYPE('int[]'))
		entryInfo = ReadArray(buffer, pos, type, headless);
	return entryInfo;
}
const ReadList = (buffer: Buffer, pos: number, _type: number, headless = false): RSReturn => {
	let self: Entry = { value: [], type: _type };
	let { name, offset: nameOffset } = GetName(pos, buffer, headless);
	pos += nameOffset;
	// TYPE('byte')
	self.contentType = buffer.readInt8(pos);
	pos++
	// TYPE('int')
	let contentLength = buffer.readInt32BE(pos);
	pos += 4;
	for (let i = 0; i < contentLength; i++) {
		let entryInfo = _TheSwitch(buffer, pos, self.contentType, true);
		if (entryInfo) {
			(self.value as Entry[]).push(entryInfo.entry);
			pos = entryInfo.endPos;
		}
		else
			break;
	}
	return { entry: self, endPos: pos, name };
}
/** @param pos The buffer offset. The tag type is assumed to be already known, so it must be excluded */
const ReadCompound = (buffer: Buffer, pos: number, _type: number, headless = false): RSReturn => {
	let self: Entry = { value: {}, type: _type };
	let { name, offset: nameOffset } = GetName(pos, buffer, headless);
	pos += nameOffset;
	while (pos < Buffer.byteLength(nbtBytes)) {
		let type: number = nbtBytes.readUInt8(pos);
		if (type == TYPE('end')) {
			pos++;
			break;
		}

		let entryInfo = _TheSwitch(buffer, pos + 1, type, false);
		if (entryInfo) {
			self.value[entryInfo.name] = entryInfo.entry;
			pos = entryInfo.endPos;
			continue;
		}
		pos++;
	}
	return { entry: self, endPos: pos, name };
};

const BuildXML = (block: Entry, parent: XMLBuilder.XMLElement, root = false, name?: string): void => {
	if (typeof (block.value) != 'object') {
		// not sure it's a good idea, but it greatly boosts readability
		if (block.type == TYPE('byte') && [0, 1].includes(block.value))
			block.value = block.value ? 'true' : 'false';
		parent.element(TYPES[block.type], { name }, block.value);
		return;
	}

	let tag: XMLElement;
	let named = false;
	if (block.type == TYPE('compound')) {
		named = true;
		if (root)
			tag = parent;
		else
			tag = parent.element('compound', { name });
	}
	if (block.type == TYPE('list'))
		tag = parent.element('list', { of: TYPES[block.contentType], name });
	if (TYPES[block.type].includes('[]')) {
		tag = parent.element('array', { of: TYPES[block.contentType], name });
	}

	for (let [k, v] of Object.entries(block.value))
		BuildXML(v as Entry, tag, false, named ? k : null);
};


export default {
	ReadNBT() {
		data = ReadCompound(nbtBytes, 1, TYPE('compound')).entry;
		nbtBytes = fs.readFileSync('tests/test.dat.uncompressed')
		let root = XMLBuilder.create('compound');
		BuildXML(data, root, true);
		let xml = root.end({ pretty: true, indent: '\t' });
		// console.log(JSON.stringify(data, null, '\t'));
		fs.writeFileSync('tests/lol.xml', xml);
	}
}