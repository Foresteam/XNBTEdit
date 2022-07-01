export interface BackendAPI {
	SelectorDialog(dir: boolean): Promise<string>;
}
declare global {
	interface Window {
		backend: BackendAPI;
	}
}