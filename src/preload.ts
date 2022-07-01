import { contextBridge, ipcRenderer } from 'electron';
import { BackendAPI } from './IPCTypes';

contextBridge.exposeInMainWorld('backend', {
	SelectorDialog: (isDir: boolean) => ipcRenderer.invoke('SelectFile', isDir),
	ExternalURL: (url: string) => ipcRenderer.invoke('ExternalURL', url)
} as BackendAPI)