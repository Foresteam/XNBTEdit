import { contextBridge, ipcRenderer } from 'electron';
import { BackendAPI } from './shared/IPCTypes';

contextBridge.exposeInMainWorld('backend', {
	SelectorDialog: (isDir, mode) => ipcRenderer.invoke('SelectFile' as keyof BackendAPI, isDir, mode),
	ExternalURL: url => ipcRenderer.invoke('ExternalURL' as keyof BackendAPI, url),
	Configure: (prop, value) => ipcRenderer.invoke('Configure' as keyof BackendAPI, prop, value),
	FetchConfig: () => ipcRenderer.invoke('FetchConfig'),
	Convert: options => ipcRenderer.invoke('Convert' as keyof BackendAPI, options),
	EditOpen: options => ipcRenderer.invoke('EditOpen' as keyof BackendAPI, options),
	EditClose: () => ipcRenderer.send('EditClose' as keyof BackendAPI)
} as BackendAPI);