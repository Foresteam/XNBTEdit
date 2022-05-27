import { create as XMLBegin } from 'xmlbuilder2';
import fs from 'fs';
import { XMLBuilder } from 'xmlbuilder2/lib/interfaces';
import { gunzipSync } from 'zlib';
import { TYPES, TYPE, Entry, NBTType, Mojangson2Entry, PipeOptions } from './Common.js';
import mojangson from '@foresteam/mojangson';
import { promisify } from 'util';

interface RSReturn {
	entry: Entry;
	endPos: number;
	name?: string;
};
class Reader {
	buffer: Buffer;
	parseSNBT: boolean;
	constructor(buffer: Buffer, parseSNBT: boolean) {
		this.buffer = buffer;
		this.parseSNBT = parseSNBT;
	}
	GetName(pos: number, headless: boolean) {
		if (headless)
			return { name: null, offset: 0 };
		let len = this.buffer.readUInt16BE(pos);
		return {
			name: this.buffer.toString('binary', pos + 2, pos + 2 + len),
			offset: 2 + len
		};
	}
	ReadNumber(pos: number, type: number, headless = false): RSReturn {
		let self: Entry = { type, value: null };
		let { name, offset: nameOffset } = this.GetName(pos, headless);
		pos += nameOffset;
		switch (type) {
			case TYPE('byte'):
				self.value = this.buffer.readInt8(pos);
				pos += 1;
				break;
			case TYPE('short'):
				self.value = this.buffer.readInt16BE(pos);
				pos += 2;
				break;
			case TYPE('int'):
				self.value = this.buffer.readInt32BE(pos);
				pos += 4;
				break;
			case TYPE('long'):
				self.value = this.buffer.readBigInt64BE(pos);
				pos += 8;
				break;
			case TYPE('float'):
				self.value = this.buffer.readFloatBE(pos);
				pos += 4;
				break;
			case TYPE('double'):
				self.value = this.buffer.readDoubleBE(pos);
				pos += 8;
				break;
		}
		return { entry: self, endPos: pos, name };
	};
	ReadString(pos: number, type: number, headless = false): RSReturn {
		let self: Entry = { type, value: null };
		let { name, offset: nameOffset } = this.GetName(pos, headless);
		pos += nameOffset;
		let len = this.buffer.readUInt16BE(pos);
		pos += 2;
		self.value = this.buffer.toString('binary', pos, pos + len);

		if ('{['.indexOf(self.value && self.value[0]) >= 0 && this.parseSNBT) {
			self.value = Mojangson2Entry(mojangson.parse(self.value));
			self.type = TYPE('snbt');
		}

		return { entry: self, endPos: pos + len, name };
	};
	ReadArray(pos: number, type: number, headless = false): RSReturn {
		let self: Entry = { type, value: [], contentType: TYPE(TYPES[type].replace('[]', '') as NBTType) };
		let { name, offset: nameOffset } = this.GetName(pos, headless);
		pos += nameOffset;
		let len = this.buffer.readInt32BE(pos);
		pos += 4;
		for (let i = 0; i < len; i++) {
			let entryInfo = this.ReadNumber(pos, self.contentType, true);
			(self.value as Entry[]).push(entryInfo.entry);
			pos = entryInfo.endPos;
		}
		return { entry: self, endPos: pos, name }
	};

