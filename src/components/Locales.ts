import { ErrorCode } from "@/shared/ErrorCodes";

export enum Locales { EN = 0, RU }

const locales = {
	'Main.bulk-checkbox': [
		'Bulk mode',
		'Массовый режим'
	],
	'Main.input-path.0': [
		'Input file',
		'Входной файл'
	],
	'Main.input-path.1': [
		'Input directory or mask (e.g. dir/*.dat)',
		'Входная директория или маска (напр. dir/*.dat)'
	],
	'Main.compression-checkbox.0': [
		'Guess compression by header',
		'Определить сжатие по заголовку'
	],
	'Main.compression-checkbox.1': [
		'No compression',
		'Нет сжатия'
	],
	'Main.compression-checkbox.2': [
		'GZip compression',
		'Сжатие GZip'
	],
	'Main.snbt-checkbox': [
		'Parse SNBT',
		'Парсить SNBT'
	],
	'Main.edit-checkbox': [
		'Edit',
		'Редактировать'
	],
	'Main.output-path.0': [
		'Output file',
		'Выходной файл'
	],
	'Main.output-path.1': [
		'Output directory',
		'Выходная директория'
	],
	'Main.perform-edit.0': [
		'Edit',
		'Редактировать'
	],
	'Main.perform-edit.1': [
		'Finish editing',
		'Завершнить редактирование'
	],
	'Main.perform-convert': [
		'Convert',
		'Конвертировать'
	],
	'Settings.locale': [
		'English',
		'Русский'
	],
	'Settings.editor-config': [
		'Editor path',
		'Путь до редактора'
	],
	[ErrorCode.NO_INPUT]: [
		'No input was specified.',
		'Входной файл не указан.'
	],
	[ErrorCode.ASK_OVERWRITE]: [
		'Output must be specified or edit mode must be selected.',
		'Необходимо указать выходной путь или выбрать режим редактирования'
	],
	[ErrorCode.BULK_INPUT_FILE]: [
		'Input mustn\'t be a file (for bulk mode).',
		'Для массового режима входной путь не должен быть файлом.'
	],
	[ErrorCode.IDK]: [
		'Nothing to be found (?)',
		'Нечего искать (?)'
	],
	[ErrorCode.ASK_OVERWRITE]: [
		'Output directory already exists and is not empty. Write anyway?',
		'Выходная директория уже существует и не является пустой. Все равно продолжить?'
	],
	[ErrorCode.XML_NO_OUT]: [
		'Destination must be specified for XML->NBT mode.',
		'В режиме XML->NBT, необходимо указать выходной путь.'
	],
	[ErrorCode.XML_COMPRESSION_UNDEFINED]: [
		'Compression method must be specified for XML->NBT mode.',
		'В режиме XML->NBT, необходимо выбрать метод сжатия.'
	],
	[ErrorCode.INPUT_NOT_A_FILE]: [
		'Input is not a file.',
		'Входной путь не является файлом.'
	],
	[ErrorCode.NO_OUT_NO_EDIT]: [
		'No output was specified, nor edit mode was selected.',
		'Нужно указать выходной путь, либо выбрать режим редактирования'
	]
} as {
	[key: string | number]: {
		[key in Locales]: string;
	}
};

// empty arrays at indexes
const exp = Object.values(Locales).map(_ => []) as any as {
	[key in Locales]: {
		[key: string | number]: string;
	}
};
for (const [name, v] of Object.entries(locales))
	for (const [slocale, str] of Object.entries(v))
		exp[Number(slocale) as Locales][name] = str;

export default exp;