// A small static file server for app/ (Node 22, standard library only),
// so the guide can be tried in a browser without a build step:
//
//   node serve.ts                  → http://localhost:8080
//   node serve.ts --port 8093      → http://localhost:8093
//   node serve.ts --port 8093 --host 0.0.0.0
//
// It serves only files inside app/, answers GET and HEAD, sends the MIME
// types a browser needs, and never caches (so edits show on reload).
// A development convenience, not a server for the internet.

import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ROOT = resolve(fileURLToPath(new URL('./app', import.meta.url)));

const CONTENT_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.htm', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
  ['.woff2', 'font/woff2'],
  ['.webmanifest', 'application/manifest+json'],
]);

function flagValue(flag: string, fallback: string): string {
  const index = process.argv.indexOf(flag);
  return index === -1 || index + 1 >= process.argv.length ? fallback : process.argv[index + 1];
}

function pickPort(): number {
  const value = Number(flagValue('--port', '8080'));
  return Number.isInteger(value) && value > 0 && value < 65536 ? value : 8080;
}

function sendError(response: ServerResponse, status: number, message: string): void {
  response.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' }).end(message);
}

async function serveFile(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    sendError(response, 405, 'method not allowed');
    return;
  }
  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  } catch {
    sendError(response, 400, 'bad request');
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = resolve(join(APP_ROOT, pathname));
  if (file !== APP_ROOT && !file.startsWith(APP_ROOT + sep)) {
    sendError(response, 403, 'forbidden');
    return;
  }
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error('not a file');
    const body = await readFile(file);
    response.writeHead(200, {
      'content-type': CONTENT_TYPES.get(extname(file).toLowerCase()) ?? 'application/octet-stream',
      'content-length': body.length,
      'cache-control': 'no-store',
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    sendError(response, 404, 'not found');
  }
}

const port = pickPort();
const host = flagValue('--host', '127.0.0.1');
if (process.argv.includes('--help')) {
  console.log('Usage: node serve.ts [--port <n>] [--host <addr>]');
  process.exit(0);
}
createServer((request, response) => {
  serveFile(request, response).catch(() => sendError(response, 500, 'server error'));
}).listen(port, host, () => {
  console.log(`Leonida Trophy Guide: app/ is on http://${host}:${port}`);
});
