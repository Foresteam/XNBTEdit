<template>
	<router-view />
</template>

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

.slide-enter-active,
.slide-leave-active {
	transition: 0.15s ease-out;
	transform: 0.15s;
}
.slide-enter-from {
	opacity: 0;
	transform: translateY(30%);
}
.slide-leave-to {
	opacity: 0;
	transform: translateY(-30%);
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
.ui-block {
	margin-left: 2pt !important;
	margin-right: 2pt !important;
}
.ui-block-b {
	margin-bottom: 2pt !important;
}
.ui-block-t {
	margin-top: 2pt !important;
}
.ui-block-v {
	margin-bottom: 2pt !important;
	margin-top: 2pt !important;
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
</style>