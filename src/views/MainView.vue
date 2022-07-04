<template>
	<div class="home flex-col">
		<div class="ui-block flex-row" style="align-items: center">
			<p-checkbox id="bulk-checkbox" v-model="bulk" :binary="true" style="" />
			<label for="bulk-checkbox">{{ locales['Main.bulk-checkbox'] }}</label>
		</div>
		<file-input
			id="input-path"
			:isDir="bulk"
			:label="locales[`Main.input-path.${Number(bulk)}`]"
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
		<div class="flex-row ui-block" style="align-items: center">
			<p-tri-state-checkbox id="compression-checkbox" v-model="compression" :disabled="xmlinput" />
			<label for="compression-checkbox" v-if="compression == null">{{ locales['Main.compression-checkbox.0'] }}</label>
			<label for="compression-checkbox" v-if="compression == false">{{ locales['Main.compression-checkbox.1'] }}</label>
			<label for="compression-checkbox" v-if="compression == true">{{ locales['Main.compression-checkbox.2'] }}</label>
		</div>
		<div class="flex-row ui-block" style="align-items: center">
			<p-checkbox id="snbt-checkbox" v-model="snbt" binary :disabled="xmlinput" />
			<label for="snbt-checkbox">{{ locales['Main.snbt-checkbox'] }}</label>
		</div>
		<div class="ui-block flex-row" style="align-items: center">
			<p-checkbox id="edit-checkbox" v-model="edit" :binary="true" :disabled="xmlinput" style="" />
			<label for="edit-checkbox">{{ locales['Main.edit-checkbox'] }}</label>
		</div>
		<file-input
			id="output-path"
			:isDir="bulk"
			mode="save"
			:label="locales[`Main.output-path.${Number(bulk)}`]"
			v-model="output"
			:disabled="edit"
		/>
		<div class="flex-row ui-block flex-center">
			<p-toggle-button
				id="perform-edit"
				v-if="!isConverting && (edit || !isNotEditing)"
				:onLabel="locales['Main.perform-edit.0']"
				onIcon="pi fi fi-edit"
				:offLabel="locales['Main.perform-edit.1']"
				offIcon="pi pi-check"
				v-model="isNotEditing"
				class="p-button-success p-button-lg"
			/>
			<p-button
				id="perform-convert"
				v-else
				:label="locales['Main.perform-convert']"
				icon="pi fi fi-exchange button-mi"
				:loading="isConverting"
				class="p-button-lg"
				@click="convert()"
			/>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/runtime-core';
import '@/shared/IPCTypes';
import FileInput from '@/components/FileInput.vue';
import { mapGetters } from 'vuex';
import { ErrorCode } from "@/shared/ErrorCodes";

export default defineComponent({
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
		isNotEditing: true,
		isConverting: false,
		snbt: false
	}),
	watch: {
		xmlinput(val) {
			if (val)
				this.edit = false;
		}
	},
	computed: {
		...mapGetters(['locales'])
	},
	methods: {
		async convert(overwrite = false): Promise<void> {
			this.isConverting = true;
			const error = await window.backend.Convert({
				compression: this.compression == null ? undefined : this.compression,
				xmlinput: this.xmlinput,
				snbt: this.snbt,
				edit: this.edit,
				input: this.input,
				out: this.output,
				overwrite
			});
			if (error == ErrorCode.ASK_OVERWRITE) {
				if (await new Promise(resolve => this.$confirm.require({
					message: this.locales[ErrorCode.ASK_OVERWRITE],
					header: '',
					icon: 'pi pi-exclamation-triangle',
					accept: () => resolve(true),
					reject: () => resolve(false)
				})))
					return this.convert();
			}
			else if (error)
				this.$toast.add({
					severity: 'error',
					summary: 'Error',
					detail: this.locales[error],
					life: 3000
				});

			this.isConverting = false;
		}
	}
});
</script>

<style>
.p-button-success:not(:hover) .p-button-icon {
	transition: .5s ease-out;
	color: var(--primary-color-text) !important;
}

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