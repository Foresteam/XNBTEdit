<template>
	<div class="home flex-col">
		<div class="ui-block flex-row" style="align-items: center">
			<p-checkbox id="bulk-checkbox" v-model="bulk" :binary="true" style="" />
			<label for="bulk-checkbox">Bulk mode</label>
		</div>
		<label for="input-path" class="ui-block-h ui-block-t">
			{{ bulk
				? 'Input directory or mask (e.g. dir/*.dat)'
				: 'Input file'
			}}
		</label>
		<div class="flex-row ui-block ui-block-b set-wrapper">
			<p-input-text ref="input-path" id="input-path" v-model="input" style="flex-grow: 1"/>
			<p-button icon="pi fi fi-dots" @click="selectDialog('input', bulk)" />
		</div>
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
		<label for="output-path" class="ui-block-h ui-block-t">
			{{ bulk
				? 'Output directory'
				: 'Output file'
			}}
		</label>
		<div class="flex-row ui-block set-wrapper">
			<p-input-text id="output-path" v-model="output" :disabled="edit" style="flex-grow: 1"/>
			<p-button icon="pi fi fi-dots" :disabled="edit" @click="selectDialog('output', bulk)" />
		</div>
		<div class="flex-row ui-block" style="align-items: center">
			<p-tri-state-checkbox id="compression-checkbox" v-model="compression" :disabled="xmlinput" />
			<label for="compression-checkbox" v-if="compression == null">Guess compression by header</label>
			<label for="compression-checkbox" v-if="compression == false">No compression</label>
			<label for="compression-checkbox" v-if="compression == true">GZip compression</label>
		</div>
		<div class="flex-row ui-block flex-center">
			<p-button :label="edit ? 'Edit' : 'Convert'" class="p-button-success" style="font-size: 20pt" />
		</div>
	</div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import '@/shared/IPCTypes';

@Options({
	components: {},
	data: () => ({
		xmlinput: false,
		compression: null,
		bulk: false,
		edit: false,
		input: '',
		output: ''
	}),
	watch: {
		xmlinput(val) {
			if (val)
				this.edit = false;
		}
	},
	methods: {
		async selectDialog(vmodel: string, isDir: boolean) {
			let path = await window.backend.SelectorDialog(isDir);
			this[vmodel] = path;
		}
	}
})
export default class MainView extends Vue {}
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