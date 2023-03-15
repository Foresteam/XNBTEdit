import path from 'path';
import chokidar from 'chokidar';
import fs from 'fs';
import Reader from './Reader';
import Writer from './Writer';
import tmp from 'tmp-promise';
import fsp from 'fs/promises';
import { Config } from './Common';
import os from 'os';
import glob from 'glob';
import { spawn } from 'child_process';
import Options from '@/shared/Options';
import { ErrorCode } from '@/shared/ErrorCodes';
import IConfig from '@/shared/IConfig';

const APPDATA = os.platform() == 'win32' ? path.join(process.env.APPDATA || '.', 'XNBTEdit') : path.join(os.homedir(), '.config/XNBTEdit');
const CONFIG = path.join(APPDATA, 'config.json');
try { APPDATA && fs.mkdirSync(APPDATA, { recursive: true }); } catch { }

export const config = new Config(CONFIG, {});

export const Configure = (prop: keyof IConfig, value: any) => {
	config.set(prop, value);
	console.log(`Wrote configuration to "${CONFIG}".`);
}
export const CheckOpenGUI = ({ edit, out, input}: Options) => !edit && out == undefined && !input;

interface PerformResult {
	cleanup: () => Promise<void>;
	awaitConvert: () => Promise<void>;
	opened: OpenedFile[];
}
/** Core function */
export const Perform = async ({ bulk, input, edit, out, overwrite, xmlinput, compression: gzip, snbt }: Options): Promise<Readonly<PerformResult>> => {
	if (!input)
		throw ErrorCode.NO_INPUT;
	if (!edit && !out)
		throw ErrorCode.NO_OUT_NO_EDIT;
	
	const inputs: string[] = [];
	if (bulk) {
		try {
			if (fs.statSync(input).isFile())
			throw 0;
		}
		catch (e) {
			if (e == 0)
				throw ErrorCode.BULK_INPUT_FILE;
		}

		try {
			if (!fs.statSync(input).isFile())
				await new Promise<void>(resolve => glob(path.join(input, '**', '*'), (err, files) => {
					if (err)
						throw ErrorCode.IDK;
					for (const filename of files)
						if (fs.statSync(filename).isFile())
							inputs.push(path.resolve(filename))
					resolve();
				}));
		}
		catch {
			const fns = (await new Promise(resolve => glob(input, (err, files) => {
				if (err)
					throw ErrorCode.IDK;
				resolve(files);
			}))) as string[];
			for (const filename of fns)
				inputs.push(path.resolve(filename));
		}
	}
	else try {
		inputs.push(path.resolve(input));
	}
	catch {
		throw ErrorCode.INPUT_NOT_A_FILE;
	}

	const top = FindTopFolderName(input);
	let dir: string | undefined, dirClear: (() => Promise<void>) | undefined;
	if (bulk) {
		if (edit)
			({ path: dir, cleanup: dirClear } = await tmp.dir());
		else if (out !== undefined) {
			dir = out;
			try {
				if (fs.readdirSync(dir).length > 0)
					if (overwrite)
						console.log('Output directory already exists and is not empty. Overwriting...'.bold);
					else
						throw 0;
			} catch (e) {
				if (e == 0)
					throw ErrorCode.ASK_OVERWRITE;
			}
		}
		else
			throw ErrorCode.NO_OUT_NO_EDIT;
	}
	
	const opened: OpenedFile[] = [];
	for (const fn of inputs)
		opened.push(await OpenFile({
			input: fn,
			inputMeaningful: SubtractBeginning(fn, top),
			dir,
			outName: !bulk ? out : undefined,
			snbt, bulk, xmlinput, gzip: gzip as boolean | undefined, edit
		}));
	if (dir !== undefined)
		opened.push({ removeCallback: dirClear });

	const rs: PerformResult = Object.freeze({
		opened,
		cleanup: async () => {
			for (const rs of opened) {
				if (rs.watcher) {
					rs.watcher.close();
					delete rs.watcher;
				}
				if (rs.removeCallback) {
					const p = rs.removeCallback();
					delete rs.removeCallback;
					await p;
				}
			}
		},
		awaitConvert: async () => {
			for (const rs of opened)
				await rs?.convertPromise;
		}
	});
	process.on('exit', () => rs.cleanup());

	if (edit)
		await spawn(config.get().editor as string, [dir !== undefined ? dir : opened[0].filename as string]);
	
	return rs;
}

export const FindTopFolderName = (p: string): string => {
	const parts = p.split(path.sep);
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
	/** Out directory (convert mode) */
	dir?: string;
	/** The path after "project directory" */
	inputMeaningful?: string;
	/** Out (single mode) */
	outName?: string;
	edit?: boolean;
	gzip?: boolean;
	bulk?: boolean;
	xmlinput?: boolean;
	snbt?: boolean;
}
export interface OpenedFile {
	filename?: string;
	watcher?: chokidar.FSWatcher;
	convertPromise?: Promise<void>;
	/** Now use this instead of deleting by "filename" */
	removeCallback?: () => Promise<void>;
}
/** 2-nd core function */
const OpenFile = async ({ input, inputMeaningful, dir, outName, xmlinput, gzip, edit, snbt, bulk }: OpenFileArgs): Promise<OpenedFile> => {
	let out = '';
	const xmlsuf = !xmlinput ? '.xml' : '';
	if (dir !== undefined)
		out = path.join(dir, inputMeaningful + xmlsuf);
	else if (outName)
		out = outName;

	if (out)
		try { fs.mkdirSync(path.dirname(out), { recursive: true }); } catch { }

	const XML2NBT = async (input: string, out: string) => {
		if (!out)
			throw ErrorCode.XML_NO_OUT;
		console.log(`Writing to ${out}`);
		await Writer.X2NPipe(input, out, { gzip });
	}
	if (xmlinput || !bulk && input.endsWith('.xml')) {
		if (gzip == undefined)
			throw ErrorCode.XML_COMPRESSION_UNDEFINED;
		return { convertPromise: XML2NBT(input, out) };
	}
	else {
		if (gzip == undefined) {
			const istream = fs.createReadStream(input, { mode: 1 });
			const header: Buffer = await new Promise(resolve => istream.on('readable', () => resolve(istream.read(3))));
			gzip = header.compare(new Uint8Array([0x1f, 0x8b, 0x08])) == 0;
			istream.close();
		}
		let removeCallback: (() => Promise<void>);
		if (out)
			removeCallback = async () => fs.unlinkSync(out);
		else
			({ path: out, cleanup: removeCallback } = await tmp.file({ 'name': path.basename(input) + '.xml' }));
		const convertPromise = fsp.writeFile(input + '.backup', fs.readFileSync(input, 'binary'), 'binary').then(() => {
			console.log(`Backup written (${input}.backup)`);
			return Reader.N2XPipe(input, out, { gzip, parseSNBT: snbt }).then(() =>
				console.log(`Conversion done (${out})`)
			);
		});
		if (!edit)
			return { convertPromise };
		await convertPromise;
		const watcher = chokidar.watch(out, { awaitWriteFinish: true });
		watcher.on('change', () => XML2NBT(out, input));
		return { filename: out, watcher, removeCallback };
	}
}