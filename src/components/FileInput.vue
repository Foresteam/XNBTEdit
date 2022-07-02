<template>
	<div class="flex-col">
		<label :for="id" class="ui-block-h ui-block-t">
			{{ label }}
		</label>
		<div class="flex-row ui-block-h ui-block-b set-wrapper">
			<p-input-text
				:id="id"
				style="flex-grow: 1"
				:modelValue="modelValue"
				@change="e => $emit('update:modelValue', e.target.value)"
				:disabled="disabled"
			/>
			<p-button icon="pi fi fi-dots" @click="selectDialog" :disabled="disabled" />
		</div>
	</div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';

@Options({
	emits: [
		'change',
		'update:modelValue'
	],
	props: {
		label: String,
		id: {
			type: String,
			required: true
		},
		isDir: {
			type: Boolean,
			default: false
		},
		mode: {
			type: String,
			default: 'open'
		},
		disabled: {
			type: Boolean,
			default: false
		},
		modelValue: String
	},
	methods: {
		async selectDialog() {
			let path = await window.backend.SelectorDialog(this.isDir, this.mode);
			if (!path)
				return;
			this.$emit('update:modelValue', path);
			this.$emit('change', path);
		}
	}
})
export default class extends Vue {
	isDir!: boolean;
	mode!: 'open' | 'save';
	id!: string;
	disabled: boolean;
}
</script>
