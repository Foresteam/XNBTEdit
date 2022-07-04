import { createRouter, createWebHashHistory } from 'vue-router'
import MainView from '../views/MainView.vue'

const routes = [
	{
		path: '/',
		name: 'main',
		component: MainView
	},
	{
		path: '/license',
		name: 'license',
		component: () => import('../views/LicenseView.vue')
	},
	{
		path: '/settings',
		name: 'settings',
		component: () => import('../views/SettingsView.vue')
	}
]

const router = createRouter({
	history: createWebHashHistory(),
	routes
})

export default router
