<script lang="ts">
	import ProxyBindingCard from '$lib/components/ProxyBindingCard.svelte';
	import { workspace } from '$lib/workspace';

	let localPart = $state('');
	let domain = $state('');
	let realAddress = $state('');
	let callbackUrl = $state('');
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
			callbackUrl,
			wildcardAutoCreate
		});

		localPart = '';
		callbackUrl = '';
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

<div class="grid-2 workspace-top">
	<section class="panel create-panel">
		<p class="eyebrow">New proxy email</p>
		<h2>Create a proxy email</h2>
		<div class="inline-form grow">
			<input bind:value={localPart} placeholder="billing.novabridge" />
			<select bind:value={domain}>
				{#each $workspace.dashboard.availableDomains as option}
					<option value={option.domain}>{option.displayName}</option>
				{/each}
			</select>
		</div>
		<div class="inline-form grow">
			<select bind:value={realAddress}>
				{#each $workspace.dashboard.verifiedEmails as email}
					<option value={email}>{email}</option>
				{/each}
			</select>
			<input bind:value={callbackUrl} placeholder="Optional callback URL" />
		</div>
		<div class="stack-inline wrap">
			<label class="field checkbox-row slim-check">
				<input type="checkbox" bind:checked={isBrowsable} />
				<span>Store received emails</span>
			</label>
			<label class="field checkbox-row slim-check">
				<input type="checkbox" bind:checked={wildcardAutoCreate} />
				<span>Enable wildcard auto-create</span>
			</label>
		</div>
		<button class="button" type="button" onclick={handleCreateBinding}>Create proxy email</button>
	</section>
</div>

<div class="stack-lg">
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
