import type { SettingEntry } from '$lib/proxiedmail';

const LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!#$%&()*+,-./:<=>;?@[]^_{|}~';

export interface PasswordPreferences {
	passwordLength: number;
	useSymbols: boolean;
	useNumbers: boolean;
	useLetters: boolean;
}

export function getPasswordPreferences(settings: SettingEntry[]): PasswordPreferences {
	const map = new Map(settings.map((entry) => [entry.key, entry.value]));
	return {
		passwordLength: Number(map.get('password_length') ?? 16),
		useSymbols: map.get('use_symbols') !== 'false',
		useNumbers: map.get('use_numbers') !== 'false',
		useLetters: map.get('use_letters') !== 'false'
	};
}

export function generatePassword(preferences: PasswordPreferences): string {
	const pools = [
		preferences.useLetters ? LETTERS : '',
		preferences.useNumbers ? NUMBERS : '',
		preferences.useSymbols ? SYMBOLS : ''
	].filter(Boolean);

	if (!pools.length) {
		return '';
	}

	const universe = pools.join('');
	const characters: string[] = [];

	for (const pool of pools) {
		characters.push(pool[Math.floor(Math.random() * pool.length)]);
	}

	while (characters.length < preferences.passwordLength) {
		characters.push(universe[Math.floor(Math.random() * universe.length)]);
	}

	for (let index = characters.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1));
		const current = characters[index];
		characters[index] = characters[swapIndex];
		characters[swapIndex] = current;
	}

	return characters.join('').slice(0, preferences.passwordLength);
}
