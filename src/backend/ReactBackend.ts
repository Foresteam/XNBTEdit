'use strict'

import { app, protocol, BrowserWindow, dialog, ipcMain } from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer';

import path from 'path';
import fs from 'fs';
import { shell } from 'electron';

import { config, Configure, OpenFileResult, Perform } from './Main';
import IConfig from '@/shared/IConfig';
import { spawnSync } from 'child_process';
import Options from '@/shared/Options';
import { ErrorCode } from '@/shared/ErrorCodes';

const isDevelopment = process.env.NODE_ENV !== 'production';

const CheckKDialog = () => process.platform == 'linux' && spawnSync('which', ['kdialog']).status == 0;
const KFilePicker = async (isDir: boolean, mode: 'open' | 'save'): Promise<string> => {
	let openArg = isDir && 'getexistingdirectory';
	if (!openArg)
		openArg = mode == 'open' ? 'getopenfilename' : 'getsavefilename';
	let path = spawnSync('kdialog', [`--${openArg}`]).output.toString();
	// strip the output. For some reason it appends extra symbols
	console.log(`"${path}"`);
	return path.split('\n')[0].substring(1, path.length - 1);
}

let opened: OpenFileResult[] | null;

export default function () {
	// Scheme must be registered before the app is ready
	protocol.registerSchemesAsPrivileged([
		{ scheme: 'app', privileges: { secure: true, standard: true } }
	]);
	async function createWindow() {
		// Create the browser window.
		const win = new BrowserWindow({
			width: 600,
			height: 460,
			autoHideMenuBar: true,
			resizable: false,
			icon: isDevelopment ? './public/icon.png' : path.join(__dirname, 'icon.png'),
			webPreferences: {
				preload: path.join(__dirname, 'preload.js'),
				// Use pluginOptions.nodeIntegration, leave this alone
				// See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
				nodeIntegration: !!process.env.ELECTRON_NODE_INTEGRATION,
				contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
			}
		});

		ipcMain.handle('SelectFile', async (_, isDir: boolean, mode: 'open' | 'save'): Promise<string> => {
			if (CheckKDialog())
				return await KFilePicker(isDir, mode);
			if (mode != 'save' || isDir)
				return (dialog.showOpenDialogSync(win, { properties: [isDir ? 'openDirectory' : 'openFile'] }) || [''])[0];
			return dialog.showSaveDialogSync(win) || '';
		});
		ipcMain.handle('ExternalURL', async (_, url: string) => shell.openExternal(url));
		ipcMain.handle('Configure', async (_, prop: string, value) => Configure(prop, value));
		ipcMain.handle('FetchConfig', async (_): Promise<IConfig> => config.get());
		ipcMain.handle('Convert', async (_, options: Options): Promise<ErrorCode|string> => {
			if (opened)
				return ErrorCode.IDK;
			try {
				opened = await Perform(options);
				for (let rs of opened)
					await rs?.convertPromise;
				opened = null;
				return ErrorCode.OK;
			}
			catch (msg) {
				console.trace(msg);
				return msg as ErrorCode;
			}
		});
		ipcMain.handle('EditOpen', async (_, options: Options): Promise<ErrorCode|string> => {
			if (opened)
				return ErrorCode.IDK;
			try {
				opened = await Perform(options);
				await new Promise(resolve => ipcMain.once('EditClose', () => resolve(null)));
				for (let rs of opened) {
					if (rs.watcher) {
						rs.watcher.close();
						delete rs.watcher;
					}
					if (rs.removeCallback) {
						let p = rs.removeCallback();
						delete rs.removeCallback;
						await p;
					}
				}
				opened = null;
				return ErrorCode.OK;
			}
			catch (msg) {
				console.trace(msg);
				return msg as ErrorCode;
			}
		});

		if (process.env.WEBPACK_DEV_SERVER_URL) {
			// Load the url of the dev server if in development mode
			await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
			// if (!process.env.IS_TEST) win.webContents.openDevTools()
		} else {
			createProtocol('app');
			// Load the index.html when not in development
			win.loadURL('app://./index.html');
		}
	}

	// Quit when all windows are closed.
	app.on('window-all-closed', () => {
		// On macOS it is common for applications and their menu bar
		// to stay active until the user quits explicitly with Cmd + Q
		if (process.platform !== 'darwin') {
			app.quit();
		}
	})

	app.on('activate', () => {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0)
			createWindow();
	})

	// This method will be called when Electron has finished
	// initialization and is ready to create browser windows.
	// Some APIs can only be used after this event occurs.
	app.on('ready', async () => {
		if (isDevelopment && !process.env.IS_TEST) {
			// Install Vue Devtools
			try {
				await installExtension(VUEJS3_DEVTOOLS);
			} catch (e: any) {
				console.error('Vue Devtools failed to install:', e.toString());
			}
		}
		createWindow();
	})

	// Exit cleanly on request from parent process in development mode.
	if (isDevelopment) {
		if (process.platform === 'win32') {
			process.on('message', (data) => {
				if (data === 'graceful-exit') {
					app.quit();
				}
			})
		} else {
			process.on('SIGTERM', () => {
				app.quit();
			})
		}
	}
};
