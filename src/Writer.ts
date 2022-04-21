import fs from 'fs';
import { TYPES, TYPE, IS_INLINE, Entry } from './Common';

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
	entry.type = TYPE(type);
	if (IS_INLINE(TYPE(type)))
		entry.value = (entries as XMLEntry[])[0]['#text'];
	else if (type == 'list' || type.indexOf('array') >= 0)
		entry.value = (entries as XMLEntry[]).map(e => Entrify(e)[1]);
	else if (type == 'compound')
		entry.value = Object.fromEntries((entries as XMLEntry[]).map(e => Entrify(e)));
	if (tag[':@']?.of)
		entry.contentType = TYPE(tag[':@'].of);
	return [tag[':@']?.name, entry];
}

import { XMLParser } from 'fast-xml-parser';
let parser = new XMLParser({ preserveOrder: true, ignoreAttributes: false, attributeNamePrefix: "", allowBooleanAttributes: true, ignoreDeclaration: true });
let json = parser.parse(fs.readFileSync('tests/lol.xml')) as XMLEntry[];
fs.writeFileSync('tests/kek.json', JSON.stringify(Entrify(json[0])[1], null, '\t'));