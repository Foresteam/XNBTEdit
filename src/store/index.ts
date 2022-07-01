import { createStore } from 'vuex';
import IConfig from '@/shared/IConfig';
import '@/shared/IPCTypes';

export default createStore({
	state: {
		editor: ''
	} as IConfig,
	getters: {
		editor(state) {
			return state.editor;
		}
	},
	mutations: {
		setConfig(state, kvs: Object) {
			for (let [k, v] of Object.entries(kvs))
				state[k] = v;
		}
	},
	actions: {
		async configure(ctx, [ prop, value ]: [ string, any ]) {
			await window.backend.Configure(prop, value);
			ctx.commit('setConfig', [[ prop, value ]]);
		},
		async fetchConfig(ctx) {
			ctx.commit('setConfig', await window.backend.FetchConfig());
		}
	},
	modules: {
	}
});