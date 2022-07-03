export default interface Options {
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