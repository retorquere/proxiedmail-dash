import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const username = process.env.E2E_USERNAME;
const password = process.env.E2E_PASSWORD;
const authDir = mkdtempSync(join(tmpdir(), 'proxiedmail-playwright-'));
const storageStatePath = join(authDir, 'storage-state.json');

test.describe.configure({ mode: 'serial' });

test.skip(!username || !password, 'E2E_USERNAME and E2E_PASSWORD are required for authenticated tests.');

async function signIn(page: Page) {
	await page.goto('/');
	await page.getByLabel('Email or username').fill(username ?? '');
	await page.getByLabel('Password').fill(password ?? '');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible({ timeout: 20000 });
}

test('signs in and shows authenticated navigation', async ({ page }) => {
	await signIn(page);
	const primaryNav = page.getByRole('navigation', { name: 'Primary' });

	await expect(primaryNav.getByRole('link', { name: 'Proxies' })).toBeVisible();
	await expect(primaryNav.getByRole('link', { name: 'Addresses' })).toBeVisible();
	await expect(primaryNav.getByRole('link', { name: 'Tools' })).toBeVisible();
	await expect(primaryNav.getByRole('link', { name: 'Security' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Overview', level: 1 })).toBeVisible();
	await expect(page.getByText(/Quota:/)).toBeVisible();
	await page.context().storageState({ path: storageStatePath });
});

test('restores the session on a protected route and allows sign-out', async ({ browser }) => {
	const context = await browser.newContext({ storageState: storageStatePath });
	const page = await context.newPage();
	await page.goto('/workspace');

	await expect(page.getByRole('heading', { name: 'Proxy emails', level: 1 })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();

	await page.reload();
	await expect(page.getByRole('heading', { name: 'Proxy emails', level: 1 })).toBeVisible();

	await page.getByRole('button', { name: 'Sign out' }).click();
	await expect(page.getByRole('heading', { name: 'Sign in', level: 2 })).toBeVisible();
	await page.goto('/workspace');
	await expect(page.getByText('Sign in required')).toBeVisible();
	await context.close();
});