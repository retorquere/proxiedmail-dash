import { browser } from '$app/environment';
import { get, writable } from 'svelte/store';
import {
	createEmptyDashboard,
	createProxiedMailClient,
	type CallbackPayload,
	type CallbackRegistration,
	type DashboardSnapshot,
	type GoogleTwoFactorSetup,
	type ProxyBinding,
	type ProxyBindingCreateInput,
	type ProxyBindingUpdateInput,
	type ReceivedEmailDetails,
	type ReverseLookupResult,
	type SessionConfig,
	type SettingsUpdateInput,
	type TwoFactorConfirmation
} from '$lib/proxiedmail';

const STORAGE_KEY = 'proxiedmail-workspace-session';

export interface WorkspaceState {
	session: SessionConfig;
	dashboard: DashboardSnapshot;
	loading: boolean;
	syncing: boolean;
	isAuthenticated: boolean;
	error: string | null;
	notice: string | null;
	selectedBindingId: string | null;
	googleSetup: GoogleTwoFactorSetup | null;
	recoveryCodes: string[];
	pendingTwoFactorMethod: 'sms' | 'google' | null;
}

function createGuestId(): string {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return crypto.randomUUID();
	}

	return `guest-${Date.now()}`;
}

function createSession(overrides: Partial<SessionConfig> = {}): SessionConfig {
	return {
		baseUrl: '',
		username: '',
		oauthToken: '',
		apiToken: '',
		guestId: createGuestId(),
		...overrides
	};
}

function readStoredSession(): SessionConfig {
	if (!browser) {
		return createSession();
	}

	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return createSession();
		}

		const parsed = JSON.parse(raw) as Partial<SessionConfig>;
		return createSession(parsed);
	} catch {
		return createSession();
	}
}