	_TheSwitch(pos: number, type: number, headless: boolean): RSReturn {
		let entryInfo: RSReturn;
		if (type <= TYPE('double'))
			entryInfo = this.ReadNumber(pos, type, headless);
		else if (type == TYPE('string'))
			entryInfo = this.ReadString(pos, type, headless);
		else if (type == TYPE('list'))
			entryInfo = this.ReadList(pos, type, headless);
		else if (type == TYPE('compound'))
			entryInfo = this.ReadCompound(pos, type, headless);
		else if (type == TYPE('byte[]') || type >= TYPE('int[]'))
			entryInfo = this.ReadArray(pos, type, headless);
		return entryInfo;
	}
	ReadList(pos: number, _type: number, headless = false): RSReturn {
		let self: Entry = { value: [], type: _type };
		let { name, offset: nameOffset } = this.GetName(pos, headless);
		pos += nameOffset;
		// TYPE('byte')
		self.contentType = this.buffer.readInt8(pos);
		pos++
		// TYPE('int')
		let contentLength = this.buffer.readInt32BE(pos);
		pos += 4;
		for (let i = 0; i < contentLength; i++) {
			let entryInfo = this._TheSwitch(pos, self.contentType, true);
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
	ReadCompound(pos: number, _type: number, headless = false): RSReturn {
		let self: Entry = { value: {}, type: _type };
		let { name, offset: nameOffset } = this.GetName(pos, headless);
		pos += nameOffset;
		while (pos < Buffer.byteLength(this.buffer)) {
			let type: number = this.buffer.readUInt8(pos);
			if (type == TYPE('end')) {
				pos++;
				break;
			}

			let entryInfo = this._TheSwitch(pos + 1, type, false);
			if (entryInfo) {
				self.value[entryInfo.name] = entryInfo.entry;
				pos = entryInfo.endPos;
				continue;
			}
			pos++;
		}
		return { entry: self, endPos: pos, name };
	};
}

const BuildXML = (block: Entry, parent: XMLBuilder, root = false, name?: string): void => {
	// console.log(block.type, block);
	if (typeof block.value != 'object') {
		// not sure it's a good idea, but it greatly boosts readability
		if (block.type == TYPE('byte') && [0, 1].includes(block.value))
			block.value = block.value ? 'true' : 'false';
		parent.ele(TYPES[block.type], { name }).txt(block.value);
		return;
	}

	let tag: XMLBuilder;
	let named = false;
	if (block.type == TYPE('compound')) {
		named = true;
		if (root)
			tag = parent;
		else
			tag = parent.ele('compound', { name });
	}
	if (block.type == TYPE('list'))
		tag = parent.ele('list', { of: TYPES[block.contentType], name });
	if (TYPES[block.type].includes('[]')) {
		tag = parent.ele('array', { of: TYPES[block.contentType], name });
	}
	if (block.type == TYPE('snbt')) {
		tag = parent.ele('snbt', { name });
		block.value = [block.value];
	}

	for (let [k, v] of Object.entries(block.value))
		BuildXML(v as Entry, tag, false, named ? k : null);
};


const ReadNBT = ({ nbtBytes, gunzip = false, parseSNBT = true, filename }: { nbtBytes?: Buffer, gunzip?: boolean, parseSNBT?: boolean, filename?: string }): Entry => {
	if (filename)
		nbtBytes = fs.readFileSync(filename);
	if (gunzip)
		nbtBytes = gunzipSync(nbtBytes);
	return new Reader(nbtBytes, parseSNBT).ReadCompound(1, TYPE('compound')).entry;
};
const WriteXML = async ({ data, filename }: { data: Entry, filename?: string }): Promise<string|void> => {
	let root = XMLBegin();
	root.dtd({ sysID: 'https://raw.githubusercontent.com/Foresteam/XNBTEdit/master/document.dtd' });
	root.com('Generated with XNBTEdit by Foresteam (https://github.com/Foresteam/XNBTEdit)');
	root = root.ele('compound');
	BuildXML(data, root, true);
	let xml = root.end({ prettyPrint: true, indent: '\t' });
	if (filename)
		await promisify(fs.writeFile)(filename, xml);
	else
		return xml;
};
const N2XPipe = async (nbtInput: string, xmlOutput: string, { gzip: gunzip, parseSNBT }: PipeOptions = {}): Promise<void> => {
	await WriteXML({ filename: xmlOutput, data: ReadNBT({ filename: nbtInput, gunzip, parseSNBT }) });
}

export default { ReadNBT, WriteXML, N2XPipe}