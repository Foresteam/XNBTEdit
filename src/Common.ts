import { MojangsonEntry } from "mojangson";

/**
 * Types assoc.
 * I should stop writing inlines in TS....
 * */
// const TYPES = Array.from(((v: { [index: number]: string }): ArrayLike<string> => ({ length: Object.entries(v).length, ...Object.entries(v) }))({
// 	0: 'end',
// 	1: 'byte',
// 	2: 'short',
// 	3: 'int',
// 	4: 'long',
// 	5: 'float',
// 	6: 'double',
// 	7: 'byte[]',
// 	8: 'string',
// 	9: 'list',
// 	10: 'compound',
// 	11: 'int[]',
// 	12: 'long[]'
// }));
const TYPES = Array.from({
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
type NBTType = 'end' | 'byte' | 'short' | 'int' | 'long' | 'float' | 'double' | 'byte[]' | 'string' | 'list' | 'compound' | 'int[]' | 'long[]' | 'snbt';
const TYPE = (name: NBTType) => TYPES.indexOf(name);
const IS_INLINE = (type: number) => type <= TYPE('double') && type > 0 || type == TYPE('string') || type == TYPE('snbt');
const IS_ARRAY = (type: number) => type == TYPE('byte[]') || type >= TYPE('int[]') && type != TYPE('snbt');

interface Entry {
	type: number;
	contentType?: number;
	value: any;
};

const Mojangson2Entry = (mjvalue: any, type?: string): Entry => {
	type ||= mjvalue.type;
	// console.log('#1', mjvalue, type);
	if (type == 'list') {
		let result: Entry = { value: null, type: 0 };
		result.type = TYPE('list');
		result.contentType = mjvalue.value.type;
		result.value = (mjvalue.value.value as any[]).map(v => Mojangson2Entry(v, TYPES[result.contentType]));
		return result;
	}
	if (type.indexOf('Array') >= 0) {
		let result: Entry = { value: null, type: 0 };
		result.type = TYPE((mjvalue.value.type + '[]') as NBTType);
		result.contentType = mjvalue.value.type;
		result.value = (mjvalue.value.value as any[]).map(v => ({ value: v, type: result.contentType } as Entry));
		return result;
	}
	// console.log('#2', mjvalue.value, Object.entries(mjvalue.value));
	if (type == 'compound') {
		return {
			type: TYPE('compound'),
			value: Object.fromEntries(Object.entries(mjvalue.value).map(([k, v]) => ([k, Mojangson2Entry(v)])))
		};
	}
	return { value: mjvalue.value || mjvalue, type: TYPE(type as NBTType) };
};
const MojangsonType = (type: NBTType): string => type.indexOf('[]') >= 0 ? type.replace('[]', 'Array') : type;
const Entry2Mojangson = (entry: Entry): MojangsonEntry => {
	if (TYPES[entry.type] == 'list')
		return {
			type: MojangsonType(TYPES[entry.type]),
			value: {
				type: MojangsonType(TYPES[entry.contentType]),
				value: (entry.value as Entry[]).map(v => Entry2Mojangson(v.value))
			}
		};
	if (TYPES[entry.type].indexOf('[]') >= 0)
		return {
			type: MojangsonType(TYPES[entry.type]),
			value: {
				type: MojangsonType(TYPES[entry.contentType]),
				value: (entry.value as Entry[]).map(v => v.value)
			}
		};
	if (TYPES[entry.type] == 'compound')
		return {
			type: MojangsonType(TYPES[entry.type]),
			value: Object.fromEntries(Object.entries(entry.value).map(([k, v]) => ([k, Entry2Mojangson(v as Entry)])))
		}
	return { value: entry.value, type: MojangsonType(TYPES[entry.type]) };
};

// to be implemented...
const encodeUTF8 = (str: string): number[] => {
	var array = [], i, c;
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
	var codepoints = [], i;
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

type PipeOptions = {
	parseSNBT?: boolean;
	gzip?: boolean;
};

export { TYPES, TYPE, IS_INLINE, IS_ARRAY, Entry, NBTType, Mojangson2Entry, Entry2Mojangson, PipeOptions };