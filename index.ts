import fs from 'fs';
import chokidar from 'chokidar';
import tempy from 'tempy';

let bytesNBT = fs.readFileSync('tests/test.dat.uncompressed');

let pos = 0;
while (pos < Buffer.byteLength(bytesNBT)) {
	

	pos++;
}