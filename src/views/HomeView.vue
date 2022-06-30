<template>
	<div class="home flex-col">
		<div class="flex-row ui-block ui-block-v">
			<p-input-text id="path" style="flex-grow: 1"/>
			<p-button icon="pi fi fi-dots" />
		</div>
		<div class="flex-row flex-center mode-switch ui-block ui-block-v">
			<i class="pi fi fi-package mode-switch-icon"></i>
			<div style="width: 20%">
				<p-toggle-button
					v-model="xmlinput"
					onIcon="pi pi-arrow-left"
					offIcon="pi pi-arrow-right"
					class="button-bigtext"
					style="width: 100%"
				/>
			</div>
			<i class="pi fi fi-file mode-switch-icon"></i>
		</div>
	</div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";

@Options({
	components: {},
	data: () => ({
		xmlinput: false
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
	border: none !important;
	background: transparent !important;
	color: var(--primary-color) !important;
	box-shadow: none !important;
	font-size: 50pt !important;
}
</style>