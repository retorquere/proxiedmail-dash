<script lang="ts">
	import ProxyBindingCard from '$lib/components/ProxyBindingCard.svelte';
	import { workspace } from '$lib/workspace';

	let localPart = $state('');
	let domain = $state('');
	let realAddress = $state('');
	let isBrowsable = $state(true);
	let wildcardAutoCreate = $state(false);

	$effect(() => {
		if (!domain && $workspace.dashboard.availableDomains.length > 0) {
			domain = $workspace.dashboard.availableDomains[0].domain;
		}

		if (!realAddress && $workspace.dashboard.verifiedEmails.length > 0) {
			realAddress = $workspace.dashboard.verifiedEmails[0];
		}
	});

	async function handleCreateBinding() {
		if (!localPart.trim() || !domain.trim() || !realAddress.trim()) {
			return;
		}

		await workspace.createProxyBinding({
			proxyAddress: `${localPart.trim()}@${domain.trim()}`,
			realAddresses: [realAddress.trim()],
			isBrowsable,
			callbackUrl: '',
			wildcardAutoCreate
		});

		localPart = '';
		wildcardAutoCreate = false;
	}
</script>

<svelte:head>
	<title>Proxies · ProxiedMail</title>
</svelte:head>

<div class="section-head">
	<div>
		<p class="eyebrow">Proxies</p>
		<h1>Proxy emails</h1>
	</div>
	<div class="stack-inline wrap">
		<div class="metric compact">
			<strong>{$workspace.dashboard.quota.usedProxyBindings}</strong>
			<span>used</span>
		</div>
		<div class="metric compact">
			<strong>{$workspace.dashboard.quota.availableProxyBindings}</strong>
			<span>remaining</span>
		</div>
	</div>
</div>

<section class="panel create-panel compact-create-panel">
	<div class="compact-create-head">
		<p class="eyebrow">New proxy</p>
		<h2>Create proxy</h2>
	</div>
	<div class="compact-create-grid compact-create-address">
		<input bind:value={localPart} placeholder="billing.novabridge" />
		<select bind:value={domain}>
			{#each $workspace.dashboard.availableDomains as option}
				<option value={option.domain}>{option.displayName}</option>
			{/each}
		</select>
		<select bind:value={realAddress}>
			{#each $workspace.dashboard.verifiedEmails as email}
				<option value={email}>{email}</option>
			{/each}
		</select>
		<button class="button" type="button" onclick={handleCreateBinding}>Create</button>
	</div>
	<div class="compact-create-options">
		<label class="checkbox-row slim-check compact-check">
			<input type="checkbox" bind:checked={isBrowsable} />
			<span>Store received emails</span>
		</label>
		<label class="checkbox-row slim-check compact-check">
			<input type="checkbox" bind:checked={wildcardAutoCreate} />
			<span>Enable wildcard auto-create</span>
		</label>
	</div>
</section>

<div class="proxies-list">
	{#each $workspace.dashboard.bindings as binding}
		<ProxyBindingCard
			binding={binding}
			usedOnList={$workspace.dashboard.usedOn.find((entry) => entry.proxyBindingId === binding.id)?.list ?? []}
			savedPassword={$workspace.dashboard.passwords.find((entry) => entry.relatedToId === binding.id)?.password ?? ''}
			contacts={$workspace.dashboard.contactsByBinding[binding.id] ?? []}
			receivedLinks={$workspace.dashboard.receivedLinksByBinding[binding.id] ?? []}
			receivedDetailsById={$workspace.dashboard.receivedDetailsById}
		/>
	{/each}
</div>

<style>
	.compact-create-panel {
		display: grid;
		gap: 0.75rem;
		padding: 1rem;
	}

	.compact-create-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}

	.compact-create-head .eyebrow {
		margin-bottom: 0;
	}

	.compact-create-head h2 {
		font-size: 1rem;
	}

	.compact-create-grid {
		display: grid;
		grid-template-columns: 1.2fr 0.9fr 1fr auto;
		gap: 0.7rem;
		align-items: center;
	}

	.compact-create-options {
		display: flex;
		flex-wrap: wrap;
		gap: 0.55rem;
	}

	.compact-check {
		padding: 0.5rem 0.7rem;
		font-size: 0.9rem;
	}

	.proxies-list {
		display: grid;
		gap: 1rem;
		align-items: start;
	}

	@media (max-width: 1200px) {
		.compact-create-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.compact-create-grid .button {
			grid-column: 1 / -1;
		}
	}

	@media (max-width: 720px) {
		.compact-create-head {
			align-items: start;
			flex-direction: column;
			gap: 0.2rem;
		}

		.compact-create-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
