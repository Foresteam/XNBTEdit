<template>
	<div class="mode-switch">
		<i class="pi fi fi-package icon">
			<span>NBT</span>
		</i>
		<div style="margin-left: 30pt; margin-right: 30pt;">
			<p-toggle-button
				:modelValue="modelValue"
				@update:modelValue="(v: boolean) => onChange(v)"
				onIcon="pi fi fi-arrow-left"
				offIcon="pi fi fi-arrow-right"
				class="button-bigtext"
				style="width: 100%"
			/>
		</div>
		<i class="pi fi fi-file icon">
			<span>XML</span>
		</i>
	</div>
</template>

<style>
.mode-switch i:before {
	font-size: 70pt;
}
.mode-switch .p-togglebutton,
.mode-switch .p-togglebutton * {
	transition: .2s ease-out;
	border: none !important;
	background: transparent !important;
	color: var(--primary-color) !important;
	box-shadow: none !important;
	font-size: 60pt !important;
}
.mode-switch .p-togglebutton:hover * {
	color: var(--primary-color-highlight) !important;
}
.mode-switch > .icon > * {
	position: absolute;
	display: inline;
	margin-top: 75pt;
	font-weight: bold;
	font-size: 20pt;
	color: var(--gray-400);
}

.mode-switch > .icon {
	display: flex;
	justify-content: center;
	padding-bottom: 35pt
}
</style>

<script lang="ts" setup>
import { defineProps, defineEmits } from 'vue';

defineProps<{ modelValue: boolean }>();
const emit = defineEmits(['update:modelValue', 'change']);

const onChange = (v: boolean) => {
	emit('change', v);
	emit('update:modelValue', v);
};
</script>