export interface SessionConfig {
	baseUrl: string;
	username: string;
	oauthToken: string;
	apiToken: string;
	guestId: string;
}

export interface DashboardQuota {
	usedProxyBindings: number;
	availableProxyBindings: number;
	isVerificationEmailSend: boolean;
}

export interface RealAddressState {
	email: string;
	isEnabled: boolean;
	isVerified: boolean;
	isVerificationNeeded: boolean;
}

export interface ProxyBinding {
	id: string;
	proxyAddress: string;
	description: string;
	callbackUrl: string;
	isBrowsable: boolean;
	receivedEmails: number;
	wildcardAutoCreate: boolean;
	wildcardAutoCreateOn: boolean;
	createdAt: string;
	updatedAt: string;
	realAddresses: RealAddressState[];
}

export interface UserProfile {
	id: string;
	username: string;
	email: string;
	isPaid: boolean;
	twoFactorEnabled: boolean;
}

export interface AvailableDomain {
	domain: string;
	displayName: string;
	isPremium: boolean;
	isShared: boolean;
}

export interface CustomDomain {
	id: string;
	domain: string;
	displayName: string;
	status: number;
	isShared: boolean;
	isPremium: boolean;
}

export interface UsedOnEntry {
	proxyBindingId: string;
	list: string[];
}

export interface PasswordEntry {
	relatedToId: string;
	password: string;
}

export interface RealEmailEntry {
	email: string;
	isVerified: boolean;
	isDefault: boolean;
}

export interface ProductTip {
	title: string;
	content: string;
	img: string | null;
	cta: string | null;
}

export interface ReverseLookupResult {
	proxyAddress: string;
	sendFrom: string;
}

export interface ProxyContact {
	id: string;
	recipientEmail: string;
	reverseProxyAddress: string;
	description: string;
	status: number;
}

export interface ReceivedEmailLink {
	id: string;
	recipientEmail: string;
	senderEmail: string;
	subject: string;
	attachmentsCounter: number;
	link: string;
	isProcessed: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface ReceivedEmailDetails {
	id: string;
	recipientEmail: string;
	senderEmail: string;
	subject: string;
	bodyHtml: string;
	bodyPlain: string;
	attachments: { url: string }[];
	isProcessed: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface SettingEntry {
	key: string;
	value: string;
}

export interface GoogleTwoFactorSetup {
	qrUrl: string;
	secret: string;
}

export interface TwoFactorConfirmation {
	codes: string[];
}

export interface CallbackRegistration {
	status: string;
	callUrl: string;
	getUrl: string;
	id: string;
}

export interface CallbackPayload {
	status: string;
	payload: unknown;
	code: string;
	isReceived: boolean;
	method: string | null;
}

export interface DashboardSnapshot {
	user: UserProfile | null;
	quota: DashboardQuota;
	bindings: ProxyBinding[];
	availableDomains: AvailableDomain[];
	customDomains: CustomDomain[];
	realEmails: RealEmailEntry[];
	verifiedEmails: string[];
	usedOn: UsedOnEntry[];
	passwords: PasswordEntry[];
	settings: SettingEntry[];
	productTip: ProductTip | null;
	microsoftDomainsEnabled: boolean;
	contactsByBinding: Record<string, ProxyContact[]>;
	receivedLinksByBinding: Record<string, ReceivedEmailLink[]>;
	receivedDetailsById: Record<string, ReceivedEmailDetails>;
}

export interface ProxyBindingCreateInput {
	proxyAddress: string;
	realAddresses: string[];
	isBrowsable: boolean;
	callbackUrl: string;
	wildcardAutoCreate: boolean;
}

export interface ProxyBindingUpdateInput {
	id: string;
	proxyAddress: string;
	description?: string;
	callbackUrl?: string;
	wildcardAutoCreate?: boolean;
	isBrowsable?: boolean;
	realAddresses?: Record<string, { isEnabled: boolean }>;
	newRealAddress?: string;
}

export interface ContactCreateInput {
	bindingId: string;
	recipientEmail: string;
	description: string;
}

export interface SettingsUpdateInput {
	passwordLength: number;
	useSymbols: boolean;
	useNumbers: boolean;
	useLetters: boolean;
}

interface RequestOptions {
	method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	body?: unknown;
	auth?: 'none' | 'api' | 'bearer';
}

function asRecord(value: unknown): Record<string, unknown> {
	return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): unknown[] {
	return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback = ''): string {
	return typeof value === 'string' ? value : fallback;
}

function asBoolean(value: unknown): boolean {
	if (value === true || value === 1) {
		return true;
	}

	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();
		return normalized === 'true' || normalized === '1';
	}

	return false;
}

function asNumber(value: unknown, fallback = 0): number {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}

	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) {
			return parsed;
		}
	}

	return fallback;
}

