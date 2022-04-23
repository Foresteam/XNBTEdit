import fs from 'fs';
import { spawnSync } from 'child_process';
import 'colors';

import Reader from './Reader.js';
import Writer from './Writer.js';

const Compare = (f1: string, f2: string) => {
	let inHash = spawnSync('sha512sum', ['-b', f1]).output.toString().split(' ')[0].substring(1);
	let outHash = spawnSync('sha512sum', ['-b', f2]).output.toString().split(' ')[0].substring(1);
	fs.writeFileSync(`${f1}.sha512`, inHash);
	fs.writeFileSync(`${f2}.sha512`, outHash);
	console.log((inHash == outHash && inHash && outHash) ? 'Files are indentical (success!)'.green : 'Files are different (bugs again?)'.red);
}

(async () => {
	let input = 'tests/level.dat', output = 'tests/result.dat';

	console.log('#1 Simple nbt-xml-nbt conversion');
	Reader.WriteXML('tests/temp_edit.xml', Reader.ReadNBT(input, true));
	await Writer.WriteNBT(output, Writer.ReadXML('tests/temp_edit.xml'), true);
	Compare(input, output);
})();