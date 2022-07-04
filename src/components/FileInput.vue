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
				@change="(e: any) => emitChange(e.target.value)"
				:disabled="disabled"
			/>
			<p-button icon="pi fi fi-dots" @click="selectDialog" :disabled="disabled" />
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
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
			const path = await window.backend.SelectorDialog(this.isDir, this.mode as ('open' | 'save'));
			if (!path)
				return;
			this.emitChange(path);
		},
		emitChange(path: string) {
			this.$emit('update:modelValue', path);
			this.$emit('change', path);
		}
	}
});
</script>
