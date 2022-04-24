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

export { TYPES, TYPE, IS_INLINE, IS_ARRAY, Entry, NBTType, Mojangson2Entry, Entry2Mojangson };