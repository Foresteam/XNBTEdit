<template>
	<div class="home flex-col">
		<div class="ui-block flex-row" style="align-items: center">
			<p-checkbox id="bulk-checkbox" v-model="bulk" :binary="true" style="" />
			<label for="bulk-checkbox">Bulk mode</label>
		</div>
		<file-input
			id="input-path"
			:isDir="bulk"
			:label="bulk
				? 'Input directory or mask (e.g. dir/*.dat)'
				: 'Input file'
			"
			@change="inputChanged"
			v-model="input"
		/>
		<div class="flex-row flex-center mode-switch ui-block-v" style="">
			<i class="pi fi fi-package icon">
				<span>NBT</span>
			</i>
			<div style="margin-left: 30pt; margin-right: 30pt;">
				<p-toggle-button
					v-model="xmlinput"
					onIcon="pi pi-arrow-left"
					offIcon="pi pi-arrow-right"
					class="button-bigtext"
					style="width: 100%"
				/>
			</div>
			<i class="pi fi fi-file icon">
				<span>XML</span>
			</i>
		</div>
		<div class="ui-block flex-row" style="align-items: center">
			<p-checkbox id="edit-checkbox" v-model="edit" :binary="true" :disabled="xmlinput" style="" />
			<label for="edit-checkbox">Edit</label>
		</div>
		<file-input
			id="output-path"
			:isDir="bulk"
			mode="save"
			:label="bulk
				? 'Output directory'
				: 'Output file'
			"
			v-model="output"
		/>
		<div class="flex-row ui-block" style="align-items: center">
			<p-tri-state-checkbox id="compression-checkbox" v-model="compression" :disabled="xmlinput" />
			<label for="compression-checkbox" v-if="compression == null">Guess compression by header</label>
			<label for="compression-checkbox" v-if="compression == false">No compression</label>
			<label for="compression-checkbox" v-if="compression == true">GZip compression</label>
		</div>
		<div class="flex-row ui-block flex-center">
			<p-toggle-button
				v-if="edit"
				onLabel="Edit"
				onIcon="pi fi fi-edit"
				offLabel="Finish editing"
				offIcon="pi pi-check"
				v-model="isNotEditing"
				class="p-button-success"
				style="font-size: 20pt"
				:loading="true"
			/>
			<p-button
				v-else
				label="Convert"
				:loading="convertationProgress"
				style="font-size: 20pt"
			/>
		</div>
	</div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import '@/shared/IPCTypes';
import FileInput from '@/components/FileInput.vue';

@Options({
	components: {
		FileInput
	},
	data: () => ({
		xmlinput: false,
		compression: null,
		bulk: false,
		edit: false,
		input: '',
		output: '',
		isNotEditing: true
	}),
	watch: {
		xmlinput(val) {
			if (val)
				this.edit = false;
		}
	},
	methods: {
		inputChanged(...args) {
			console.log(args);
		}
	}
})
export default class extends Vue {}
</script>

<style>
.home {
	width: 100%;
}
.mode-switch i:before {
	font-size: 70pt;
}
.mode-switch .p-togglebutton, .mode-switch .p-togglebutton * {
	transition: .2s ease-out;
	border: none !important;
	background: transparent !important;
	color: var(--primary-color) !important;
	box-shadow: none !important;
	font-size: 50pt !important;
}
.mode-switch .p-togglebutton:hover *  {
	color: var(--text-color) !important;
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