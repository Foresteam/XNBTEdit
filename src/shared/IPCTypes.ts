import IConfig from "./IConfig";
import Options from './Options';
import { ErrorCode } from "./ErrorCodes";

export interface BackendAPI {
	SelectorDialog(isDir: boolean, mode: 'open' | 'save'): Promise<string>;
	ExternalURL(url: string): Promise<void>;
	Configure(prop: keyof IConfig, value: any): Promise<void>;
	FetchConfig(): Promise<IConfig>;
	Convert(options: Options): Promise<ErrorCode|string>;
	EditOpen(options: Options): Promise<ErrorCode|string>;
	EditClose(): void;
}
declare global {
	interface Window {
		backend: BackendAPI;
	}
}