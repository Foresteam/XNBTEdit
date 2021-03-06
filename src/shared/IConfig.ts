import { Locales } from '@/components/Locales';

export default interface IConfig {
	editor?: string;
	locale?: Locales;
	seenLicense?: boolean;
	tookTheRisk?: boolean;
}