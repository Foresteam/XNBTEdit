const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
	transpileDependencies: true,
	pluginOptions: {
		electronBuilder: {
			preload: 'src/preload.ts',
			customFileProtocol: './',
			builderOptions: {
				appId: 'xnbtedit.foresteam.github.com',
				productName: 'XNBTEdit',
				linux: {
					target: 'AppImage',
					icon: 'public/',
					category: 'Utility',
					synopsis: 'NBT-XML converter'
				},
				win: {
					target: 'msi',
					icon: 'public/icon.ico'
				}
			}
		}
	},
})