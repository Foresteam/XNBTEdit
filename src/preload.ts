import { contextBridge, ipcRenderer } from 'electron';
import { BackendAPI } from './shared/IPCTypes';

contextBridge.exposeInMainWorld('backend', {
	SelectorDialog: (isDir, mode) => ipcRenderer.invoke('SelectFile', isDir, mode),
	ExternalURL: url => ipcRenderer.invoke('ExternalURL', url),
	Configure: (prop, value) => ipcRenderer.invoke('Configure', prop, value),
	FetchConfig: () => ipcRenderer.invoke('FetchConfig'),
	Convert: options => ipcRenderer.invoke('Convert', options),
	OpenEdit: options => ipcRenderer.invoke('OpenEdit', options)
} as BackendAPI)