function isJsonContentType(contentType: string): boolean {
	const normalized = contentType.toLowerCase();
	return normalized.includes('application/json') || normalized.includes('+json');
}

function normalizeBaseUrl(baseUrl: string): string {
	return (baseUrl || '').replace(/\/+$/, '');
}

function extractErrorMessage(payload: unknown): string {
	if (typeof payload === 'string' && payload.trim()) {
		return payload;
	}

	for (const item of asArray(payload)) {
		if (typeof item === 'string' && item.trim()) {
			return item;
		}

		const itemRecord = asRecord(item);
		const itemMessage =
			asString(itemRecord.message) ||
			asString(itemRecord.detail) ||
			asString(asRecord(itemRecord.error).message) ||
			asString(asRecord(asRecord(itemRecord.data).attributes).message);

		if (itemMessage) {
			return itemMessage;
		}
	}

	for (const item of asArray(payload)) {
		const message = asString(asRecord(asRecord(asRecord(item).data).attributes).message);
		if (message) {
			return message;
		}
	}

	const record = asRecord(payload);
	const message =
		asString(record.message) ||
		asString(record.detail) ||
		asString(record.error_description) ||
		asString(record.error) ||
		asString(asRecord(asRecord(record.error).data).message) ||
		asString(asRecord(asRecord(record.error).attributes).message) ||
		asString(asRecord(asRecord(record.data).attributes).message);
	return message || 'Request could not be completed.';
}

function normalizeProxyBinding(item: unknown): ProxyBinding {
	const record = asRecord(item);
	const attributes = asRecord(record.attributes);
	const realAddresses = Object.entries(asRecord(attributes.real_addresses)).map(([email, state]) => {
		const stateRecord = asRecord(state);
		return {
			email,
			isEnabled: stateRecord.is_enabled !== false,
			isVerified: asBoolean(stateRecord.is_verified),
			isVerificationNeeded: asBoolean(stateRecord.is_verification_needed)
		};
	});

	return {
		id: asString(record.id),
		proxyAddress: asString(attributes.proxy_address),
		description: asString(attributes.description),
		callbackUrl: asString(attributes.callback_url),
		isBrowsable: asBoolean(attributes.is_browsable),
		receivedEmails: asNumber(attributes.received_emails),
		wildcardAutoCreate: asBoolean(attributes.wildcard_auto_create),
		wildcardAutoCreateOn: asBoolean(attributes.wildcard_auto_create_on),
		createdAt: asString(attributes.created_at),
		updatedAt: asString(attributes.updated_at),
		realAddresses
	};
}

function normalizeUserProfile(payload: unknown): UserProfile {
	const root = asRecord(payload);
	const data = asRecord(root.data);
	const attributes = asRecord(data.attributes);
	const plan = asRecord(asRecord(root.meta).plan);

	return {
		id: asString(data.id),
		username: asString(attributes.username),
		email: asString(attributes.email),
		isPaid: asBoolean(plan.isPaid),
		twoFactorEnabled: asBoolean(attributes['2fa_enabled'])
	};
}

function normalizeAvailableDomain(item: unknown): AvailableDomain {
	if (typeof item === 'string') {
		return {
			domain: item,
			displayName: item,
			isPremium: false,
			isShared: false
		};
	}

	const record = asRecord(item);
	return {
		domain: asString(record.domain),
		displayName: asString(record.display_name) || asString(record.domain),
		isPremium: asBoolean(record.isPremium),
		isShared: asBoolean(record.isShared)
	};
}

function normalizeCustomDomain(item: unknown): CustomDomain {
	const record = asRecord(item);
	return {
		id: asString(record.id),
		domain: asString(record.domain),
		displayName: asString(record.display_name) || asString(record.domain),
		status: asNumber(record.status),
		isShared: asBoolean(record.isShared),
		isPremium: asBoolean(record.isPremium)
	};
}

