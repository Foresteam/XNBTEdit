import assert from 'assert';
import { describe, it } from 'mocha';

import fs from 'fs';
import crypto from 'crypto';

import Writer from '../src/backend/Writer';
import Reader from '../src/backend/Reader';

const getHash = (fn: string) => {
	const fileBuffer = fs.readFileSync(fn);
	const hashSum = crypto.createHash('sha256');
	hashSum.update(fileBuffer as any);

	return hashSum.digest('hex');
}
const twoWayTest = (input: string, reference = ''): string[] => {
	if (!reference)
		reference = input;
	const nbt = input + '.nbt';
	const result = input + '.result';
	Writer.X2NPipe(input, nbt);
	Reader.N2XPipe(nbt, result);

	return [getHash(result), getHash(reference)];
}

describe('XML => NBT', () => {
	describe('Ints', () => 
		it('Should be the same after 2way conversion', () => {
			const tests = twoWayTest('data/testNums.xml')
			assert.equal(tests[0], tests[1]);
		})
	)
});