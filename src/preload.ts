import { contextBridge, ipcRenderer } from 'electron';
import { BackendAPI } from './shared/IPCTypes';

contextBridge.exposeInMainWorld('backend', {
	SelectorDialog: (isDir) => ipcRenderer.invoke('SelectFile', isDir),
	ExternalURL: (url) => ipcRenderer.invoke('ExternalURL', url),
	Configure: (prop, value) => ipcRenderer.invoke('Configure', prop, value),
	FetchConfig: () => ipcRenderer.invoke('FetchConfig')
} as BackendAPI)