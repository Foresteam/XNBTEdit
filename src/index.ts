import chokidar from 'chokidar';
import tempy from 'tempy';
import cmdargs from 'command-line-args';
import cmdusage from 'command-line-usage';
import 'colors';
import { exit } from 'process';
const optionList = [
	{ name: 'help', type: Boolean, description: 'Show help' },
	{ name: 'editor', type: String, description: 'Set the path to your favourite editor' },
	{ name: 'bzip', alias: 'b', type: Boolean, description: 'Compress/decompress source/destination file with BZIP?' },
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
			'xnbtedit {bold --bzip} {bold --src} {underline example.dat}',
			'xnbtedit {bold --src} {underline example.dat.uncompressed} {bold --dst} {underline example.xml}',
			'xnbtedit {bold --dst} {underline example.xml} {bold --src} {underline example.dat}',
			'xnbtedit {bold --editor} {underline subl}'
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