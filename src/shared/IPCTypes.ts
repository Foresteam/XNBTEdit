import IConfig from "./IConfig";

export interface BackendAPI {
	SelectorDialog(isDir: boolean, mode: 'open' | 'save'): Promise<string>;
	ExternalURL(url: string): Promise<void>;
	Configure(prop: string, value: any): Promise<void>;
	FetchConfig(): Promise<IConfig>;
}
declare global {
	interface Window {
		backend: BackendAPI;
	}
}