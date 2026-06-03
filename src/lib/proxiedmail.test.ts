import { describe, expect, it } from 'vitest';

import { createEmptyDashboard } from '$lib/proxiedmail';

describe('createEmptyDashboard', () => {
	it('returns the expected empty dashboard snapshot', () => {
		expect(createEmptyDashboard()).toEqual({
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
		});
	});

	it('returns a fresh object on each call', () => {
		const first = createEmptyDashboard();
		const second = createEmptyDashboard();

		first.bindings.push({
			id: 'binding-1',
			proxyAddress: 'demo@example.com',
			description: '',
			callbackUrl: '',
			isBrowsable: false,
			receivedEmails: 0,
			wildcardAutoCreate: false,
			wildcardAutoCreateOn: false,
			createdAt: '',
			updatedAt: '',
			realAddresses: []
		});

		expect(second.bindings).toEqual([]);
		expect(second.contactsByBinding).toEqual({});
	});
});