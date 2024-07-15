import { setup } from 'jest-dev-server';

module.exports = async function globalSetup() {
  globalThis.servers = await setup({
    command: `npm run test-page`,
    launchTimeout: 50000,
    port: 3000,
    debug: true,
  });
}