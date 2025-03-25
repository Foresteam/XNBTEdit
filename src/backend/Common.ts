import { MojangsonEntry, type MojangsonAnyType, type MojangsonArrayType, type MojangsonArrayElementType, type MojangsonElementaryType, MojangsonAnyValue, MojangsonList, MojangsonArray, MojangsonCompound } from "@foresteam/mojangson";
import IConfig from '../shared/IConfig';
import fs from 'fs';

export const TYPES = Array.from({
	0: 'end',
	1: 'byte',
	2: 'short',
	3: 'int',
	4: 'long',
	5: 'float',
	6: 'double',
	7: 'byte[]',
	8: 'string',
	9: 'list',
	10: 'compound',
	11: 'int[]',
	12: 'long[]',
	13: 'snbt',
	length: 14
}) as NBTType[];
export type NBTType = 'end' | 'byte' | 'short' | 'int' | 'long' | 'float' | 'double' | 'byte[]' | 'string' | 'list' | 'compound' | 'int[]' | 'long[]' | 'snbt';
export const TYPE = (name: NBTType) => TYPES.indexOf(name);
export const IS_INLINE = (type: number) => type <= TYPE('double') && type > 0 || type == TYPE('string') || type == TYPE('snbt');
export const IS_ARRAY = (type: number) => type == TYPE('byte[]') || type >= TYPE('int[]') && type != TYPE('snbt');

export interface Entry {
	type: number;
	contentType?: number;
	value: Entry | Entry[] | (number | string | boolean | bigint) | { [key: string]: Entry } | Exclude<MojangsonAnyValue, MojangsonEntry>;
}

export const Mojangson2Entry = (mjvalue: MojangsonAnyValue, type?: string): Entry => {
		type ||= (mjvalue as MojangsonEntry).type as string;
	// console.log('#1', mjvalue, type);
	if (type == 'list') {
		const interp = mjvalue as MojangsonList;
		const result = { type: 0 } as Entry;
		result.type = TYPE('list');
		result.contentType = TYPE(interp.value.type.replace('[]', 'Array') as NBTType);
		result.value = interp.value.value.map(v => Mojangson2Entry(v, TYPES[result.contentType as number]));
		return result;
	}
	if (type.indexOf('Array') >= 0) {
		const interp = mjvalue as MojangsonArray;
		const result = { type: 0 } as Entry;
		result.type = TYPE((interp.value.type + '[]') as NBTType);
		result.contentType = TYPE(interp.value.type);
		result.value = interp.value.value.map(v => ({ value: v, type: result.contentType } as Entry));
		return result;
	}
	// console.log('#2', mjvalue.value, Object.entries(mjvalue.value));
	if (type == 'compound') {
		const interp = mjvalue as MojangsonCompound;
		return {
			type: TYPE('compound'),
			value: Object.fromEntries(Object.entries(interp.value).map(([k, v]) => ([k, Mojangson2Entry(v)])))
		};
	}
	const value = <Exclude<MojangsonAnyValue, MojangsonEntry>>((mjvalue as MojangsonEntry).value || mjvalue);
	if (type === 'byte')
		console.log(type, value);
	return { value, type: TYPE(type as NBTType) };
};
const MojangsonType = (type: NBTType) => (type.indexOf('[]') >= 0 ? type.replace('[]', 'Array') : type) as MojangsonAnyType;
export const Entry2Mojangson = (entry: Entry): MojangsonEntry => {
	if (TYPES[entry.type] == 'list')
		return {
			type: MojangsonType(TYPES[entry.type]) as 'list',
			value: {
				type: MojangsonType(TYPES[entry.contentType as number]),
				value: (entry.value as Entry[]).map(v => Entry2Mojangson(v.value as Entry))
			}
		};
	if (TYPES[entry.type].indexOf('[]') >= 0)
		return {
			type: MojangsonType(TYPES[entry.type]) as MojangsonArrayType,
			value: {
				type: MojangsonType(TYPES[entry.contentType as number]) as MojangsonArrayElementType,
				value: (entry.value as Entry[]).map(v => v.value) as number[]
			}
		};
	if (TYPES[entry.type] == 'compound')
		return {
			type: MojangsonType(TYPES[entry.type]) as 'compound',
			value: Object.fromEntries(Object.entries(entry.value).map(([k, v]) => ([k, Entry2Mojangson(v as Entry)])))
		}
	return <MojangsonEntry>{
		value: entry.value as (string | boolean | number),
		type: MojangsonType(TYPES[entry.type]) as MojangsonElementaryType
	};
};

