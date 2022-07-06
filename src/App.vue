<template>
	<div class="flex-row ui-block-b" id="header" :style="!isMainPage ? { 'flex-direction': 'row' } : {}">
		<span v-if="isMainPage">
			<p-button
				icon="pi fi fi-license"
				:class="{
					'button-bigtext': true,
					'ui-block': true,
					'p-button-warning': !seenLicense
				}"
				title="License"
				@click="showLicense"
			/>
			<p-button icon="pi pi-info-circle" class="button-bigtext ui-block" title="About" @click="openGitHub()" />
			<p-button icon="pi fi fi-gear" class="button-bigtext ui-block" title="Settings" @click="$router.push({ name: 'settings' })" />
		</span>
		<p-button v-else icon="pi pi-arrow-left" class="button-bigtext ui-block" @click="$router.back()" />
	</div>
	<router-view v-slot="{ Component, route }">
		<transition :name="!isMainPage ? 'slide' : 'slide_back'" mode="out-in">
			<keep-alive>
				<component :is="Component" :key="route.path" />
			</keep-alive>
		</transition>
	</router-view>
	<p-confirm-dialog />
	<p-toast position="top-left" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapActions, mapState } from 'pinia';
import { useConfig } from './store/configStore';
import '@/shared/IPCTypes';

export default defineComponent({
	computed: {
		isMainPage(): boolean {
			return this.$route.name == 'main';
		},
		...mapState(useConfig, ['seenLicense', 'tookTheRisk', 'locales'])
	},
	methods: {
		openGitHub(): void {
			window.backend.ExternalURL('https://github.com/Foresteam/XNBTEdit')
		},
		showLicense(): void {
			this.configure('seenLicense', true);
			this.$router.push('license');
		},
		...mapActions(useConfig, ['fetchConfig', 'configure'])
	},
	async mounted() {
		await this.fetchConfig();
		if (this.tookTheRisk)
			return;
		this.tookTheRisk = await new Promise(resolve => this.$confirm.require({
			header: 'Warning',
			message: this.locales['App.risk-warning.text'],
			icon: 'pi pi-exclamation-triangle',
			acceptLabel: this.locales['App.risk-warning.accept'],
			rejectLabel: this.locales['App.risk-warning.reject'],
			accept: () => resolve(true),
			reject: () => resolve(false),
		}));
		if (!this.tookTheRisk)
			window.close();
	}
});
</script>

<style>
@font-face {
	font-family: "Veles";
	src: url("../public/fonts/Veles-Regular.0.9.2.otf");
}
@font-face {
	font-family: "Oxygen";
	src: url("../public/fonts/Oxygen-Regular.ttf");
}
@font-face {
	font-family: "Gears of Peace";
	src: url("../public/fonts/GearsOfPeace.ttf");
}
.sexy-font {
	font-family: "Veles", "Liberation mono", sans-serif !important;
}
.shift-em {
	font-family: "Gears of Peace", "Liberation mono", sans-serif !important;
}
.title {
	font-size: 40pt;
}
.title2 {
	font-size: 15pt;
}
.title2-5 {
	font-size: 30pt;
}

.slide-enter-active, .slide-leave-active {
	transition: 0.15s ease-out;
	transform: 0.15s;
}
.slide-enter-from {
	opacity: 0;
	transform: translateX(30%);
}
.slide-leave-to {
	opacity: 0;
	transform: translateX(-30%);
}
.slide_back-enter-active, .slide_back-leave-active {
	transition: 0.15s ease-out;
	transform: 0.15s;
}
.slide_back-enter-from {
	opacity: 0;
	transform: translateX(-30%);
}
.slide_back-leave-to {
	opacity: 0;
	transform: translateX(30%);
}

#app {
	/* font-family: Avenir, Helvetica, Arial, sans-serif; */
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-align: center;
	background: transparent;
	font-family: "Liberation mono", sans-serif;
	display: flex;
	flex-flow: column;
	overflow: hidden;
}
body {
	background: var(--surface-b);
	color: var(--text-color);
	margin: 0pt;
}
#app,
body,
html {
	height: 100%;
}
#main {
	flex-grow: 1;
	overflow-y: hidden;
	margin-top: 4pt;
	margin-bottom: 4pt;
	margin-right: 2pt;
	margin-left: 2pt;
}
#header {
	display: flex;
	align-items: center;
	background: var(--surface-b);
}
#footer {
	display: flex;
	justify-content: center;
	align-items: center;
	background: var(--surface-b);
	border-top: 2px solid var(--surface-d);
}
.ui-block-b {
	margin-bottom: 2pt !important;
}
.ui-block-t {
	margin-top: 2pt !important;
}
.ui-block-h {
	margin-left: 2pt !important;
	margin-right: 2pt !important;
}
.ui-block-v {
	margin-bottom: 2pt !important;
	margin-top: 2pt !important;
}
.ui-block {
	margin: 2pt !important;
}
.flex-row {
	display: flex;
	flex-flow: row;
}
.flex-col {
	display: flex;
	flex-flow: column;
}
.flex-center {
	align-items: center;
	justify-content: center;
}

.p-tabmenuitem {
	font-size: 27pt;
}
.p-divider::before {
	border-left: 1px solid var(--surface-d) !important;
}
#footer .p-divider::before {
	border-left: 2px solid var(--surface-d) !important;
}
.p-tristatecheckbox, .p-checkbox, .p-inputswitch {
	margin-right: 5pt !important;
}
.p-dialog-header-icon.p-dialog-header-close.p-link {
	display: none;
}

::-webkit-scrollbar {
	width: 7px;
}
::-webkit-scrollbar-track {
	background-color: var(--surface-c);
}
::-webkit-scrollbar-thumb {
	background: var(--surface-d);
}
::-webkit-scrollbar-thumb:hover {
	background: var(--surface-100);
}
::-webkit-scrollbar-thumb:active {
	background: var(--surface-200);
}

label {
	text-align: left;
}
#header {
	width: 100%;
	/* background: var(--surface-a); */
	flex-direction: row-reverse;
}
</style>