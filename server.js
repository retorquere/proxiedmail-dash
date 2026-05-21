import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const ROOT_DIR = dirname(fileURLToPath(import.meta.url));
const BUILD_DIR = join(ROOT_DIR, 'build');
const TARGET_ORIGIN = 'https://proxiedmail.com';
const PROXY_PREFIXES = ['/api/v1/', '/gapi/'];
const FALLBACK_FILE = join(BUILD_DIR, '200.html');
const INDEX_FILE = join(BUILD_DIR, 'index.html');

const MIME_TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'application/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.ico': 'image/x-icon',
	'.txt': 'text/plain; charset=utf-8',
	'.webmanifest': 'application/manifest+json; charset=utf-8',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2'
};

function shouldProxy(pathname) {
	return PROXY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function getContentType(filePath) {
	return MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function collectRequestBody(request) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		request.on('data', (chunk) => chunks.push(chunk));
		request.on('end', () => resolve(Buffer.concat(chunks)));
		request.on('error', reject);
	});
}

function filterProxyRequestHeaders(headers) {
	const outgoing = new Headers();

	for (const [key, value] of Object.entries(headers)) {
		if (value === undefined) {
			continue;
		}

		const lower = key.toLowerCase();
		if (['host', 'connection', 'content-length'].includes(lower)) {
			continue;
		}

		if (Array.isArray(value)) {
			outgoing.set(key, value.join(', '));
		} else {
			outgoing.set(key, value);
		}
	}

	outgoing.set('host', 'proxiedmail.com');
	return outgoing;
}

function filterProxyResponseHeaders(headers) {
	const outgoing = {};

	for (const [key, value] of headers.entries()) {
		if (['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
			continue;
		}

		outgoing[key] = value;
	}

	return outgoing;
}

async function handleProxy(request, response, url) {
	const body = ['GET', 'HEAD'].includes(request.method || 'GET') ? undefined : await collectRequestBody(request);
	const upstream = await fetch(`${TARGET_ORIGIN}${url.pathname}${url.search}`, {
		method: request.method,
		headers: filterProxyRequestHeaders(request.headers),
		body
	});

	response.writeHead(upstream.status, filterProxyResponseHeaders(upstream.headers));

	if (!upstream.body || request.method === 'HEAD') {
		response.end();
		return;
	}

	await pipeline(upstream.body, response);
}

async function resolveStaticFile(pathname) {
	const cleanedPath = pathname === '/' ? '/index.html' : pathname;
	const resolvedPath = normalize(cleanedPath).replace(/^([.][.][/\\])+/, '');
	const candidate = join(BUILD_DIR, resolvedPath);

	if (!candidate.startsWith(BUILD_DIR)) {
		return null;
	}

	try {
		const fileStat = await stat(candidate);
		if (fileStat.isFile()) {
			return candidate;
		}
	} catch {
		return null;
	}

	return null;
}

async function handleStatic(response, url) {
	let filePath = await resolveStaticFile(url.pathname);

	if (!filePath) {
		filePath = existsSync(FALLBACK_FILE) ? FALLBACK_FILE : INDEX_FILE;
	}

	response.writeHead(200, { 'content-type': getContentType(filePath) });
	await pipeline(createReadStream(filePath), response);
}

const server = createServer(async (request, response) => {
	try {
		const url = new URL(request.url || '/', `http://${request.headers.host || `${HOST}:${PORT}`}`);

		if (shouldProxy(url.pathname)) {
			await handleProxy(request, response, url);
			return;
		}

		await handleStatic(response, url);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown server error';
		if (response.headersSent || response.writableEnded) {
			response.destroy();
			return;
		}

		response.writeHead(502, { 'content-type': 'application/json; charset=utf-8' });
		response.end(JSON.stringify({ error: message }));
	}
});

server.listen(PORT, HOST, () => {
	console.log(`ProxiedMail PWA server listening on http://${HOST}:${PORT}`);
	console.log(`Proxying ${PROXY_PREFIXES.join(', ')} to ${TARGET_ORIGIN}`);
});
