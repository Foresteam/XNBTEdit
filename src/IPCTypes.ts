export interface BackendAPI {
	SelectorDialog(isDir: boolean): Promise<string>;
	ExternalURL(url: string): Promise<void>;
}
declare global {
	interface Window {
		backend: BackendAPI;
	}
}