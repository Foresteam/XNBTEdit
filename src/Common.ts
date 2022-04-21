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
	length: 13
});
const TYPE = (name: string) => TYPES.indexOf(name);
const IS_INLINE = (type: number) => type <= TYPE('double') && type > 0 || type == 8;

interface Entry {
	type: number;
	contentType?: number;
	value: any;
};
export { TYPES, TYPE, IS_INLINE, Entry };