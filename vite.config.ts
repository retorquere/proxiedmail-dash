import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	server: {
		proxy: {
			'/api/v1': {
				target: 'https://proxiedmail.com',
				changeOrigin: true,
				secure: true
			},
			'/gapi': {
				target: 'https://proxiedmail.com',
				changeOrigin: true,
				secure: true
			}
		}
	},
	plugins: [
		sveltekit(),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['pwa-192.svg', 'pwa-512.svg'],
			manifest: {
				name: 'ProxiedMail Workspace',
				short_name: 'ProxiedMail',
				description:
					'Manage proxy addresses, forwarding rules, automations, and account security from one installable workspace.',
				theme_color: '#0e1a24',
				background_color: '#f3efe6',
				display: 'standalone',
				start_url: '/',
				scope: '/',
				icons: [
					{
						src: '/pwa-192.svg',
						sizes: '192x192',
						type: 'image/svg+xml',
						purpose: 'any maskable'
					},
					{
						src: '/pwa-512.svg',
						sizes: '512x512',
						type: 'image/svg+xml',
						purpose: 'any maskable'
					}
				]
			},
			devOptions: {
				enabled: true
			}
		})
	]
});