// to be implemented...
const encodeUTF8 = (str: string): number[] => {
	const array: number[] = [];
	let i: number, c: number;
	for (i = 0; i < str.length; i++) {
		c = str.charCodeAt(i);
		if (c < 0x80) {
			array.push(c);
		} else if (c < 0x800) {
			array.push(0xC0 | c >> 6);
			array.push(0x80 | c & 0x3F);
		} else if (c < 0x10000) {
			array.push(0xE0 | c >> 12);
			array.push(0x80 | (c >> 6) & 0x3F);
			array.push(0x80 | c & 0x3F);
		} else {
			array.push(0xF0 | (c >> 18) & 0x07);
			array.push(0x80 | (c >> 12) & 0x3F);
			array.push(0x80 | (c >> 6) & 0x3F);
			array.push(0x80 | c & 0x3F);
		}
	}
	return array;
}
const decodeUTF8 = (array: Uint8Array): string => {
	const codepoints: number[] = [];
	let i: number;
	for (i = 0; i < array.length; i++) {
		if ((array[i] & 0x80) === 0) {
			codepoints.push(array[i] & 0x7F);
		} else if (i + 1 < array.length &&
			(array[i] & 0xE0) === 0xC0 &&
			(array[i + 1] & 0xC0) === 0x80) {
			codepoints.push(
				((array[i] & 0x1F) << 6) |
				(array[i + 1] & 0x3F));
		} else if (i + 2 < array.length &&
			(array[i] & 0xF0) === 0xE0 &&
			(array[i + 1] & 0xC0) === 0x80 &&
			(array[i + 2] & 0xC0) === 0x80) {
			codepoints.push(
				((array[i] & 0x0F) << 12) |
				((array[i + 1] & 0x3F) << 6) |
				(array[i + 2] & 0x3F));
		} else if (i + 3 < array.length &&
			(array[i] & 0xF8) === 0xF0 &&
			(array[i + 1] & 0xC0) === 0x80 &&
			(array[i + 2] & 0xC0) === 0x80 &&
			(array[i + 3] & 0xC0) === 0x80) {
			codepoints.push(
				((array[i] & 0x07) << 18) |
				((array[i + 1] & 0x3F) << 12) |
				((array[i + 2] & 0x3F) << 6) |
				(array[i + 3] & 0x3F));
		}
	}
	return String.fromCharCode.apply(null, codepoints);
}

export type PipeOptions = {
	parseSNBT?: boolean;
	gzip?: boolean;
};

export class Config {
	filename: string;
	default: IConfig;
	wasSaved: boolean;
	#self: IConfig;

	constructor(filename: string, _default: IConfig = {}) {
		this.filename = filename;
		this.default = _default;
		this.wasSaved = false;
		this.#self = {};
		fs.watchFile(this.filename, () => {
			if (this.wasSaved)
				this.wasSaved = false;
			else
				this.load();
		});
		this.load();
	}
	get() {
		return Object.assign({}, this.#self);
	}
	set<T extends keyof IConfig>(field: T, value: IConfig[T], save = true) {
		this.#self[field] = value;
		save && this.save();
	}
	load() {
		try { this.#self = JSON.parse(fs.readFileSync(this.filename).toString('utf-8')); } catch { this.#self = this.default; }
	}
	save() {
		this.wasSaved = true;
		fs.writeFileSync(this.filename, JSON.stringify(this.#self, null, '\t'));
	}
}

export function RenameKey<T extends object, K extends keyof T>(this: T, old: K, _new: string) {
	delete Object.assign(this, { [_new]: this[old] })[old];
	return this;
}