// server.js — Production server for Ubuntu VPS + Nginx
'use strict';

const http = require('http');
const { parse } = require('url');

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const hostname = '0.0.0.0'; // Listen on all interfaces — required for Nginx proxy
const port = parseInt(process.env.PORT || '3000', 10);

async function start() {
  const { default: next } = await import('next');

  const app = next({
    dev: false,
    hostname,
    port,
    dir: process.cwd(),
  });

  const handle = app.getRequestHandler();
  await app.prepare();

  const server = http.createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Environment: ${process.env.NODE_ENV}`);
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err.message);
  console.error(err.stack);
  process.exit(1);
});
