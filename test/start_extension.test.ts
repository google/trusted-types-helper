import path from 'path';
import puppeteer from 'puppeteer';
import { Browser, Page, GoToOptions } from 'puppeteer';
import { openDevToolsPanel } from './util';

const POPUP_PAGE_FILENAME = 'hello.html'; // Defined in manifest.json
const DEV_SERVER = 'http://127.0.0.1:3000'; // Defined in test_server.js
const CHROME_TIMEOUT = 60_000; // 1 min
const TEST_TIMEOUT = 300_000; // 5 min
const PUPPETEER_NAVIGATION_OPTS: GoToOptions = { waitUntil: 'networkidle0', timeout: CHROME_TIMEOUT };

let browser: Browser | undefined;
let page: Page | undefined;
let extensionId: string | undefined;

/**
 * Start the browser and load the extension.
 */
beforeEach(async () => {
  // Our extension is in the root folder.
  const extension = path.resolve('.');

  // Launch the browser and wait for it to boot.
  browser = await puppeteer.launch({
    args: [
      `--disable-extensions-except=${extension}`,
      `--load-extension=${extension}`
    ],
    devtools: true,
    headless: false
  });
  [page] = await browser.pages();

  // Check to see whether the extension has loaded.
  const targets = await browser.targets();
  const extensionTarget = targets.find(target =>
    target.url().startsWith('chrome-extension://'));
  const extensionUrl = extensionTarget?.url();
  const regex = /^chrome-extension:\/\/([a-z]{32})\/.*$/;
  const match = extensionUrl?.match(regex);
  extensionId = match ? match[1] : undefined;
});

/**
 * Stop the browser.
 */
afterEach(async () => {
  await browser?.close();
  browser = undefined;
});

test('Extension writes report-only Trusted Types headers', async () => {
  const response = await page?.goto(DEV_SERVER, PUPPETEER_NAVIGATION_OPTS);
  const headers = response?.headers();
  expect(headers).toBeTruthy();
  expect(headers!['content-security-policy-report-only']).toContain('require-trusted-types-for');
}, TEST_TIMEOUT);

test('Extension DevTools Panel loads properly', async () => {
  await page?.goto(DEV_SERVER, PUPPETEER_NAVIGATION_OPTS);

  // const panel = await getDevtoolsPanel(page, { panelName: 'index.html' });
  if (!browser || !extensionId) {
    fail('Did not initialize the browser and the extension properly.');
  }
  const panel = await openDevToolsPanel(browser, extensionId, x => fail(x));

  const panelDocument = await panel.evaluate(() => document.body.innerHTML);
  expect(panelDocument).toContain("trusted-types-helper-ui");

  // Make sure we can interact with the panel Angular UI as well.
  const panelBody = await panel.$("body");
  await panelBody?.evaluate(e => {
    const n = document.createElement('button');
    n.textContent = "MAGIC BUTTON";
    e.appendChild(n);
  });
  const panelBodyContent = await panelBody?.evaluate(e => e.innerHTML);
  expect(panelBodyContent).toContain("MAGIC BUTTON");
}, TEST_TIMEOUT);

test('Extension popup content loads properly', async () => {
  await page?.goto(DEV_SERVER, PUPPETEER_NAVIGATION_OPTS);
  const popup = await browser?.newPage();
  await popup?.goto(`chrome-extension://${extensionId}/${POPUP_PAGE_FILENAME}`)
  const popupContent = await popup?.evaluate(() => document.body.innerHTML);
  expect(popupContent).toBeTruthy();
  expect(popupContent).toContain('Trusted Types Helper');
}, TEST_TIMEOUT);

