<script lang="ts">
	import { workspace } from '$lib/workspace';

	let replaceSource = $state('');
	let replaceTarget = $state('');
	let confirmationEmail = $state('');

	$effect(() => {
		if (!replaceSource && $workspace.dashboard.realEmails.length > 0) {
			replaceSource = $workspace.dashboard.realEmails[0].email;
		}

		if (!confirmationEmail && $workspace.dashboard.realEmails.length > 0) {
			confirmationEmail = $workspace.dashboard.realEmails[0].email;
		}
	});

	async function handleReplace() {
		if (!replaceSource || !replaceTarget.trim()) {
			return;
		}

		await workspace.replaceRealEmail(replaceSource, replaceTarget.trim());
		replaceTarget = '';
	}

	async function handleResend() {
		if (!confirmationEmail) {
			return;
		}

		await workspace.resendConfirmation(confirmationEmail);
	}

	function isVerifiedAddress(email: string, isVerified: boolean) {
		return isVerified || $workspace.dashboard.verifiedEmails.includes(email);
	}
</script>

<svelte:head>
	<title>Addresses · ProxiedMail</title>
</svelte:head>

<div class="section-head">
	<div>
		<p class="eyebrow">Addresses</p>
		<h1>Keep forwarding identities clean and auditable</h1>
		<p class="lead">
			This area separates real inbox ownership and domain availability from day-to-day alias handling, so
			address maintenance stays deliberate instead of hidden inside every proxy card.
		</p>
	</div>
</div>

<div class="grid-2">
	<section class="panel">
		<p class="eyebrow">Real inboxes</p>
		<h2>Verified destinations</h2>
		<div class="list-block">
			{#each $workspace.dashboard.realEmails as entry}
				{@const verified = isVerifiedAddress(entry.email, entry.isVerified)}
				<article class="list-row">
					<div>
						<strong>{entry.email}</strong>
						<p>{entry.isDefault ? 'Default destination' : 'Secondary destination'}</p>
					</div>
					<div class="stack-inline">
						<span class:good-pill={verified} class:neutral-pill={!verified} class="pill">
							{verified ? 'Verified' : 'Pending'}
						</span>
					</div>
				</article>
			{/each}
		</div>
	</section>

	<section class="panel">
		<p class="eyebrow">Replacement flow</p>
		<h2>Swap a real address everywhere</h2>
		<label class="field">
			<span>Current address</span>
			<select bind:value={replaceSource}>
				{#each $workspace.dashboard.realEmails as entry}
					<option value={entry.email}>{entry.email}</option>
				{/each}
			</select>
		</label>
		<label class="field">
			<span>New address</span>
			<input bind:value={replaceTarget} placeholder="new-owner@example.com" />
		</label>
		<button class="button" type="button" onclick={handleReplace}>Replace address</button>
		<div class="divider"></div>
		<label class="field">
			<span>Resend confirmation</span>
			<select bind:value={confirmationEmail}>
				{#each $workspace.dashboard.realEmails as entry}
					<option value={entry.email}>{entry.email}</option>
				{/each}
			</select>
		</label>
		<button class="button button-secondary" type="button" onclick={handleResend}>Resend verification</button>
	</section>
</div>

<div class="grid-2">
	<section class="panel">
		<p class="eyebrow">Domain inventory</p>
		<h2>Available proxy domains</h2>
		<div class="token-list">
			{#each $workspace.dashboard.availableDomains as domain}
				<span class="token domain-token">
					<strong>{domain.displayName}</strong>
					<small>{domain.isPremium ? 'premium' : 'included'}</small>
				</span>
			{/each}
		</div>
		<p class="muted soft-box">
			Microsoft-hosted real inboxes are {#if $workspace.dashboard.microsoftDomainsEnabled}currently allowed{:else}currently restricted{/if} for this account.
		</p>
	</section>

	<section class="panel">
		<p class="eyebrow">Custom domains</p>
		<h2>Domains tied to your account</h2>
		{#if $workspace.dashboard.customDomains.length}
			<div class="list-block">
				{#each $workspace.dashboard.customDomains as domain}
					<article class="list-row">
						<div>
							<strong>{domain.domain}</strong>
							<p>{domain.displayName}</p>
						</div>
						<span class="pill neutral-pill">status {domain.status}</span>
					</article>
				{/each}
			</div>
		{:else}
			<p class="muted">No custom domains were returned by the API for this account.</p>
		{/if}
		<div class="divider"></div>
		<p class="eyebrow">Verified picker</p>
		<div class="token-list">
			{#each $workspace.dashboard.verifiedEmails as email}
				<span class="token">{email}</span>
			{/each}
		</div>
	</section>
</div>
