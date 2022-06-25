import path from 'path';
import chokidar from 'chokidar';
import fs from 'fs';
import Reader from './Reader.js';
import Writer from './Writer.js';
import tempy from 'tempy';
import fsp from 'fs/promises';
import { Config } from './Common.js';
import os from 'os';
import glob from 'glob';
import { spawn } from 'child_process';

export interface Options {
	help?: boolean;
	editor?: string;
	edit?: boolean;
	compression?: 'gzip' | 'none' | boolean;
	snbt?: boolean;
	input?: string;
	out?: string;
	bulk?: boolean;
	xmlinput?: boolean;
	overwrite?: boolean;
}

export const FindTopFolderName = (p: string): string => {
	let parts = p.split(path.sep);
	let i = 0;
	for (; i < parts.length; i++)
		if (parts[i].indexOf('*') >= 0 || parts[i].indexOf('?') >= 0) {
			break;
		}
	return path.resolve(parts.splice(0, i).join(path.sep));
}
export const SubtractBeginning = (path: string, top: string) => {
	path = path.substring(top.length);
	if (path.startsWith('/'))
		path = path.substring(1);
	return path;
}

export interface OpenFileArgs {
	/** Input file */
	input: string;

	/** Out directory */
	dir?: string;

	/** The part with future "project directory" */
	inputMeaningful?: string;

	/** Out name, "single convert mode" */
	outName?: string;

	edit?: boolean;

	gzip: boolean;
	bulk: boolean;
	xmlinput: boolean;
	snbt: boolean;
}
export interface OpenFileResult {
	filename?: string;
	watcher?: chokidar.FSWatcher;
	convertPromise?: Promise<void>;
}
const OpenFile = async ({ input, inputMeaningful, dir, outName, xmlinput, gzip, edit, snbt }: OpenFileArgs): Promise<OpenFileResult> => {
	// out=false means we should create temp file. Else we only create the missing path component
	// now we have to check outName too...
	let out = '';
	let xmlsuf = !xmlinput ? '.xml' : '';
	if (dir !== undefined)
		out = path.join(dir, inputMeaningful + xmlsuf);
	else if (outName)
		out = outName;

	if (out)
		try { fs.mkdirSync(path.dirname(out), { recursive: true }); } catch { }

	const XML2NBT = async (input: string, out: string) => {
		if (!out)
			throw `Destination should be specified for XML ${'--input'.bold}.`.red;
		console.log(`Writing to ${out}`);
		await Writer.X2NPipe(input, out, { gzip });
	}
	if (xmlinput || input.endsWith('.xml')) {
		if (gzip == undefined)
			throw `When input is an XML file, compression method (${'--compression'.bold}) must be specified.`.red;
		await XML2NBT(input, out);
		return null;
	}
	else {
		if (gzip == undefined) {
			let istream = fs.createReadStream(input, { mode: 1 });
			let header: Buffer = await new Promise(resolve => istream.on('readable', () => resolve(istream.read(3))));
			gzip = header.compare(new Uint8Array([0x1f, 0x8b, 0x08])) == 0;
			istream.close();
		}
		if (!out)
			out = tempy.file({ 'name': path.basename(input) + '.xml' });
		let convertPromise = fsp.writeFile(input + '.backup', fs.readFileSync(input, 'binary'), 'binary').then(() => {
			console.log(`Backup written (${input}.backup)`);
			return Reader.N2XPipe(input, out, { gzip, parseSNBT: snbt }).then(() =>
				console.log(`Conversion done (${out})`)
			);
		});
		if (!edit)
			return { convertPromise };
		await convertPromise;
		let watcher = chokidar.watch(out, { awaitWriteFinish: true });
		watcher.on('change', () => XML2NBT(out, input));
		return { filename: out, watcher };
	}
}

const APPDATA = os.platform() == 'linux' ? os.homedir() + '/.config/XNBTEdit/' : '';
const CONFIG = APPDATA + 'config.json';
try { APPDATA && fs.mkdirSync(APPDATA); } catch { }

export const config = new Config(CONFIG, {});

export const SetEditor = (editor: string) => {
	config.self.editor = editor;
	config.save();
	console.log(`Wrote configuration to "${CONFIG}".`);
}
export const CheckOpenGUI = ({ edit, out, input}: Options) => {
	return !edit && out == undefined && !input;
	/** It was needed when the app was command line only */
	// if (!edit && out == undefined)
	// 	throw `No output file/dir was specified, nor edit mode (${'-e'.bold}) was selected. Nothing to do.`.red;
	// if (!input)
	// 	throw 'No input file specified.'.red;
}

export const Perform = async ({ bulk, input: _input, edit, out: _out, overwrite, xmlinput, compression: gzip, snbt }: Options) => {
	const inputs: string[] = [];
	if (bulk) {
		try {
			if (fs.statSync(_input).isFile())
				throw 0;
		}
		catch (e) {
			if (e == 0)
				throw 'Input shouldn\'t be a file (for bulk mode)';
		}

		try {
			if (!fs.statSync(_input).isFile())
				await new Promise<void>(resolve => glob(path.join(_input, '**', '*'), (err, files) => {
					if (err)
						throw 'Nothing to be found (?)';
					for (let filename of files)
						if (fs.statSync(filename).isFile())
							inputs.push(path.resolve(filename))
					resolve();
				}));
		}
		catch {
			let fns = (await new Promise(resolve => glob(_input, (err, files) => {
				if (err)
					throw 'Nothing to be found (?)';
				resolve(files);
			}))) as string[];
			for (let filename of fns)
				inputs.push(path.resolve(filename));
		}
	}
	else
		inputs.push(path.resolve(_input));

	const top = FindTopFolderName(_input);
	let dir: string;
	if (bulk) {
		if (edit)
			dir = tempy.directory();
		else if (_out !== undefined) {
			dir = _out;
			try {
				if (fs.readdirSync(dir).length > 0)
					if (overwrite)
						console.log('Output directory already exists and is not empty. Overwriting...'.bold);
					else
						throw 0;
			} catch (e) {
				if (e == 0)
					throw `Output directory already exists and is not empty. Rerun the program with ${'--overwrite'.bold} flag to write anyway.`.red;
			}
		}
		else
			throw `No out dir was specified, nor edit mode (${'-e'.bold}) was selected.`.red;
		dir = dir;
	}
	
	const opened: OpenFileResult[] = [];
	for (let fn of inputs)
		opened.push(await OpenFile({
			input: fn,
			inputMeaningful: SubtractBeginning(fn, top),
			dir,
			outName: !bulk ? _out : undefined,
			snbt, bulk, xmlinput, gzip: gzip as boolean, edit
		}));

	process.on('exit', () => opened.forEach(rs => {
		if (rs.watcher || rs.filename == undefined)
			return;
		rs.watcher.close();
		fs.rmSync(rs.filename);
	}));
	process.on('SIGINT', () => process.exit(1));

	if (edit)
		spawn(config.self.editor, [dir !== undefined ? dir : opened[0].filename]);
	
	return opened;
}