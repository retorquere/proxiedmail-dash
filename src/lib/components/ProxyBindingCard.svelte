<script lang="ts">
	import type { ProxyBinding, ProxyContact, ReceivedEmailDetails, ReceivedEmailLink } from '$lib/proxiedmail';
	import { workspace } from '$lib/workspace';

	interface Props {
		binding: ProxyBinding;
		usedOnList?: string[];
		savedPassword?: string;
		contacts?: ProxyContact[];
		receivedLinks?: ReceivedEmailLink[];
		receivedDetailsById?: Record<string, ReceivedEmailDetails>;
	}

	let {
		binding,
		usedOnList = [],
		savedPassword = '',
		contacts = [],
		receivedLinks = [],
		receivedDetailsById = {}
	}: Props = $props();

	let syncKey = $state('');
	let description = $state('');
	let callbackUrl = $state('');
	let wildcardAutoCreate = $state(false);
	let usedOnInput = $state('');
	let password = $state('');
	let extraRealAddress = $state('');
	let toggledAddresses = $state<Record<string, boolean>>({});
	let contactEmail = $state('');
	let contactDescription = $state('');
	let openMessageId = $state('');

	$effect(() => {
		const nextKey = JSON.stringify({
			binding,
			usedOnList,
			savedPassword
		});

		if (syncKey === nextKey) {
			return;
		}

		syncKey = nextKey;
		description = binding.description;
		callbackUrl = binding.callbackUrl;
		wildcardAutoCreate = binding.wildcardAutoCreate || binding.wildcardAutoCreateOn;
		usedOnInput = usedOnList.join(', ');
		password = savedPassword;
		extraRealAddress = '';
		contactEmail = '';
		contactDescription = '';
		toggledAddresses = Object.fromEntries(binding.realAddresses.map((entry) => [entry.email, entry.isEnabled]));
	});

	function toTagList(input: string): string[] {
		return input
			.split(',')
			.map((entry) => entry.trim())
			.filter(Boolean);
	}

	async function handleSave() {
		await workspace.saveProxyBinding({
			id: binding.id,
			proxyAddress: binding.proxyAddress,
			description,
			callbackUrl,
			wildcardAutoCreate,
			realAddresses: Object.fromEntries(
				Object.entries(toggledAddresses).map(([email, isEnabled]) => [email, { isEnabled }])
			),
			newRealAddress: extraRealAddress || undefined
		});
	}

	async function handleDelete() {
		if (!confirm(`Delete ${binding.proxyAddress}?`)) {
			return;
		}

		await workspace.deleteProxyBinding(binding.id);
	}

	async function handlePasswordSave() {
		if (!password.trim()) {
			return;
		}

		await workspace.savePassword(binding.id, password.trim());
	}

	async function handleUsedOnSave() {
		await workspace.saveUsedOn(binding.id, toTagList(usedOnInput));
	}

	async function handleCreateContact() {
		if (!contactEmail.trim()) {
			return;
		}

		await workspace.createContact(binding.id, contactEmail.trim(), contactDescription.trim());
		contactEmail = '';
		contactDescription = '';
	}

	async function handleOpenEmail(mailId: string) {
		openMessageId = mailId;
		await workspace.openReceivedEmail(mailId);
	}
</script>

