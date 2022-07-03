import { createStore } from 'vuex';
import IConfig from '@/shared/IConfig';
import '@/shared/IPCTypes';
import glocales, { Locales } from '@/shared/Locales';

export default createStore({
	state: {
		config: {
			editor: '',
			locale: Locales.EN
		}
	},
	getters: {
		config_editor(state) {
			return state.config.editor;
		},
		config_locale(state) {
			return state.config.locale;
		},
		locales(state) {
			return glocales[state.config.locale];
		}
	},
	mutations: {
		setConfig(state, config: IConfig) {
			for (let [k, v] of Object.entries(config))
				state.config[k] = v;
		}
	},
	actions: {
		async configure(store, [prop, value]) {
			await window.backend.Configure(prop, value);
			store.commit('setConfig', { [prop]: value });
		},
		async fetchConfig(ctx) {
			ctx.commit('setConfig', await window.backend.FetchConfig());
		}
	},
	modules: {
	}
});