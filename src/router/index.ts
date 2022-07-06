import { createRouter, createWebHashHistory } from 'vue-router'
import MainView from '../views/MainView.vue'
import LicenseView from '@/views/LicenseView.vue';
import SettingsView from '@/views/SettingsView.vue';

const routes = [
	{
		path: '/',
		name: 'main',
		component: MainView
	},
	{
		path: '/license',
		name: 'license',
		component: LicenseView
	},
	{
		path: '/settings',
		name: 'settings',
		component: SettingsView
	}
]

const router = createRouter({
	history: createWebHashHistory(),
	routes
})

export default router