function normalizeUsedOnEntry(item: unknown): UsedOnEntry {
	const record = asRecord(item);
	return {
		proxyBindingId: asString(record.proxy_binding_id),
		list: asArray(record.list).map((entry) => asString(entry)).filter(Boolean)
	};
}

function normalizePasswordEntry(item: unknown): PasswordEntry {
	const record = asRecord(item);
	return {
		relatedToId: asString(record.related_to_id),
		password: asString(record.password)
	};
}

function normalizeRealEmail(item: unknown): RealEmailEntry {
	const record = asRecord(item);
	return {
		email: asString(record.email),
		isVerified: asBoolean(record.is_verified),
		isDefault: asBoolean(record.is_default)
	};
}

function normalizeProductTip(payload: unknown): ProductTip | null {
	const attributes = asRecord(asRecord(asRecord(payload).data).attributes);
	if (!Object.keys(attributes).length) {
		return null;
	}

	return {
		title: asString(attributes.title),
		content: asString(attributes.content),
		img: asString(attributes.img) || null,
		cta: asString(attributes.cta) || null
	};
}

function normalizeProxyContact(item: unknown): ProxyContact {
	const record = asRecord(item);
	const attributes = asRecord(record.attributes);
	return {
		id: asString(record.id),
		recipientEmail: asString(attributes.recipient_email),
		reverseProxyAddress: asString(attributes.reverse_proxy_address),
		description: asString(attributes.description),
		status: asNumber(attributes.status)
	};
}

function normalizeReceivedEmailLink(item: unknown): ReceivedEmailLink {
	const record = asRecord(item);
	const attributes = asRecord(record.attributes);
	return {
		id: asString(record.id),
		recipientEmail: asString(attributes.recipient_email),
		senderEmail: asString(attributes.sender_email),
		subject: asString(attributes.subject),
		attachmentsCounter: asNumber(attributes.attachmentsCounter),
		link: asString(attributes.link),
		isProcessed: asBoolean(attributes.is_processed),
		createdAt: asString(attributes.created_at),
		updatedAt: asString(attributes.updated_at)
	};
}

function normalizeReceivedEmailDetails(payload: unknown): ReceivedEmailDetails {
	const data = asRecord(asRecord(payload).data);
	const attributes = asRecord(data.attributes);
	const messagePayload = asRecord(attributes.payload);
	return {
		id: asString(data.id),
		recipientEmail: asString(attributes.recipient_email),
		senderEmail: asString(attributes.sender_email),
		subject: asString(messagePayload.Subject),
		bodyHtml: asString(messagePayload['body-html']),
		bodyPlain: asString(messagePayload['body-plain']),
		attachments: asArray(attributes.attachments).map((item) => ({ url: asString(asRecord(item).url) })).filter((item) => item.url),
		isProcessed: asBoolean(attributes.is_processed),
		createdAt: asString(attributes.created_at),
		updatedAt: asString(attributes.updated_at)
	};
}

export function createEmptyDashboard(): DashboardSnapshot {
	return {
		user: null,
		quota: {
			usedProxyBindings: 0,
			availableProxyBindings: 0,
			isVerificationEmailSend: false
		},
		bindings: [],
		availableDomains: [],
		customDomains: [],
		realEmails: [],
		verifiedEmails: [],
		usedOn: [],
		passwords: [],
		settings: [],
		productTip: null,
		microsoftDomainsEnabled: false,
		contactsByBinding: {},
		receivedLinksByBinding: {},
		receivedDetailsById: {}
	};
}

