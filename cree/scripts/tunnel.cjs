#!/usr/bin/env node
const lt = require('localtunnel');

(async () => {
  const tunnel = await lt({ port: 8080 });
  console.log(tunnel.url);
  tunnel.on('close', () => process.exit(0));
})();