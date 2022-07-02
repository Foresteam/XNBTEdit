import IConfig from "./IConfig";

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
export interface BackendAPI {
	SelectorDialog(isDir: boolean, mode: 'open' | 'save'): Promise<string>;
	ExternalURL(url: string): Promise<void>;
	Configure(prop: string, value: any): Promise<void>;
	FetchConfig(): Promise<IConfig>;
	Convert(options: Options): Promise<string | null>;
	OpenEdit(options: Options): Promise<string | null>;
}
declare global {
	interface Window {
		backend: BackendAPI;
	}
}