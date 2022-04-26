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
	let input = 'tests/test.dat', output = 'tests/result';

	// check fails with gzip pack/unpack. Different versions?
	console.log('#1 Simple nbt-xml-nbt conversion');
	Reader.WriteXML('tests/temp_edit1.xml', Reader.ReadNBT(input, true, false));
	await Writer.WriteNBT(`${output}1.dat`, Writer.ReadXML('tests/temp_edit1.xml'), true);
	Compare(input, `${output}1.dat`);

	// fails. The cause seems to be Mojangson parser removing quotes that are not necessary
	console.log('#2 Nbt-xml-nbt conversion + SNBT parsing');
	Reader.WriteXML('tests/temp_edit2.xml', Reader.ReadNBT(input, true, true));
	await Writer.WriteNBT(`${output}2.dat`, Writer.ReadXML('tests/temp_edit2.xml'), true);
	Compare(input, `${output}2.dat`);
})();