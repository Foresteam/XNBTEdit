<template>
	<div class="flex-col">
		<label for="editor-config" class="ui-block-h ui-block-t">Editor path</label>
		<div class="flex-row ui-block ui-block-b set-wrapper">
			<p-input-text id="editor-config" style="flex-grow: 1" v-model="_editor" @change="e => configure(['editor', e.target.value])"/>
			<p-button icon="pi fi fi-dots" @click="selectEditor()" />
		</div>
	</div>
</template>
<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { mapActions, mapGetters } from 'vuex';
import '@/shared/IPCTypes';
import IConfig from '@/shared/IConfig';

@Options({
	data: () => ({
		_editor: ''
	}),
	methods: {
		async selectEditor() {
			let path = await window.backend.SelectorDialog(false);
			if (path)
				this.configure(['editor', this._editor = path]);
			console.log(path);
		},
		...mapActions(['configure'])
	},
	computed: {
		...mapGetters(['editor'])
	},
	mounted() {
		this._editor = this.editor;
	}
})
export default class SettingsVue extends Vue {}
</script>