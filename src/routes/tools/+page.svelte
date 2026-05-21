<script lang="ts">
	import type { CallbackPayload, CallbackRegistration, ReverseLookupResult } from '$lib/proxiedmail';
	import { workspace } from '$lib/workspace';

	let reverseAddress = $state('');
	let reverseResult = $state<ReverseLookupResult | null>(null);
	let callbackUrl = $state('');
	let callbackRegistration = $state<CallbackRegistration | null>(null);
	let callbackHash = $state('');
	let callbackPayload = $state<CallbackPayload | null>(null);
	let supportName = $state('');
	let supportEmail = $state('');
	let supportMessage = $state('');

	$effect(() => {
		if (!supportEmail && $workspace.dashboard.user?.email) {
			supportEmail = $workspace.dashboard.user.email;
		}
	});

	async function handleReverseLookup() {
		if (!reverseAddress.trim()) {
			return;
		}

		reverseResult = await workspace.reverseLookup(reverseAddress.trim());
	}

	async function handleCallbackCreate() {
		if (!callbackUrl.trim()) {
			return;
		}

		callbackRegistration = await workspace.requestCallbackUrl(callbackUrl.trim());
	}

	async function handleCallbackFetch() {
		if (!callbackHash.trim()) {
			return;
		}

		callbackPayload = await workspace.getCallbackPayload(callbackHash.trim());
	}

	async function handleSupportSubmit() {
		if (!supportName.trim() || !supportEmail.trim() || !supportMessage.trim()) {
			return;
		}

		await workspace.submitSupportRequest(supportName.trim(), supportEmail.trim(), supportMessage.trim());
		supportMessage = '';
	}

	async function copyToken() {
		if (!$workspace.session.apiToken || !navigator.clipboard) {
			return;
		}

		await navigator.clipboard.writeText($workspace.session.apiToken);
		workspace.clearMessages();
	}
</script>

<svelte:head>
	<title>Tools · ProxiedMail</title>
</svelte:head>

<div class="section-head">
	<div>
		<p class="eyebrow">Tools</p>
		<h1>Reverse lookup, callbacks, and support</h1>
		<p class="lead">Use these tools to inspect proxy routing, manage callback endpoints, and send support requests.</p>
	</div>
</div>

<div class="grid-2">
	<section class="panel">
		<p class="eyebrow">Reverse lookup</p>
		<h2>Resolve a reverse sender address</h2>
		<label class="field">
			<span>From or reply-to address</span>
			<input bind:value={reverseAddress} placeholder="noreply-service-123@pdxmail.com" />
		</label>
		<button class="button" type="button" onclick={handleReverseLookup}>Lookup proxy email</button>
		{#if reverseResult}
			<div class="soft-box result-box">
				<p><strong>Proxy address</strong></p>
				<code>{reverseResult.proxyAddress}</code>
				<p><strong>Sender</strong></p>
				<code>{reverseResult.sendFrom}</code>
			</div>
		{/if}
	</section>

	<section class="panel">
		<p class="eyebrow">API access</p>
		<h2>Session details</h2>
		<div class="soft-box result-box">
			<p><strong>Base URL</strong></p>
			<code>{$workspace.session.baseUrl}</code>
			<p><strong>API token</strong></p>
			<code>{$workspace.session.apiToken || 'Not connected'}</code>
		</div>
		<button class="button button-secondary" type="button" onclick={copyToken}>Copy token</button>
		<p class="muted">Use your current session token for API requests and callback setup.</p>
	</section>
</div>

<div class="grid-2">
	<section class="panel">
		<p class="eyebrow">Callbacks</p>
		<h2>Create and inspect callback endpoints</h2>
		<label class="field">
			<span>Callback URL</span>
			<input bind:value={callbackUrl} placeholder="https://hooks.example.com/inbound/proxiedmail" />
		</label>
		<button class="button" type="button" onclick={handleCallbackCreate}>Request callback</button>
		{#if callbackRegistration}
			<div class="soft-box result-box">
				<p><strong>Status</strong></p>
				<code>{callbackRegistration.status}</code>
				<p><strong>Call URL</strong></p>
				<code>{callbackRegistration.callUrl}</code>
				<p><strong>Lookup URL</strong></p>
				<code>{callbackRegistration.getUrl}</code>
			</div>
		{/if}
		<div class="divider"></div>
		<label class="field">
			<span>Callback hash</span>
			<input bind:value={callbackHash} placeholder="Paste callback hash" />
		</label>
		<button class="button button-secondary" type="button" onclick={handleCallbackFetch}>Fetch payload</button>
		{#if callbackPayload}
			<pre class="code-block">{JSON.stringify(callbackPayload, null, 2)}</pre>
		{/if}
	</section>

	<section class="panel">
		<p class="eyebrow">Support</p>
		<h2>Send a support request</h2>
		<label class="field">
			<span>Name</span>
			<input bind:value={supportName} placeholder="Your name" />
		</label>
		<label class="field">
			<span>Email</span>
			<input bind:value={supportEmail} placeholder="you@example.com" />
		</label>
		<label class="field">
			<span>Message</span>
			<textarea bind:value={supportMessage} rows="6" placeholder="What do you need help with?"></textarea>
		</label>
		<button class="button" type="button" onclick={handleSupportSubmit}>Send request</button>
	</section>
</div>
