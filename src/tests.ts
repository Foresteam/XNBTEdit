import fs from 'fs';
import { spawnSync } from 'child_process';
import 'colors';
import tempy from 'tempy';

import Reader from './Reader.js';
import Writer from './Writer.js';

const Hash = async (file: string): Promise<string> => spawnSync('sha512sum', ['-b', file]).output.toString().split(' ')[0].substring(1);
const CompressedHash = (file: string): Promise<string> => new Promise(resolve => tempy.file.task(async t => {
	fs.writeFileSync(t, fs.readFileSync(file).subarray(10));
	resolve(await Hash(t));
}));
const Compare = async (f1: string, f2: string, gzip: boolean) => {
	const hashFunc = gzip ? CompressedHash : Hash;
	let [inHash, outHash] = [await hashFunc(f1), await hashFunc(f2)];
	// let inHash = spawnSync('sha512sum', ['-b', f1]).output.toString().split(' ')[0].substring(1);
	// let outHash = spawnSync('sha512sum', ['-b', f2]).output.toString().split(' ')[0].substring(1);
	fs.writeFileSync(`${f1}.sha512`, inHash);
	fs.writeFileSync(`${f2}.sha512`, outHash);
	console.log((inHash == outHash && inHash && outHash) ? 'Files are indentical (success!)'.green : 'Files are different (bugs again?)'.red);
}

(async () => {
	let input = 'tests/test.dat', output = 'tests/result';

	console.log('#1 Simple nbt-xml-nbt conversion (compressed)');
	await Reader.N2XPipe(input, 'tests/temp_edit1.xml', { gzip: true, parseSNBT: false });
	await Writer.X2NPipe('tests/temp_edit1.xml', `${output}1.dat`, { gzip: true });
	await Compare(input, `${output}1.dat`, true);

	// fails. The cause seems to be Mojangson parser removing quotes that are not necessary
	console.log('#2 Nbt-xml-nbt conversion + SNBT parsing (compressed)');
	await Reader.N2XPipe(input, 'tests/temp_edit2.xml', { gzip: true, parseSNBT: true })
	await Writer.X2NPipe('tests/temp_edit2.xml', `${output}2.dat`, { gzip: true })
	await Compare(input, `${output}2.dat`, true);

	input = 'tests/test.dat.uncompressed', output = 'tests/result';

	console.log('#3 Simple nbt-xml-nbt conversion (uncompressed)');
	await Reader.N2XPipe(input, 'tests/temp_edit3.xml', { gzip: false, parseSNBT: false });
	await Writer.X2NPipe('tests/temp_edit3.xml', `${output}1.dat.uncompressed`, { gzip: false });
	await Compare(input, `${output}1.dat.uncompressed`, false);

	// fails. The cause seems to be Mojangson parser removing quotes that are not necessary
	console.log('#4 Nbt-xml-nbt conversion + SNBT parsing (uncompressed)');
	await Reader.N2XPipe(input, 'tests/temp_edit4.xml', { gzip: false, parseSNBT: true })
	await Writer.X2NPipe('tests/temp_edit4.xml', `${output}2.dat.uncompressed`, { gzip: false })
	await Compare(input, `${output}2.dat.uncompressed`, false);
})();