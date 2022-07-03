<template>
	<div class="flex-col">
		<file-input
			id="editor-config"
			:isDir="false"
			:label="locales['Settings.editor-config']"
			:modelValue="config_editor"
			@change="path => configure(['editor', path])"
		/>
		<div class="flex-row ui-block" style="align-items: center">
			<p-input-switch :modelValue="!!config_locale" @update:modelValue="locale => configure(['locale', Number(locale)])" />
			<label>{{ locales['Settings.locale'] }}</label>
		</div>
	</div>
</template>
<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { mapActions, mapGetters } from 'vuex';
import '@/shared/IPCTypes';
import FileInput from '@/components/FileInput.vue';
import { Locales } from "@/components/Locales";

@Options({
	components: {
		FileInput
	},
	methods: {
		...mapActions(['configure'])
	},
	computed: {
		...mapGetters(['config_editor', 'config_locale', 'locales'])
	},
	mounted() {
		this._editor = this.config_editor;
	}
})
export default class extends Vue {}
</script>