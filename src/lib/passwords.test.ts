import { describe, expect, it } from 'vitest';

import { generatePassword, getPasswordPreferences } from '$lib/passwords';

describe('getPasswordPreferences', () => {
	it('uses defaults when settings are missing', () => {
		expect(getPasswordPreferences([])).toEqual({
			passwordLength: 16,
			useSymbols: true,
			useNumbers: true,
			useLetters: true
		});
	});
});

describe('generatePassword', () => {
	it('returns an empty string when all character pools are disabled', () => {
		expect(
			generatePassword({
				passwordLength: 16,
				useLetters: false,
				useNumbers: false,
				useSymbols: false
			})
		).toBe('');
	});

	it('includes at least one character from each enabled pool', () => {
		const password = generatePassword({
			passwordLength: 24,
			useLetters: true,
			useNumbers: true,
			useSymbols: true
		});

		expect(password).toHaveLength(24);
		expect(/[A-Za-z]/.test(password)).toBe(true);
		expect(/\d/.test(password)).toBe(true);
		expect(/[!#$%&()*+,.\-/:<=>;?@\[\]^_{|}~]/.test(password)).toBe(true);
	});
});