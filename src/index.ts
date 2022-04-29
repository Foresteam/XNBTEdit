import chokidar from 'chokidar';
import cmdargs from 'command-line-args';
import cmdusage from 'command-line-usage';
import 'colors';
import { exit } from 'process';
import fs from 'fs';
import os from 'os';
import tempy from 'tempy';
import { basename } from 'path';
import { spawn } from 'child_process';
import Reader from './Reader.js';
import Writer from './Writer.js';

interface IConfig {
	editor?: string;
}
class Config {
	filename: string;
	default: IConfig;
	wasSaved: boolean;
	self: IConfig;

	constructor(filename: string, _default: IConfig = {}) {
		this.filename = filename;
		this.default = _default;
		fs.watchFile(this.filename, (curr, prev) => {
			if (this.wasSaved)
				this.wasSaved = false;
			else
				this.load();
		});
		this.load();
	}
	load() {
		try { this.self = JSON.parse(fs.readFileSync(this.filename).toString('utf-8')); } catch { this.self = this.default; }
	}
	save() {
		this.wasSaved = true;
		fs.writeFileSync(this.filename, JSON.stringify(this.self, null, '\t'));
	}
}

const optionList = [
	{ name: 'help', type: Boolean, description: 'Show help' },
	{ name: 'set-editor', type: String, description: 'Set the path to your favourite editor' },
	{ name: 'compression', alias: 'c', type: String, description: 'Use GZip to compress/decompress (gzip|none)? If not specified, will guess by extension (or header)' },
	{ name: 'input', alias: 'i', type: String, description: 'Input file: XML, or NBT', defaultOption: true },
	{ name: 'out', alias: 'o', type: String, description: 'Output file: XML, or NBT. Leave empty to edit (the input file has to be NBT then).' },
];
const options = cmdargs(optionList);
const usage = cmdusage([
	{
		header: 'XNBTEdit'.cyan,
		content: [
			'Author: Foresteam (https://github.com/Foresteam)',
			'Git repository: https://github.com/Foresteam/XNBTEdit',
			'',
			'WARNING. Manually editing NBT files is not safe. So be sure you know what you\'re doing. Or, at least, create a backup. If you didn\'t and something went wrong, you can try to load the previous version, saved in the same folder with .backup extension.'.red,
			'',
			'Edit NBT files with ease, or only convert them to XML and back.',
			'xnbtedit [options] {underline <input_file>} [{bold --out} {underline file}]',
		]
	},
	{
		header: 'Examples',
		content: [
			'Open compressed file for edit:'.italic.dim,
			`${'xnbtedit'.green} {bold --compression=gzip} {underline example.dat}`,
			'Convert from uncompressed .dat to xml:'.italic.dim,
			`${'xnbtedit'.green} {underline example.dat.uncompressed} {bold --out} {underline example.xml}`,
			'Convert from xml to .dat, {underline compress (implicit)} (gzip assumed):'.italic.dim,
			`${'xnbtedit'.green} {underline example.xml} {bold --out} {underline example.dat}`,
			'Convert from xml to .dat, {underline do not compress (explicit)} (despite the .dat extension):'.italic.dim,
			`${'xnbtedit'.green} {bold -c} {underline none} {underline example.xml} {bold --out} {underline example.dat}`,
			'Set the editor:'.italic.dim,
			`${'xnbtedit'.green} {bold --set-editor} {underline vscodium}`
		]
	},
	{
		header: 'Options',
		optionList
	}
])

if (options.help) {
	console.log(usage);
	exit();
}


const APPDATA = os.platform() == 'linux' ? os.homedir() + '/.config/XNBTEdit/' : '';
const CONFIG = APPDATA + 'config.json';
try { APPDATA && fs.mkdirSync(APPDATA); } catch { }

let config = new Config(CONFIG, {});