export function createProxiedMailClient(getSession: () => SessionConfig) {
	async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
		const session = getSession();
		const headers = new Headers({ Accept: 'application/json' });
		const method = options.method ?? 'GET';
		const baseUrl = normalizeBaseUrl(session.baseUrl);

		if (options.auth === 'api') {
			if (session.apiToken) {
				headers.set('Authorization', session.apiToken);
				headers.set('Token', session.apiToken);
			}
		}

		if (options.auth === 'bearer' && session.oauthToken) {
			const token = session.oauthToken.startsWith('Bearer ') ? session.oauthToken : `Bearer ${session.oauthToken}`;
			headers.set('Authorization', token);
		}

		if (options.body !== undefined) {
			headers.set('Content-Type', 'application/json');
		}

		const response = await fetch(`${baseUrl}${path}`, {
			method,
			headers,
			body: options.body === undefined ? undefined : JSON.stringify(options.body)
		});

		const contentType = response.headers.get('content-type') ?? '';
		const payload = isJsonContentType(contentType) ? await response.json() : await response.text();

		if (!response.ok) {
			const message = extractErrorMessage(payload);
			if (message !== 'Request could not be completed.') {
				throw new Error(message);
			}

			if (response.status === 401) {
				throw new Error('Unauthorized');
			}

			if (response.status === 403) {
				throw new Error('Forbidden');
			}

			if (response.status === 404) {
				throw new Error('Not found');
			}

			throw new Error(`Request failed with ${response.status}`);
		}

		return payload as T;
	}

	return {
		authenticate: async (username: string, password: string): Promise<string> => {
			const payload = await request<Record<string, unknown>>('/api/v1/auth', {
				method: 'POST',
				auth: 'none',
				body: {
					data: {
						type: 'auth-request',
						attributes: { username, password }
					}
				}
			});

			return asString(asRecord(asRecord(asRecord(payload).data).attributes).token);
		},
		fetchApiToken: async (): Promise<string> => {
			const payload = await request<Record<string, unknown>>('/api/v1/api-token', {
				auth: 'bearer'
			});

			const token =
				asString(payload.token) ||
				asString(asRecord(payload.data).token) ||
				asString(asRecord(asRecord(payload.data).attributes).token);

			if (!token) {
				throw new Error('Permanent API token was not returned by the server');
			}

			return token;
		},
		registerUser: async (username: string, password: string) => {
			return request<Record<string, unknown>>('/api/v1/users', {
				method: 'POST',
				auth: 'none',
				body: {
					data: {
						type: 'users',
						attributes: {
							username,
							password,
							keyLandingPage: '',
							v: 'pwa'
						}
					}
				}
			});
		},
		getUserProfile: async (): Promise<UserProfile> => {
			const payload = await request<Record<string, unknown>>('/api/v1/users/me', { auth: 'api' });
			return normalizeUserProfile(payload);
		},
		listProxyBindings: async (): Promise<{ quota: DashboardQuota; bindings: ProxyBinding[] }> => {
			const payload = await request<Record<string, unknown>>('/api/v1/proxy-bindings?sort=desc', { auth: 'api' });
			const meta = asRecord(payload.meta);
			return {
				quota: {
					usedProxyBindings: asNumber(meta.usedProxyBindings),
					availableProxyBindings: asNumber(meta.availableProxyBindings),
					isVerificationEmailSend: asBoolean(meta.isVerificationEmailSend)
				},
				bindings: asArray(payload.data).map(normalizeProxyBinding)
			};
		},
		createProxyBinding: async (input: ProxyBindingCreateInput): Promise<ProxyBinding> => {
			const payload = await request<Record<string, unknown>>('/api/v1/proxy-bindings', {
				method: 'POST',
				auth: 'api',
				body: {
					data: {
						type: 'proxy_bindings',
						attributes: {
							real_addresses: input.realAddresses,
							proxy_address: input.proxyAddress,
							is_browsable: input.isBrowsable,
							callback_url: input.callbackUrl || undefined,
							wildcard_auto_create: input.wildcardAutoCreate
						}
					}
				}
			});
			return normalizeProxyBinding(payload.data);
		},
		updateProxyBinding: async (input: ProxyBindingUpdateInput): Promise<ProxyBinding> => {
			const payload = await request<Record<string, unknown>>(`/api/v1/proxy-bindings/${input.id}`, {
				method: 'PATCH',
				auth: 'api',
				body: {
					data: {
						id: input.id,
						type: 'proxy_bindings',
						attributes: {
							proxy_address: input.proxyAddress,
							description: input.description,
							callback_url: input.callbackUrl,
							wildcard_auto_create: input.wildcardAutoCreate,
							is_browsable: input.isBrowsable,
							real_addresses: input.realAddresses,
							new_real_address: input.newRealAddress
						}
					}
				}
			});
			return normalizeProxyBinding(payload.data);
		},
		deleteProxyBinding: async (id: string): Promise<void> => {
			await request(`/api/v1/proxy-bindings/${id}`, { method: 'DELETE', auth: 'api' });
		},
		listAvailableDomains: async (): Promise<AvailableDomain[]> => {
			const payload = await request<unknown[]>('/gapi/available-domains', { auth: 'api' });
			return asArray(payload).map(normalizeAvailableDomain);
		},
		listCustomDomains: async (): Promise<CustomDomain[]> => {
			const payload = await request<unknown[]>('/gapi/custom-domains?ignoreProcessing=1', { auth: 'api' });
			return asArray(payload).map(normalizeCustomDomain);
		},
		listRealEmails: async (): Promise<RealEmailEntry[]> => {
			const payload = await request<Record<string, unknown>>('/gapi/real-emails', { auth: 'api' });
			return asArray(payload.data).map(normalizeRealEmail);
		},
		listVerifiedEmails: async (): Promise<string[]> => {
			const payload = await request<Record<string, unknown>>('/gapi/verified-emails-list', { auth: 'api' });
			return asArray(payload.List).map((entry) => asString(entry)).filter(Boolean);
		},
		listUsedOn: async (): Promise<UsedOnEntry[]> => {
			const payload = await request<unknown[]>('/gapi/used-on', { auth: 'api' });
			return asArray(payload).map(normalizeUsedOnEntry);
		},
		updateUsedOn: async (bindingId: string, list: string[]): Promise<void> => {
			await request('/gapi/used-on', {
				method: 'PATCH',
				auth: 'api',
				body: { proxy_binding_id: bindingId, list }
			});
		},
		listPasswords: async (): Promise<PasswordEntry[]> => {
			const payload = await request<unknown[]>('/gapi/passwords', { auth: 'api' });
			return asArray(payload).map(normalizePasswordEntry);
		},
		setPassword: async (bindingId: string, password: string): Promise<void> => {
			await request('/gapi/passwords/proxy-binding', {
				method: 'PATCH',
				auth: 'api',
				body: { proxy_binding_id: bindingId, password }
			});
		},
		listSettings: async (): Promise<SettingEntry[]> => {
			const payload = await request<unknown[]>('/gapi/settings', { auth: 'api' });
			return asArray(payload).map((entry) => {
				const record = asRecord(entry);
				return { key: asString(record.key), value: asString(record.value) };
			});
		},
		updateSettings: async (input: SettingsUpdateInput): Promise<void> => {
			await request('/gapi/settings/update', {
				method: 'PATCH',
				auth: 'api',
				body: {
					settings: [
						{ key: 'password_length', value: String(input.passwordLength) },
						{ key: 'use_symbols', value: String(input.useSymbols) },
						{ key: 'use_numbers', value: String(input.useNumbers) },
						{ key: 'use_letters', value: String(input.useLetters) }
					]
				}
			});
		},
		getProductTip: async (): Promise<ProductTip | null> => {
			const payload = await request<Record<string, unknown>>('/api/v1/product-tips', { auth: 'api' });
			return normalizeProductTip(payload);
		},
		getMicrosoftDomainsEnabled: async (): Promise<boolean> => {
			const payload = await request<Record<string, unknown>>('/api/v1/users/allow-microsoft-domains', { auth: 'api' });
			return asBoolean(payload.status);
		},
		replaceRealEmail: async (oldEmail: string, newEmail: string): Promise<void> => {
			await request('/api/v1/emails/replace', {
				method: 'POST',
				auth: 'api',
				body: {
					data: {
						type: 'replace-real-emails',
						attributes: { oldEmail, newEmail }
					}
				}
			});
		},
		resendConfirmation: async (email: string): Promise<void> => {
			await request('/api/v1/resend-confirmation', {
				method: 'POST',
				auth: 'api',
				body: {
					data: {
						type: 'confirmation',
						attributes: { email }
					}
				}
			});
		},
		reverseLookup: async (reverseAddress: string): Promise<ReverseLookupResult> => {
			const query = encodeURIComponent(reverseAddress);
			const payload = await request<Record<string, unknown>>(`/gapi/proxy-binding/reverse-lookup?reverseAddress=${query}`, { auth: 'api' });
			return {
				proxyAddress: asString(payload.proxy_address),
				sendFrom: asString(payload.send_from)
			};
		},
		listContacts: async (bindingId: string): Promise<ProxyContact[]> => {
			const payload = await request<Record<string, unknown>>(`/api/v1/proxy-bindings/${bindingId}/contacts`, { auth: 'api' });
			return asArray(payload.data).map(normalizeProxyContact);
		},
		createContact: async (input: ContactCreateInput): Promise<ProxyContact> => {
			const payload = await request<Record<string, unknown>>('/api/v1/contacts', {
				method: 'POST',
				auth: 'api',
				body: {
					data: {
						type: 'proxy_binding_contacts',
						attributes: {
							recipient_email: input.recipientEmail,
							description: input.description || undefined
						},
						relationships: {
							proxy_binding: {
								data: { type: 'proxy_bindings', id: input.bindingId }
							}
						}
					}
				}
			});
			return normalizeProxyContact(payload.data);
		},
		listReceivedEmails: async (bindingId: string): Promise<ReceivedEmailLink[]> => {
			const payload = await request<Record<string, unknown>>(`/api/v1/received-emails-links/${bindingId}`, { auth: 'api' });
			return asArray(payload.data).map(normalizeReceivedEmailLink);
		},
		getReceivedEmail: async (receivedEmailId: string): Promise<ReceivedEmailDetails> => {
			const payload = await request<Record<string, unknown>>(`/api/v1/received-emails/${receivedEmailId}`, { auth: 'api' });
			return normalizeReceivedEmailDetails(payload);
		},
		startSmsTwoFactor: async (phone: string): Promise<void> => {
			await request('/api/v1/2fa-sms', {
				method: 'POST',
				auth: 'api',
				body: {
					data: {
						type: 'users_2fa',
						attributes: { phone, type_2fa: 1 }
					}
				}
			});
		},
		confirmSmsTwoFactor: async (code: string): Promise<TwoFactorConfirmation> => {
			const payload = await request<Record<string, unknown>>('/api/v1/confirm-sms', {
				method: 'POST',
				auth: 'api',
				body: { data: { code } }
			});
			return {
				codes: asArray(asRecord(asRecord(payload.data).attributes).codes).map((item) => asString(item)).filter(Boolean)
			};
		},
		startGoogleTwoFactor: async (email: string): Promise<GoogleTwoFactorSetup> => {
			const payload = await request<Record<string, unknown>>('/api/v1/2fa-google', {
				method: 'POST',
				auth: 'api',
				body: {
					data: {
						type: 'users_2fa',
						attributes: { email, type_2fa: 2 }
					}
				}
			});
			return {
				qrUrl: asString(payload.qr_url),
				secret: asString(payload.secret)
			};
		},
		confirmGoogleTwoFactor: async (code: string): Promise<TwoFactorConfirmation> => {
			const payload = await request<Record<string, unknown>>('/api/v1/confirm-google', {
				method: 'POST',
				auth: 'api',
				body: { data: { code } }
			});
			return {
				codes: asArray(asRecord(asRecord(payload.data).attributes).codes).map((item) => asString(item)).filter(Boolean)
			};
		},
		removeTwoFactor: async (): Promise<void> => {
			await request('/api/v1/users/remove-2fa', { method: 'DELETE', auth: 'api' });
		},
		requestCallbackUrl: async (callbackUrl: string): Promise<CallbackRegistration> => {
			const payload = await request<Record<string, unknown>>('/api/v1/callback', {
				method: 'POST',
				auth: 'bearer',
				body: { callback_url: callbackUrl }
			});
			return {
				status: asString(payload.status),
				callUrl: asString(payload.call_url),
				getUrl: asString(payload.get_url),
				id: asString(payload.id)
			};
		},
		getCallbackPayload: async (hash: string): Promise<CallbackPayload> => {
			const payload = await request<Record<string, unknown>>(`/api/v1/callback/get/${hash}`, { auth: 'api' });
			return {
				status: asString(payload.status),
				payload: payload.payload,
				code: asString(payload.code),
				isReceived: asBoolean(payload.is_received),
				method: asString(payload.method) || null
			};
		},
		submitSupportRequest: async (name: string, email: string, message: string): Promise<void> => {
			await request('/api/v1/ask-form', {
				method: 'POST',
				auth: 'none',
				body: { name, email, message }
			});
		},
		trackEvent: async (event: string): Promise<void> => {
			await request('/api/v1/stat-events', {
				method: 'POST',
				auth: 'none',
				body: { event }
			});
		}
	};
}
