'use strict'
import OpenGUI from './backend/ReactBackend';

import cmdargs from 'command-line-args';
import cmdusage from 'command-line-usage';
import 'colors';
import { exit } from 'process';

import * as main from './backend/Main';
import { RenameKey } from './backend/Common';
import path from 'path'

const optionList = [
	{ name: 'help', type: Boolean, description: 'Show help' },
	{ name: 'set-editor', type: String, description: 'Set the path to your favourite editor' },
	{ name: 'edit', alias: 'e', type: Boolean, description: 'Open for editing' },
	{ name: 'compression', alias: 'c', type: String, description: 'Use GZip to compress/decompress. Should be "gzip" or "none". If not specified, will guess by header' },
	{ name: 'no-snbt', alias: 's', type: Boolean, description: 'If specified, SNBTs won\'t be parsed' },
	{ name: 'input', alias: 'i', type: String, description: 'Input file: XML, NBT; a folder or a mask in bulk mode', defaultOption: true },
	{ name: 'out', alias: 'o', type: String, description: 'Output file: XML, NBT; a folder in bulk mode' },
	{ name: 'bulk', alias: 'b', type: Boolean, description: 'Bulk mode. Input may be a folder or a mask. Output must be a folder' },
	{ name: 'xmlinput', alias: 'x', type: Boolean, description: 'Conversion mode. Required for bulk mode, but may be used in single mode to ignore extensions. Default is nbt -> xml' },
	{ name: 'overwrite', alias: 'w', type: Boolean, description: 'Overwrite output files if they exist' }
];
const options = cmdargs(optionList) as main.Options;
RenameKey.call(options, 'set-editor', 'editor');
RenameKey.call(options, 'no-snbt', 'snbt');
options.compression = options.compression == 'gzip' ? true : (options.compression == 'none' ? false : undefined);
options.snbt = !!options.snbt;

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
			'Open compressed file for editing:'.italic.dim,
			`${'./xnbtedit'.green} {bold --compression=gzip} {bold --edit} {underline example.dat}`,
			'Convert from uncompressed .dat to XML:'.italic.dim,
			`${'./xnbtedit'.green} {underline example.dat.uncompressed} {bold --out} {underline example.xml}`,
			'Convert from xml to .dat, {underline compress (implicit)} (gzip assumed):'.italic.dim,
			`${'./xnbtedit'.green} {underline example.xml} {bold --out} {underline example.dat}`,
			'Convert from xml to .dat, {underline do not compress (explicit)} (despite the .dat extension):'.italic.dim,
			`${'./xnbtedit'.green} {bold -c} {underline none} {underline example.xml} {bold --out} {underline example.dat}`,
			'Set the editor:'.italic.dim,
			`${'./xnbtedit'.green} {bold --set-editor} {underline vscodium}`,
			'Bulk covert:'.italic.dim,
			`${'./xnbtedit'.green} {bold --bulk} {underline folder1/} {bold --out} {underline folder2/}`,
			'Bulk edit (it is important to {bold use quotes} when dealing with masks):'.italic.dim,
			`${'./xnbtedit'.green} {bold --bulk} {bold -e} {underline 'folder/*.dat'}`
		]
	},
	{
		header: 'Options',
		optionList
	}
])

if (options.help) {
	console.log(usage);
	exit(0);
}
if (options.editor) {
	main.SetEditor(options.editor);
	exit(0);
}
if (main.CheckOpenGUI(options))
	OpenGUI();
else {
	if (!options.edit && !options.out) {
		console.error(`No output was specified, nor edit mode (${'-e'.bold}) was selected`.red);
		exit(1);
	}

	const Main = async () => {
		const { input: _input, out: _out, edit } = options;

		let opened: main.OpenFileResult[];
		try {
			opened = await main.Perform(options);
		}
		catch (e) {
			console.error(e);
			exit(1);
		}

		process.on('SIGINT', () => process.exit(1));
		if (!edit) {
			for (let rs of opened)
				if (rs && rs.convertPromise)
					await rs.convertPromise;
			exit(0);
		}
	};
	Main();
}