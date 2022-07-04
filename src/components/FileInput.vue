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
				@change="(e: any) => onChange(e.target.value)"
				:disabled="disabled"
			/>
			<p-button icon="pi fi fi-dots" @click="selectDialog" :disabled="disabled" />
		</div>
	</div>
</template>

<script lang="ts" setup>
const props = defineProps<{
	label: string;
	id: string;
	isDir: boolean;
	mode?: 'open' | 'save';
	disabled?: boolean;
	modelValue?: string;
}>();
const emit = defineEmits(['change', 'update:modelValue']);

const selectDialog = async () => {
	const path = await window.backend.SelectorDialog(props.isDir, props.mode as ('open' | 'save'));
	if (!path)
		return;
	onChange(path);
};
const onChange = (path: string) => {
	emit('update:modelValue', path);
	emit('change', path);
}
</script>
