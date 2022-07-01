import { contextBridge, ipcRenderer } from 'electron';
import { BackendAPI } from './IPCTypes';

contextBridge.exposeInMainWorld('backend', {
	SelectorDialog: (dir: boolean) => ipcRenderer.invoke('SelectFile', dir)
} as BackendAPI)