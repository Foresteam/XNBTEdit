// Electron IPC clientside implementation

import { contextBridge, ipcRenderer } from 'electron';
import { BackendAPI } from './shared/IPCTypes';

/** Type wrapper */
const exposeTyped = <T>(name: string, backend: T) => contextBridge.exposeInMainWorld(name, backend);

exposeTyped<BackendAPI>('backend', {
	SelectorDialog: (isDir, mode) => ipcRenderer.invoke('SelectFile', isDir, mode),
	ExternalURL: url => ipcRenderer.invoke('ExternalURL', url),
	Configure: (prop, value) => ipcRenderer.invoke('Configure', prop, value),
	FetchConfig: () => ipcRenderer.invoke('FetchConfig'),
	Convert: options => ipcRenderer.invoke('Convert', options),
	EditOpen: options => ipcRenderer.invoke('EditOpen', options),
	EditClose: () => ipcRenderer.send('EditClose')
});