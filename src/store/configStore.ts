import { defineStore } from 'pinia';
import IConfig from '@/shared/IConfig';
import '@/shared/IPCTypes';
import glocales, { Locales } from '@/components/Locales';

export const useConfig = defineStore('config', {
	state: (): IConfig => ({
		editor: '',
		locale: Locales.EN,
		seenLicense: false
	}),
	getters: {
		locales: (state) => glocales[state.locale as Locales]
	},
	actions: {
		async configure<T extends keyof IConfig>(field: T, value: any) {
			await window.backend.Configure(field, value);
			this[field] = value;
		},
		async fetchConfig() {
			for (const [k, v] of Object.entries(await window.backend.FetchConfig()) as [keyof IConfig, any][])
				this[k] = v;
		}
	}
});