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

// type Mojangson = {
// 	simplify(data: object): object;
// 	stringify({ value, type }: { value: object, type: string }): string;
// 	parse(text: string): object;
// 	normalize(str: string): string;
// };
// const mojangson = require('mojangson') as Mojangson;

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
	{ name: 'gzip', alias: 'g', type: String, description: 'Use GZip to compress/decompress (yes/no)? if not specified, will guess by extension' },
	{ name: 'src', alias: 's', type: String, description: 'Input file: XML, or NBT' },
	{ name: 'dst', alias: 'd', type: String, description: 'Output file: XML, or NBT. Leave empty to edit (the input file has to be NBT then).' }
];
const options = cmdargs(optionList);
const usage = cmdusage([
	{
		header: 'XNBTEdit'.cyan,
		content: [
			'Edit NBT files with ease, or only convert them to XML and back.',
			'xnbtedit [options] {bold --src} {underline file} [{bold --dst} {underline file}]'
		]
	},
	{
		header: 'Examples',
		content: [
			'xnbtedit {bold --gzip} {bold --src} {underline example.dat}',
			'xnbtedit {bold --src} {underline example.dat.uncompressed} {bold --dst} {underline example.xml}',
			'xnbtedit {bold --dst} {underline example.xml} {bold --src} {underline example.dat}',
			'xnbtedit {bold --set-editor} {underline subl}'
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

	let { src, dst } = options as { src?: string, dst?: string };
	let gzip: boolean = options.gzip == 'yes' ? true : (options.gzip == 'no' ? false : undefined);

	if (!src) {
		console.log('No input file specified.');
		exit(1);
	}

	const XML2NBT = () => {
		if (!dst) {
			console.log('Destination should be specified for XML --src.');
			exit(1);
		}
		Writer.WriteNBT(dst, Writer.ReadXML(src), gzip);
	}
	if ((src as string).endsWith('.xml')) {
		gzip ||= gzip == undefined && !dst.endsWith('.uncompressed');
		XML2NBT();
		exit(0);
	}
	else {
		gzip ||= gzip == undefined && !src.endsWith('.uncompressed');
		let edit = !!dst;
		if (!dst)
			dst = tempy.file({ 'name': basename(src) });
		Reader.WriteXML(dst, Reader.ReadNBT(src, gzip));
		if (!edit)
			exit(0);
		let watcher = chokidar.watch(dst, { awaitWriteFinish: true });
		watcher.on('change', () => Writer.WriteNBT(src, Writer.ReadXML(dst), gzip));
		spawn(config.self.editor, [dst]);

		process.on('exit', () => {
			watcher.close();
			fs.rmSync(dst);
		});
		process.on('SIGINT', process.exit);
		process.on('SIGKILL', process.exit);
	}
};

Main();