<script lang="ts">
	import { workspace } from '$lib/workspace';

	type AuthTab = 'sign-in' | 'create-account';

	let activeTab = $state<AuthTab>('sign-in');
	let username = $state('');
	let password = $state('');
	let registerEmail = $state('');
	let registerPassword = $state('');
	let registerPasswordConfirm = $state('');

	$effect(() => {
		if (!username && $workspace.dashboard.user?.email) {
			username = $workspace.dashboard.user.email;
		}
	});

	async function handleSignIn() {
		if (!username.trim() || !password.trim()) {
			return;
		}

		await workspace.signIn(username.trim(), password);
		password = '';
	}

	async function handleRegister() {
		if (!registerEmail.trim() || !registerPassword.trim() || !registerPasswordConfirm.trim()) {
			return;
		}

		if (registerPassword !== registerPasswordConfirm) {
			return;
		}

		if (registerPassword.length < 8) {
			return;
		}

		await workspace.registerUser(registerEmail.trim(), registerPassword);
		registerPassword = '';
		registerPasswordConfirm = '';
		activeTab = 'sign-in';
	}
</script>

<svelte:head>
	<title>Overview · ProxiedMail</title>
</svelte:head>

	<div class="section-head">
		<div>
			<p class="eyebrow">Overview</p>
			<h1>{$workspace.isAuthenticated ? 'Overview' : 'Sign in'}</h1>
		</div>
		{#if $workspace.isAuthenticated}
			<div class="stack-inline wrap">
				<a class="button" href="/workspace">Open proxies</a>
				<a class="button button-secondary" href="/security">Review security</a>
			</div>
		{/if}
	</div>

	{#if $workspace.isAuthenticated}
		<div class="hero-metrics overview-metrics">
			<div class="metric">
				<strong>{$workspace.dashboard.bindings.length}</strong>
				<span>proxy emails</span>
			</div>
			<div class="metric">
				<strong>{$workspace.dashboard.realEmails.length}</strong>
				<span>real inboxes</span>
			</div>
			<div class="metric">
				<strong>{$workspace.dashboard.availableDomains.length}</strong>
				<span>domain options</span>
			</div>
			<div class="metric">
				<strong>{$workspace.dashboard.user?.twoFactorEnabled ? 'On' : 'Off'}</strong>
				<span>two-factor</span>
			</div>
		</div>
	{/if}

{#if !$workspace.isAuthenticated}
	<section class="panel auth-panel">
		<div class="auth-tabs" role="tablist" aria-label="Authentication">
			<button
				class:auth-tab-active={activeTab === 'sign-in'}
				class="auth-tab"
				type="button"
				role="tab"
				aria-selected={activeTab === 'sign-in'}
				onclick={() => (activeTab = 'sign-in')}
			>
				Sign in
			</button>
			<button
				class:auth-tab-active={activeTab === 'create-account'}
				class="auth-tab"
				type="button"
				role="tab"
				aria-selected={activeTab === 'create-account'}
				onclick={() => (activeTab = 'create-account')}
			>
				Create account
			</button>
		</div>

		{#if activeTab === 'sign-in'}
			<div>
				<p class="eyebrow">Account</p>
				<h2>Sign in</h2>
				<label class="field">
					<span>Email or username</span>
					<input bind:value={username} placeholder="you@example.com" />
				</label>
				<label class="field">
					<span>Password</span>
					<input type="password" bind:value={password} placeholder="Password" />
				</label>
				<button class="button" type="button" onclick={handleSignIn}>Sign in</button>
			</div>
		{:else}
			<div>
				<p class="eyebrow">Account</p>
				<h2>Create account</h2>
				<label class="field">
					<span>Email</span>
					<input bind:value={registerEmail} placeholder="new-user@example.com" />
				</label>
				<label class="field">
					<span>Password</span>
					<input type="password" bind:value={registerPassword} placeholder="Choose a password" />
				</label>
				<label class="field">
					<span>Confirm password</span>
					<input type="password" bind:value={registerPasswordConfirm} placeholder="Repeat your password" />
				</label>
				{#if registerPasswordConfirm && registerPassword !== registerPasswordConfirm}
					<p class="form-error">Passwords do not match.</p>
				{/if}
				<button class="button" type="button" onclick={handleRegister}>Create account</button>
			</div>
		{/if}
	</section>
{/if}

	{#if $workspace.isAuthenticated}
		<section class="panel">
			<p class="eyebrow">Account</p>
			<h2>Current account</h2>
			<div class="token-list">
				{#each $workspace.dashboard.bindings.slice(0, 4) as binding}
					<span class="token">{binding.proxyAddress}</span>
				{/each}
			</div>
			<p class="muted">
				Quota: {$workspace.dashboard.quota.usedProxyBindings} used / {$workspace.dashboard.quota.availableProxyBindings} available
			</p>
		</section>
	{/if}