<div class="binding-row" id={binding.id}>
	<details class="binding-details">
		<summary class="binding-summary-row">
			<div class="binding-identity">
				<h2>{binding.proxyAddress}</h2>
				<p class="muted binding-subline">
					{#if binding.description}
						{binding.description}
					{:else if binding.realAddresses.length}
						{binding.realAddresses[0].email}
						{#if binding.realAddresses.length > 1}
							+{binding.realAddresses.length - 1} more
						{/if}
					{:else}
						No forwarding destination
					{/if}
				</p>
			</div>

			<div class="binding-row-stats">
				<span><strong>{binding.realAddresses.length}</strong> dest.</span>
				<span><strong>{binding.receivedEmails}</strong> received</span>
				<span><strong>{contacts.length}</strong> contacts</span>
			</div>

			<div class="binding-row-badges">
				<span class:good-pill={binding.isBrowsable} class:neutral-pill={!binding.isBrowsable} class="pill">
					{binding.isBrowsable ? 'Stored emails' : 'Forward only'}
				</span>
				<span class:accent-pill={wildcardAutoCreate} class:neutral-pill={!wildcardAutoCreate} class="pill">
					{wildcardAutoCreate ? 'Wildcard on' : 'Wildcard off'}
				</span>
			</div>

			<div class="binding-row-toggle">
				<span>Manage</span>
			</div>
		</summary>

		<div class="binding-details-body">
			<div class="binding-grid">
				<section class="detail-section">
					<p class="label">Routing</p>
					<label class="field">
						<span>Description</span>
						<input bind:value={description} placeholder="What is this alias for?" />
					</label>
					<label class="field">
						<span>Callback URL</span>
						<input bind:value={callbackUrl} placeholder="https://hooks.example.com/inbound" />
					</label>
					<label class="field checkbox-row">
						<input type="checkbox" bind:checked={wildcardAutoCreate} />
						<span>Auto-create wildcard matches</span>
					</label>
					<label class="field">
						<span>Add another real email</span>
						<input bind:value={extraRealAddress} placeholder="alias owner address" />
					</label>
					<div class="stack-inline actions">
						<button class="button" type="button" onclick={handleSave}>Save binding</button>
						<button class="button button-secondary" type="button" onclick={handleDelete}>Delete</button>
					</div>
				</section>

				<section class="detail-section">
					<p class="label">Forwarding destinations</p>
					<div class="token-list">
						{#each binding.realAddresses as address}
							<label class="token chip-toggle">
								<input
									type="checkbox"
									checked={toggledAddresses[address.email] ?? address.isEnabled}
									onchange={(event) => {
										toggledAddresses = {
											...toggledAddresses,
											[address.email]: (event.currentTarget as HTMLInputElement).checked
										};
									}}
								/>
								<span>{address.email}</span>
								<strong>{address.isVerified ? 'verified' : 'needs verification'}</strong>
							</label>
						{/each}
					</div>
					<p class="label">Usage tags</p>
					<label class="field">
						<span>Comma-separated websites or systems</span>
						<input bind:value={usedOnInput} placeholder="Stripe, Airtable, Linear" />
					</label>
					<button class="button button-secondary" type="button" onclick={handleUsedOnSave}>Save tags</button>
					<p class="label">Stored password</p>
					<div class="inline-form">
						<input bind:value={password} placeholder="Store or rotate password" />
						<button class="button button-secondary" type="button" onclick={handlePasswordSave}>Store</button>
					</div>
				</section>
			</div>

			<div class="binding-grid binding-grid-secondary">
				<section class="detail-section">
					<div class="section-head compact-head">
						<div>
							<p class="eyebrow">Contacts</p>
							<h3>Reply-capable senders</h3>
						</div>
						<button class="button button-secondary" type="button" onclick={() => workspace.loadContacts(binding.id)}>
							Refresh contacts
						</button>
					</div>
					<div class="inline-form grow">
						<input bind:value={contactEmail} placeholder="contact@example.com" />
						<input bind:value={contactDescription} placeholder="Relationship or context" />
						<button class="button" type="button" onclick={handleCreateContact}>Add</button>
					</div>
					{#if contacts.length}
						<div class="list-block">
							{#each contacts as contact}
								<article class="list-row">
									<div>
										<strong>{contact.recipientEmail}</strong>
										<p>{contact.description || 'No label'}</p>
									</div>
									<code>{contact.reverseProxyAddress}</code>
								</article>
							{/each}
						</div>
					{:else}
						<p class="muted">No contacts loaded yet for this proxy email.</p>
					{/if}
				</section>

				<section class="detail-section">
					<div class="section-head compact-head">
						<div>
							<p class="eyebrow">Stored emails</p>
							<h3>Recent inbound mail</h3>
						</div>
						<button class="button button-secondary" type="button" onclick={() => workspace.loadReceivedEmails(binding.id)}>
							Load messages
						</button>
					</div>
					{#if receivedLinks.length}
						<div class="list-block">
							{#each receivedLinks as mail}
								<button class="list-row clickable" type="button" onclick={() => handleOpenEmail(mail.id)}>
									<div>
										<strong>{mail.subject || 'Untitled message'}</strong>
										<p>{mail.senderEmail}</p>
									</div>
									<span>{mail.attachmentsCounter} attachments</span>
								</button>
							{/each}
						</div>
						{#if openMessageId && receivedDetailsById[openMessageId]}
							<article class="mail-preview">
								<h4>{receivedDetailsById[openMessageId].subject}</h4>
								<p class="muted">From {receivedDetailsById[openMessageId].senderEmail}</p>
								<pre>{receivedDetailsById[openMessageId].bodyPlain || 'No plain-text body available.'}</pre>
							</article>
						{/if}
					{:else}
						<p class="muted">Load recent messages for this proxy email.</p>
					{/if}
				</section>
			</div>
		</div>
	</details>
</div>

<style>
	.binding-row {
		border: 1px solid var(--panel-border);
		border-radius: 18px;
		background: var(--panel);
		box-shadow: var(--shadow);
	}

	.binding-details {
		overflow: hidden;
	}

	.binding-summary-row {
		display: grid;
		grid-template-columns: minmax(0, 1.7fr) auto auto auto;
		gap: 1rem;
		align-items: center;
		padding: 0.9rem 1rem;
		cursor: pointer;
		list-style: none;
	}

	.binding-summary-row::-webkit-details-marker {
		display: none;
	}

	.binding-identity {
		min-width: 0;
		display: grid;
		gap: 0.2rem;
	}

	.binding-identity h2 {
		margin: 0;
		font-size: 1rem;
		line-height: 1.15;
		word-break: break-word;
	}

	.binding-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1.25rem;
	}

	.binding-grid-secondary {
		align-items: start;
	}

	.binding-subline {
		font-size: 0.88rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.binding-row-stats {
		display: grid;
		grid-template-columns: repeat(3, auto);
		gap: 0.9rem;
		font-size: 0.82rem;
		color: var(--muted);
	}

	.binding-row-stats strong {
		color: var(--text);
	}

	.binding-row-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
	}

	.binding-row-toggle {
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--accent);
		white-space: nowrap;
	}

	.binding-details[open] .binding-row-toggle {
		color: var(--accent-strong);
	}

	.binding-details-body {
		display: grid;
		gap: 1.25rem;
		padding: 0 1rem 1rem;
		border-top: 1px solid var(--panel-border);
	}

	.detail-section {
		padding: 0.95rem;
		border: 1px solid var(--panel-border);
		border-radius: 16px;
		background: rgba(255, 255, 255, 0.55);
	}

	.chip-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		background: var(--panel-strong);
	}

	.chip-toggle strong {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
	}

	.inline-form.grow {
		grid-template-columns: 1.2fr 1fr auto;
	}

	.list-block {
		display: grid;
		gap: 0.7rem;
	}

	.list-row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: center;
		padding: 0.9rem 1rem;
		border: 1px solid var(--panel-border);
		border-radius: 16px;
		background: rgba(255, 255, 255, 0.75);
	}

	.list-row p,
	.list-row strong,
	.mail-preview h4,
	.mail-preview p {
		margin: 0;
	}

	.list-row code {
		font-size: 0.82rem;
		word-break: break-all;
	}

	.clickable {
		width: 100%;
		text-align: left;
		background: rgba(255, 255, 255, 0.75);
		border: 1px solid var(--panel-border);
	}

	.mail-preview {
		margin-top: 1rem;
		padding: 1rem;
		border-radius: 18px;
		background: rgba(14, 26, 36, 0.95);
		color: #f6f0e8;
	}

	.mail-preview pre {
		margin: 0.75rem 0 0;
		white-space: pre-wrap;
		font: inherit;
	}

	.actions {
		margin-top: 0.75rem;
	}

	.token-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin-bottom: 1rem;
	}

	@media (max-width: 900px) {
		.binding-summary-row,
		.binding-grid,
		.inline-form.grow {
			grid-template-columns: 1fr;
		}

		.binding-row-stats {
			grid-template-columns: repeat(3, minmax(0, auto));
		}
	}

	@media (max-width: 640px) {
		.binding-summary-row {
			padding: 0.85rem;
		}

		.binding-row-stats {
			grid-template-columns: 1fr;
			gap: 0.25rem;
		}

		.list-row {
			align-items: start;
			flex-direction: column;
		}
	}
</style>
