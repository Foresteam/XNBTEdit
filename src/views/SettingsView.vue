<template>
	<div class="flex-col">
		<file-input
			id="editor-config"
			mode="open"
			:isDir="false"
			:label="locales['Settings.editor-config']"
			:modelValue="config_editor"
			@change="path => configure('editor', path)"
		/>
		<div class="flex-row ui-block" style="align-items: center">
			<p-input-switch :modelValue="!!config_locale" @update:modelValue="(locale: boolean) => configure('locale', Number(locale))" />
			<label>{{ locales['Settings.locale'] }}</label>
		</div>
	</div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import { mapActions, mapState } from 'pinia';
import { useConfig } from '@/store/configStore';
import '@/shared/IPCTypes';
import FileInput from '@/components/FileInput.vue';
import { Locales } from "@/components/Locales";

export default defineComponent({
	components: {
		FileInput
	},
	methods: {
		...mapActions(useConfig, ['configure'])
	},
	computed: {
		...mapState(useConfig, ['config_editor', 'config_locale', 'locales'])
	}
});
</script>