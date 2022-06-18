import chokidar from 'chokidar';
import cmdargs from 'command-line-args';
import cmdusage from 'command-line-usage';
import 'colors';
import { exit } from 'process';
import fs from 'fs';
import os from 'os';
import tempy from 'tempy';
import path from 'path';
import { spawn } from 'child_process';
import Reader from './Reader.js';
import Writer from './Writer.js';
import glob from 'glob';

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
	{ name: 'compression', alias: 'c', type: String, description: 'Use GZip to compress/decompress (gzip|none)? If not specified, will guess by header' },
	{ name: 'no-snbt', alias: 's', type: Boolean, description: 'If specified, SNBTs won\'t be parsed' },
	{ name: 'input', alias: 'i', type: String, description: 'Input file: XML, or NBT', defaultOption: true },
	{ name: 'out', alias: 'o', type: String, description: 'Output file: XML, or NBT. Leave empty to edit (the input file has to be NBT then).' },
	{ name: 'bulk', alias: 'b', type: Boolean, description: 'Bulk mode. Input may be a folder or a mask. Output must be a folder' },
	{ name: 'xmlinput', alias: 'x', type: Boolean, description: 'Convertion mode for bulk mode. Default is nbt -> xml' }
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
			'Edit NBT files, or convert to XML.',
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
			`${'xnbtedit'.green} {bold --set-editor} {underline vscodium}`,
			'Bulk covert:'.italic.dim,
			`${'xnbtedit'.green} {bold --bulk} {underline folder1/} {bold --out} {underline folder2/}`
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

const Main = async () => {
	if (options['set-editor']) {
		config.self.editor = options['set-editor'];
		config.save();
		console.log(`Configuration written to "${CONFIG}".`);
		exit(0);
	}

	const { input: _input, out: _out } = options as { input?: string, out?: string };
	let gzip = options.compression == 'gzip' ? true : (options.compression == 'none' ? false : undefined);
	const bulk = !!options.bulk;
	const xmlinput = !!options.xmlinput;
	
	if (!_input) {
		console.log('No input file specified.'.red);
		exit(1);
	}

	const inputs: string[] = [], outs: string[] = [];
	if (bulk) {
		try {
			if (fs.statSync(_input).isFile())
				exit(1);
		}
		catch {}

		try {
			if (!fs.statSync(_input).isFile())
				await new Promise<void>(resolve => glob(path.join(_input, '**/*'), (err, files) => {
					if (err)
						exit(1);
					files.forEach(filename => inputs.push(filename));
					resolve();
				}));
		}
		catch {
			let fns = (await new Promise(resolve => glob(_input, (err, files) => {
				if (err)
					exit(1);
				resolve(files);
			}))) as string[];
			fns.forEach(filename => inputs.push(filename));
		}
	}
	else
		inputs.push(_input), outs.push(_out);

	const XML2NBT = async (input: string, out: string = null) => {
		if (!out) {
			console.log('Destination should be specified for XML --input.'.red);
			exit(1);
		}
		console.log(`Writing to ${out}`);
		await Writer.X2NPipe(input, out, { gzip });
	}
	const OpenEditor = (fn: string) => spawn(config.self.editor, [fn]);;
	if (!bulk && _input.endsWith('.xml') || bulk && xmlinput) {
		if (gzip == undefined) {
			console.log(`When input is an XML file, compression method (${'--compression'.bold}) must be specified.`.red);
			exit(1);
		}
		for (let [i, o] of inputs.map((v, i) => ([v, outs.length > i ? outs[i] : null])))
			await XML2NBT(i, o);
		exit(0);
	}
	else (async () => {
		if (gzip == undefined) {
			let istream = fs.createReadStream(input, { mode: 1 });
			let header: Buffer = await new Promise(resolve => istream.on('readable', () => resolve(istream.read(3))));
			gzip = header.compare(new Uint8Array([0x1f, 0x8b, 0x08])) == 0;
			istream.close();
		}
		let edit = !out;
		if (!out)
			out = tempy.file({ 'name': path.basename(input) + '.xml' });
		Reader.N2XPipe(input, out, { gzip, parseSNBT: !options['no-snbt'] });
		fs.writeFile(input + '.backup', fs.readFileSync(input, 'binary'), 'binary', () => console.log(`Saved previous data as ${input}.backup`));
		if (!edit)
			exit(0);
		let watcher = chokidar.watch(out, { awaitWriteFinish: true });
		watcher.on('change', () => {
			console.log(`Writing to ${input}`);
			Writer.X2NPipe(out, input, { gzip });
		});
		OpenEditor();

		process.on('exit', () => {
			watcher.close();
			fs.rmSync(out);
		});
		process.on('SIGINT', process.exit);
	})();
};

Main();