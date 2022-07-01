<template>
	<div class="flex-col">
		<file-input
			:id="'editor-config'"
			:isDir="false"
			label="Editor path"
			v-model="_editor"
			@change="editorSelected"
		/>
		<div class="flex-row ui-block" style="align-items: center">
			<p-input-switch v-model="_russian" />
			<label>{{ _russian ? 'Russian' : 'English' }}</label>
		</div>
	</div>
</template>
<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { mapActions, mapGetters } from 'vuex';
import '@/shared/IPCTypes';
import FileInput from '@/components/FileInput.vue';

@Options({
	components: {
		FileInput
	},
	data: () => ({
		_editor: '',
		_russian: ''
	}),
	methods: {
		async editorSelected(path) {
			this.configure(['editor', path]);
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
export default class extends Vue {}
</script>