const Main = () => {
	if (options['set-editor']) {
		config.self.editor = options['set-editor'];
		config.save();
		console.log(`Configuration written to "${CONFIG}".`);
		exit(0);
	}

	let { input, out } = options as { input?: string, out?: string };
	let gzip: boolean = options.compression == 'gzip' ? true : (options.compression == 'none' ? false : undefined);

	if (!input) {
		console.log('No input file specified.');
		exit(1);
	}

	const XML2NBT = async () => {
		if (!out) {
			console.log('Destination should be specified for XML --input.');
			exit(1);
		}
		console.log(`Writing to ${out}`);
		await Writer.WriteNBT(out, Writer.ReadXML(input), gzip);
	}
	if ((input as string).endsWith('.xml')) {
		gzip ||= gzip == undefined && !out.endsWith('.uncompressed');
		XML2NBT().then(() => exit(0));
	}
	else (async () => {
		if (gzip == undefined) {
			let istream = fs.createReadStream(input, { mode: 1 });
			let header: Buffer = await new Promise(resolve => istream.on('readable', () => resolve(istream.read(3))));
			gzip = header.compare(new Uint8Array([0x1f, 0x8b, 0x08])) == 0;
		}
		let edit = !out;
		if (!out)
			out = tempy.file({ 'name': basename(input) + '.xml' });
		Reader.WriteXML(out, Reader.ReadNBT(input, gzip));
		fs.writeFile(input + '.backup', fs.readFileSync(input, 'binary'), 'binary', () => console.log(`Saved previous data as ${input}.backup`));
		if (!edit)
			exit(0);
		let watcher = chokidar.watch(out, { awaitWriteFinish: true });
		watcher.on('change', () => {
			console.log(`Writing to ${input}`);
			Writer.WriteNBT(input, Writer.ReadXML(out), gzip);
		});
		spawn(config.self.editor, [out]);

		process.on('exit', () => {
			watcher.close();
			fs.rmSync(out);
		});
		process.on('SIGINT', process.exit);
	})();
};

Main();

// mutf8. Later...
// function encodeUTF8(str) {
// 	var array = [], i, c;
// 	for (i = 0; i < str.length; i++) {
// 		c = str.charCodeAt(i);
// 		if (c < 0x80) {
// 			array.push(c);
// 		} else if (c < 0x800) {
// 			array.push(0xC0 | c >> 6);
// 			array.push(0x80 | c & 0x3F);
// 		} else if (c < 0x10000) {
// 			array.push(0xE0 | c >> 12);
// 			array.push(0x80 | (c >> 6) & 0x3F);
// 			array.push(0x80 | c & 0x3F);
// 		} else {
// 			array.push(0xF0 | (c >> 18) & 0x07);
// 			array.push(0x80 | (c >> 12) & 0x3F);
// 			array.push(0x80 | (c >> 6) & 0x3F);
// 			array.push(0x80 | c & 0x3F);
// 		}
// 	}
// 	return array;
// }

// function decodeUTF8(array) {
// 	var codepoints = [], i;
// 	for (i = 0; i < array.length; i++) {
// 		if ((array[i] & 0x80) === 0) {
// 			codepoints.push(array[i] & 0x7F);
// 		} else if (i + 1 < array.length &&
// 			(array[i] & 0xE0) === 0xC0 &&
// 			(array[i + 1] & 0xC0) === 0x80) {
// 			codepoints.push(
// 				((array[i] & 0x1F) << 6) |
// 				(array[i + 1] & 0x3F));
// 		} else if (i + 2 < array.length &&
// 			(array[i] & 0xF0) === 0xE0 &&
// 			(array[i + 1] & 0xC0) === 0x80 &&
// 			(array[i + 2] & 0xC0) === 0x80) {
// 			codepoints.push(
// 				((array[i] & 0x0F) << 12) |
// 				((array[i + 1] & 0x3F) << 6) |
// 				(array[i + 2] & 0x3F));
// 		} else if (i + 3 < array.length &&
// 			(array[i] & 0xF8) === 0xF0 &&
// 			(array[i + 1] & 0xC0) === 0x80 &&
// 			(array[i + 2] & 0xC0) === 0x80 &&
// 			(array[i + 3] & 0xC0) === 0x80) {
// 			codepoints.push(
// 				((array[i] & 0x07) << 18) |
// 				((array[i + 1] & 0x3F) << 12) |
// 				((array[i + 2] & 0x3F) << 6) |
// 				(array[i + 3] & 0x3F));
// 		}
// 	}
// 	return String.fromCharCode.apply(null, codepoints);
// }