function writeStoredSession(session: SessionConfig) {
	if (!browser) {
		return;
	}

	localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function removeStoredSession() {
	if (!browser) {
		return;
	}

	localStorage.removeItem(STORAGE_KEY);
}

const initialState: WorkspaceState = {
	session: readStoredSession(),
	dashboard: createEmptyDashboard(),
	loading: false,
	syncing: false,
	isAuthenticated: false,
	error: null,
	notice: null,
	selectedBindingId: null,
	googleSetup: null,
	recoveryCodes: [],
	pendingTwoFactorMethod: null
};

const store = writable<WorkspaceState>(initialState);
const api = createProxiedMailClient(() => get(store).session);

function selectedBindingIdOrDefault(bindings: ProxyBinding[], current: string | null): string | null {
	if (current && bindings.some((binding) => binding.id === current)) {
		return current;
	}

	return bindings[0]?.id ?? null;
}

function patch(partial: Partial<WorkspaceState>) {
	store.update((state) => ({ ...state, ...partial }));
}

function setDashboard(dashboard: DashboardSnapshot) {
	store.update((state) => ({
		...state,
		dashboard,
		selectedBindingId: selectedBindingIdOrDefault(dashboard.bindings, state.selectedBindingId)
	}));
}

async function safe<T>(factory: () => Promise<T>, fallback: T): Promise<T> {
	try {
		return await factory();
	} catch {
		return fallback;
	}
}

async function refreshDashboard() {
	const state = get(store);
	if (!state.session.apiToken && !state.session.oauthToken) {
		setDashboard(createEmptyDashboard());
		patch({
			isAuthenticated: false,
			error: null,
			notice: null,
			loading: false,
			syncing: false
		});
		return;
	}

	patch({ syncing: true, loading: state.dashboard.bindings.length === 0, error: null, notice: null });

	try {
		const [user, proxyBundle, availableDomains, customDomains, realEmails, verifiedEmails, usedOn, passwords, settings, productTip, microsoftDomainsEnabled] =
			await Promise.all([
				safe(() => api.getUserProfile(), null),
				api.listProxyBindings(),
				safe(() => api.listAvailableDomains(), []),
				safe(() => api.listCustomDomains(), []),
				safe(() => api.listRealEmails(), []),
				safe(() => api.listVerifiedEmails(), []),
				safe(() => api.listUsedOn(), []),
				safe(() => api.listPasswords(), []),
				safe(() => api.listSettings(), []),
				safe(() => api.getProductTip(), null),
				safe(() => api.getMicrosoftDomainsEnabled(), false)
			]);

		const current = get(store).dashboard;
		setDashboard({
			...createEmptyDashboard(),
			user,
			quota: proxyBundle.quota,
			bindings: proxyBundle.bindings,
			availableDomains,
			customDomains,
			realEmails,
			verifiedEmails,
			usedOn,
			passwords,
			settings,
			productTip,
			microsoftDomainsEnabled,
			contactsByBinding: current.contactsByBinding,
			receivedLinksByBinding: current.receivedLinksByBinding,
			receivedDetailsById: current.receivedDetailsById
		});
		patch({
			loading: false,
			syncing: false,
			isAuthenticated: true,
			error: null,
			notice: 'Account data refreshed.'
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unable to load account data';
		patch({ loading: false, syncing: false, error: message });
	}
}

async function runTask<T>(task: () => Promise<T>, successNotice?: string): Promise<T> {
	patch({ syncing: true, error: null, notice: null });
	try {
		const result = await task();
		patch({ syncing: false, notice: successNotice ?? null });
		return result;
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Action failed';
		patch({ syncing: false, error: message });
		throw error;
	}
}

export const workspace = {
	subscribe: store.subscribe,
	bootstrap: async () => {
		const state = get(store);
		if (state.session.apiToken) {
			patch({ isAuthenticated: true, notice: 'Restoring your previous session…' });
			await refreshDashboard();
		}
	},
	clearMessages: () => patch({ error: null, notice: null }),
	selectBinding: (bindingId: string) => patch({ selectedBindingId: bindingId }),
	signIn: async (username: string, password: string) => {
		patch({ loading: true, error: null, notice: null });
		try {
			const session = createSession({ username });
			patch({ session });
			const oauthToken = await api.authenticate(username, password);
			const bearerToken = oauthToken.startsWith('Bearer ') ? oauthToken : `Bearer ${oauthToken}`;
			patch({ session: { ...get(store).session, oauthToken: bearerToken } });

			const apiToken = await safe(() => api.fetchApiToken(), '');

			const nextSession = { ...get(store).session, oauthToken: bearerToken, apiToken };
			writeStoredSession(nextSession);
			patch({ session: nextSession, isAuthenticated: true, loading: false });
			await refreshDashboard();
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Sign in failed';
			patch({ loading: false, isAuthenticated: false, error: message });
			throw error;
		}
	},
	registerUser: async (username: string, password: string) => {
		await runTask(() => api.registerUser(username, password), 'Account created. Sign in to load your proxies and settings.');
	},
	signOut: () => {
		removeStoredSession();
		store.set({
			...initialState,
			session: createSession(),
			dashboard: createEmptyDashboard(),
			notice: 'Signed out.'
		});
	},
	refresh: refreshDashboard,
	createProxyBinding: async (input: ProxyBindingCreateInput) => {
		const binding = await runTask(() => api.createProxyBinding(input), 'Proxy address created.');
		store.update((state) => ({
			...state,
			dashboard: {
				...state.dashboard,
				bindings: [binding, ...state.dashboard.bindings],
				quota: {
					...state.dashboard.quota,
					usedProxyBindings: state.dashboard.quota.usedProxyBindings + 1
				}
			},
			selectedBindingId: binding.id
		}));
	},
	saveProxyBinding: async (input: ProxyBindingUpdateInput) => {
		const binding = await runTask(() => api.updateProxyBinding(input), 'Proxy binding saved.');
		store.update((state) => ({
			...state,
			dashboard: {
				...state.dashboard,
				bindings: state.dashboard.bindings.map((entry) => (entry.id === binding.id ? binding : entry))
			}
		}));
	},
	deleteProxyBinding: async (id: string) => {
		await runTask(() => api.deleteProxyBinding(id), 'Proxy binding deleted.');
		store.update((state) => ({
			...state,
			dashboard: {
				...state.dashboard,
				bindings: state.dashboard.bindings.filter((binding) => binding.id !== id),
				quota: {
					...state.dashboard.quota,
					usedProxyBindings: Math.max(0, state.dashboard.quota.usedProxyBindings - 1)
				}
			},
			selectedBindingId: state.selectedBindingId === id ? null : state.selectedBindingId
		}));
	},
	savePassword: async (bindingId: string, password: string) => {
		await runTask(() => api.setPassword(bindingId, password), 'Password stored for the selected proxy.');
		store.update((state) => ({
			...state,
			dashboard: {
				...state.dashboard,
				passwords: [
					...state.dashboard.passwords.filter((entry) => entry.relatedToId !== bindingId),
					{ relatedToId: bindingId, password }
				]
			}
		}));
	},
	saveUsedOn: async (bindingId: string, list: string[]) => {
		await runTask(() => api.updateUsedOn(bindingId, list), 'Usage tags updated.');
		store.update((state) => ({
			...state,
			dashboard: {
				...state.dashboard,
				usedOn: [...state.dashboard.usedOn.filter((entry) => entry.proxyBindingId !== bindingId), { proxyBindingId: bindingId, list }]
			}
		}));
	},
	loadContacts: async (bindingId: string) => {
		const contacts = await runTask(() => api.listContacts(bindingId));
		store.update((state) => ({
			...state,
			dashboard: {
				...state.dashboard,
				contactsByBinding: { ...state.dashboard.contactsByBinding, [bindingId]: contacts }
			}
		}));
	},
	createContact: async (bindingId: string, recipientEmail: string, description: string) => {
		const contact = await runTask(
			() => api.createContact({ bindingId, recipientEmail, description }),
			'Contact created for the proxy binding.'
		);
		store.update((state) => ({
			...state,
			dashboard: {
				...state.dashboard,
				contactsByBinding: {
					...state.dashboard.contactsByBinding,
					[bindingId]: [...(state.dashboard.contactsByBinding[bindingId] ?? []), contact]
				}
			}
		}));
	},
	loadReceivedEmails: async (bindingId: string) => {
		const links = await runTask(() => api.listReceivedEmails(bindingId));
		store.update((state) => ({
			...state,
			dashboard: {
				...state.dashboard,
				receivedLinksByBinding: { ...state.dashboard.receivedLinksByBinding, [bindingId]: links }
			}
		}));
	},
	openReceivedEmail: async (receivedEmailId: string): Promise<ReceivedEmailDetails> => {
		const existing = get(store).dashboard.receivedDetailsById[receivedEmailId];
		if (existing) {
			return existing;
		}

		const details = await runTask(() => api.getReceivedEmail(receivedEmailId));
		store.update((state) => ({
			...state,
			dashboard: {
				...state.dashboard,
				receivedDetailsById: { ...state.dashboard.receivedDetailsById, [receivedEmailId]: details }
			}
		}));
		return details;
	},
	replaceRealEmail: async (oldEmail: string, newEmail: string) => {
		await runTask(() => api.replaceRealEmail(oldEmail, newEmail), 'Real email replaced.');
		await refreshDashboard();
	},
	resendConfirmation: async (email: string) => {
		await runTask(() => api.resendConfirmation(email), 'Confirmation email sent.');
	},
	saveSettings: async (input: SettingsUpdateInput) => {
		await runTask(() => api.updateSettings(input), 'Password generator settings saved.');
		store.update((state) => ({
			...state,
			dashboard: {
				...state.dashboard,
				settings: [
					{ key: 'password_length', value: String(input.passwordLength) },
					{ key: 'use_symbols', value: String(input.useSymbols) },
					{ key: 'use_numbers', value: String(input.useNumbers) },
					{ key: 'use_letters', value: String(input.useLetters) }
				]
			}
		}));
	},
	startSmsTwoFactor: async (phone: string) => {
		await runTask(() => api.startSmsTwoFactor(phone), 'SMS challenge sent. Enter the code to confirm setup.');
		patch({ pendingTwoFactorMethod: 'sms', recoveryCodes: [] });
	},
	confirmSmsTwoFactor: async (code: string): Promise<TwoFactorConfirmation> => {
		const result = await runTask(() => api.confirmSmsTwoFactor(code), 'SMS two-factor enabled.');
		patch({ recoveryCodes: result.codes, pendingTwoFactorMethod: null });
		await refreshDashboard();
		return result;
	},
	startGoogleTwoFactor: async (email: string) => {
		const setup = await runTask(() => api.startGoogleTwoFactor(email), 'Scan the QR code and enter the generated code to finish setup.');
		patch({ googleSetup: setup, pendingTwoFactorMethod: 'google', recoveryCodes: [] });
	},
	confirmGoogleTwoFactor: async (code: string): Promise<TwoFactorConfirmation> => {
		const result = await runTask(() => api.confirmGoogleTwoFactor(code), 'Authenticator-based two-factor enabled.');
		patch({ recoveryCodes: result.codes, pendingTwoFactorMethod: null, googleSetup: null });
		await refreshDashboard();
		return result;
	},
	removeTwoFactor: async () => {
		await runTask(() => api.removeTwoFactor(), 'Two-factor authentication removed.');
		patch({ googleSetup: null, recoveryCodes: [], pendingTwoFactorMethod: null });
		await refreshDashboard();
	},
	reverseLookup: (reverseAddress: string): Promise<ReverseLookupResult> => api.reverseLookup(reverseAddress),
	requestCallbackUrl: (callbackUrl: string): Promise<CallbackRegistration> => api.requestCallbackUrl(callbackUrl),
	getCallbackPayload: (hash: string): Promise<CallbackPayload> => api.getCallbackPayload(hash),
	submitSupportRequest: async (name: string, email: string, message: string) => {
		await runTask(() => api.submitSupportRequest(name, email, message), 'Support request sent.');
	},
	trackEvent: (event: string) => api.trackEvent(event)
};
