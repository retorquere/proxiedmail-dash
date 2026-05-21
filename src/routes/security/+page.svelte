<script lang="ts">
	import { generatePassword, getPasswordPreferences } from '$lib/passwords';
	import { workspace } from '$lib/workspace';

	let passwordLength = $state(16);
	let useSymbols = $state(true);
	let useNumbers = $state(true);
	let useLetters = $state(true);
	let passwordPreview = $state('');
	let smsPhone = $state('');
	let smsCode = $state('');
	let googleEmail = $state('');
	let googleCode = $state('');

	function regeneratePreview() {
		passwordPreview = generatePassword({ passwordLength, useSymbols, useNumbers, useLetters });
	}

	$effect(() => {
		const preferences = getPasswordPreferences($workspace.dashboard.settings);
		passwordLength = preferences.passwordLength;
		useSymbols = preferences.useSymbols;
		useNumbers = preferences.useNumbers;
		useLetters = preferences.useLetters;
		if (!passwordPreview) {
			regeneratePreview();
		}

		if (!googleEmail && $workspace.dashboard.user?.email) {
			googleEmail = $workspace.dashboard.user.email;
		}
	});

	async function handleSaveSettings() {
		await workspace.saveSettings({ passwordLength, useSymbols, useNumbers, useLetters });
		regeneratePreview();
	}

	async function handleStartSms() {
		if (!smsPhone.trim()) {
			return;
		}

		await workspace.startSmsTwoFactor(smsPhone.trim());
	}

	async function handleConfirmSms() {
		if (!smsCode.trim()) {
			return;
		}

		await workspace.confirmSmsTwoFactor(smsCode.trim());
		smsCode = '';
	}

	async function handleStartGoogle() {
		if (!googleEmail.trim()) {
			return;
		}

		await workspace.startGoogleTwoFactor(googleEmail.trim());
	}

	async function handleConfirmGoogle() {
		if (!googleCode.trim()) {
			return;
		}

		await workspace.confirmGoogleTwoFactor(googleCode.trim());
		googleCode = '';
	}
</script>

<svelte:head>
	<title>Security · ProxiedMail</title>
</svelte:head>

<div class="section-head">
	<div>
		<p class="eyebrow">Security</p>
		<h1>Account hardening without burying the basics</h1>
		<p class="lead">
			Password generation preferences and two-factor controls are grouped here so the rest of the product can
			stay task-focused while security remains explicit and easy to audit.
		</p>
	</div>
</div>

<div class="grid-2">
	<section class="panel">
		<p class="eyebrow">Account posture</p>
		<h2>Current protection state</h2>
		<div class="list-block">
			<article class="list-row">
				<div>
					<strong>{$workspace.dashboard.user?.email || 'Not connected'}</strong>
					<p>Primary account identity</p>
				</div>
				<span class="pill neutral-pill">{$workspace.dashboard.user?.isPaid ? 'Paid plan' : 'Free plan'}</span>
			</article>
			<article class="list-row">
				<div>
					<strong>Two-factor authentication</strong>
					<p>{$workspace.dashboard.user?.twoFactorEnabled ? 'Enabled on the account' : 'Not enabled yet'}</p>
				</div>
				<span class:good-pill={$workspace.dashboard.user?.twoFactorEnabled} class:neutral-pill={!$workspace.dashboard.user?.twoFactorEnabled} class="pill">
					{$workspace.dashboard.user?.twoFactorEnabled ? 'Protected' : 'At risk'}
				</span>
			</article>
		</div>
		<button class="button button-secondary" type="button" onclick={() => workspace.removeTwoFactor()}>
			Remove two-factor
		</button>
	</section>

	<section class="panel">
		<p class="eyebrow">Password generator</p>
		<h2>Save the defaults your team actually uses</h2>
		<label class="field">
			<span>Length</span>
			<input type="number" min="8" max="64" bind:value={passwordLength} />
		</label>
		<div class="stack-inline wrap">
			<label class="field checkbox-row slim-check">
				<input type="checkbox" bind:checked={useLetters} />
				<span>Letters</span>
			</label>
			<label class="field checkbox-row slim-check">
				<input type="checkbox" bind:checked={useNumbers} />
				<span>Numbers</span>
			</label>
			<label class="field checkbox-row slim-check">
				<input type="checkbox" bind:checked={useSymbols} />
				<span>Symbols</span>
			</label>
		</div>
		<div class="soft-box result-box">
			<p><strong>Preview</strong></p>
			<code>{passwordPreview}</code>
		</div>
		<div class="stack-inline wrap">
			<button class="button button-secondary" type="button" onclick={regeneratePreview}>Regenerate</button>
			<button class="button" type="button" onclick={handleSaveSettings}>Save defaults</button>
		</div>
	</section>
</div>

<div class="grid-2">
	<section class="panel">
		<p class="eyebrow">SMS two-factor</p>
		<h2>Phone-based challenge flow</h2>
		<label class="field">
			<span>Phone number</span>
			<input bind:value={smsPhone} placeholder="+1 555 000 0000" />
		</label>
		<div class="stack-inline wrap">
			<button class="button" type="button" onclick={handleStartSms}>Send code</button>
			<input bind:value={smsCode} placeholder="Confirmation code" />
			<button class="button button-secondary" type="button" onclick={handleConfirmSms}>Confirm</button>
		</div>
	</section>

	<section class="panel">
		<p class="eyebrow">Authenticator app</p>
		<h2>Google Authenticator flow</h2>
		<label class="field">
			<span>Email</span>
			<input bind:value={googleEmail} placeholder="you@example.com" />
		</label>
		<button class="button" type="button" onclick={handleStartGoogle}>Create authenticator secret</button>
		{#if $workspace.googleSetup}
			<div class="soft-box result-box">
				<p><strong>Secret</strong></p>
				<code>{$workspace.googleSetup.secret}</code>
				{#if $workspace.googleSetup.qrUrl}
					<img src={$workspace.googleSetup.qrUrl} alt="Authenticator QR code" class="qr-image" />
				{/if}
			</div>
		{/if}
		<div class="stack-inline wrap">
			<input bind:value={googleCode} placeholder="Authenticator code" />
			<button class="button button-secondary" type="button" onclick={handleConfirmGoogle}>Confirm</button>
		</div>
	</section>
</div>

{#if $workspace.recoveryCodes.length}
	<section class="panel">
		<p class="eyebrow">Recovery codes</p>
		<h2>Store these offline now</h2>
		<div class="token-list">
			{#each $workspace.recoveryCodes as code}
				<span class="token code-token">{code}</span>
			{/each}
		</div>
	</section>
{/if}

<style>
	.qr-image {
		max-width: 200px;
		width: 100%;
		border-radius: 18px;
		background: #fff;
		padding: 0.75rem;
		margin-top: 0.75rem;
	}
</style>
