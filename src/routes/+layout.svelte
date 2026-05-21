<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { workspace } from '$lib/workspace';
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children } = $props();

	const navItems = [
		{ href: '/', label: 'Overview' },
		{ href: '/workspace', label: 'Proxies' },
		{ href: '/addresses', label: 'Addresses' },
		{ href: '/tools', label: 'Tools' },
		{ href: '/security', label: 'Security' }
	];

	onMount(() => {
		workspace.bootstrap();
	});

	function isActive(href: string) {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}

	const protectedPaths = ['/workspace', '/addresses', '/tools', '/security'];

	function isProtectedPath(pathname: string) {
		return protectedPaths.some((path) => pathname.startsWith(path));
	}

	function visibleNavItems(isAuthenticated: boolean) {
		return isAuthenticated ? navItems : navItems.filter((item) => item.href === '/');
	}
</script>

<svelte:head>
	<title>ProxiedMail</title>
	<meta
		name="description"
		content="Installable control panel for proxy email operations, address management, automations, and account security."
	/>
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="theme-color" content="#0e1a24" />
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="shell">
	<aside class="sidebar panel">
		<div class="brand-block">
			<p class="eyebrow">ProxiedMail</p>
			<h1>Control panel</h1>
		</div>

		<nav class="nav-stack" aria-label="Primary">
			{#each visibleNavItems($workspace.isAuthenticated) as item}
				<a class:nav-link-active={isActive(item.href)} class="nav-link" href={item.href}>{item.label}</a>
			{/each}
		</nav>

		<div class="sidebar-card">
			<p class="eyebrow">Account</p>
			<p class="muted">
				{$workspace.isAuthenticated
					? $workspace.dashboard.user?.email || $workspace.session.baseUrl
					: ''}
			</p>
			<div class="stack-inline wrap">
				{#if $workspace.isAuthenticated}
					<button class="button button-secondary" type="button" onclick={() => workspace.refresh()}>
						Reload data
					</button>
					<button class="button button-secondary" type="button" onclick={() => workspace.signOut()}>
						Sign out
					</button>
				{/if}
			</div>
		</div>
	</aside>

	<div class="content-frame">
		<header class="topbar">
			<div>
				<h2>{navItems.find((item) => isActive(item.href))?.label || 'Overview'}</h2>
			</div>
			{#if $workspace.isAuthenticated}
				<div class="stack-inline wrap">
					<span class:good-pill={!$workspace.syncing} class:accent-pill={$workspace.syncing} class="pill">
						{$workspace.syncing ? 'Syncing' : 'Ready'}
					</span>
					<span class="pill neutral-pill">{$workspace.dashboard.bindings.length} proxies</span>
				</div>
			{/if}
		</header>

		{#if $workspace.notice}
			<div class="banner banner-note">{$workspace.notice}</div>
		{/if}

		{#if $workspace.error}
			<div class="banner banner-error">{$workspace.error}</div>
		{/if}

		<main class="page-body">
			{#if !$workspace.isAuthenticated && isProtectedPath(page.url.pathname)}
				<section class="panel">
					<p class="eyebrow">Sign in required</p>
					<h2>Sign in to continue</h2>
					<p class="muted">Proxies, addresses, tools, and security are available after authentication.</p>
					<a class="button" href="/">Go to overview</a>
				</section>
			{:else}
				{@render children()}
			{/if}
		</main>
	</div>
</div>
