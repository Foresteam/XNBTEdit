<template>
	<div class="home flex-col">
		<div class="ui-block-full flex-row" style="align-items: center">
			<p-checkbox id="bulk-checkbox" v-model="bulk" :binary="true" style="" />
			<label for="bulk-checkbox">Bulk mode</label>
		</div>
		<div class="flex-row ui-block-full">
			<p-input-text id="path" style="flex-grow: 1"/>
			<p-button icon="pi fi fi-dots" />
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
		<div class="flex-row ui-block-full" style="align-items: center">
			<p-tri-state-checkbox id="compression-checkbox" v-model="compression" />
			<label for="compression-checkbox" v-if="compression == null">Guess compression by header</label>
			<label for="compression-checkbox" v-if="compression == false">No compression</label>
			<label for="compression-checkbox" v-if="compression == true">GZip compression</label>
		</div>
	</div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";

@Options({
	components: {},
	data: () => ({
		xmlinput: false,
		compression: null,
		bulk: false
	})
})
export default class HomeView extends Vue {}
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
.p-tristatecheckbox, .p-checkbox {
	margin-right: 5pt !important;
	margin-left: 5pt !important;
}
</style>