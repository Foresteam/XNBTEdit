import chokidar from 'chokidar';
import tempy from 'tempy';
import cmdargs from 'command-line-args';
import cmdusage from 'command-line-usage';
import 'colors';
import { exit } from 'process';
import fs from 'fs';
import os from 'os';
import Reader from './Reader';
import Writer from './Writer';

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
	{ name: 'gzip', alias: 'g', type: String, description: 'Use GZip to compress/decompress (yes/no)? Else, will try to guess by extension' },
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

if (options['set-editor']) {
	config.self.editor = options['set-editor'];
	config.save();
	console.log(`Configuration written to "${CONFIG}".`);
	exit();
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
	gzip ||= gzip == undefined && !dst.endsWith('.uncompressed');
	Writer.WriteNBT(dst, Writer.ReadXML(src), gzip);
}
if ((src as string).endsWith('.xml'))
	XML2NBT();
else {
	gzip ||= gzip == undefined && !src.endsWith('.uncompressed');
	let edit = !!dst;
	// dst ||= 'tmpfile...';
	Reader.WriteXML(dst, Reader.ReadNBT(src, gzip));
}

exit();