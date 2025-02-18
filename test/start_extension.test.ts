/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import path from "path";
import puppeteer from "puppeteer";
import { Browser, Page, GoToOptions } from "puppeteer";
import { openDevToolsPanel } from "./util";

const POPUP_PAGE_FILENAME = "popup.html"; // Defined in manifest.json
const DEV_SERVER = "http://127.0.0.1:3000"; // Defined in test_server.js
const CHROME_TIMEOUT = 60_000; // 1 min
const TEST_TIMEOUT = 300_000; // 5 min
const PUPPETEER_NAVIGATION_OPTS: GoToOptions = {
  waitUntil: "networkidle0",
  timeout: CHROME_TIMEOUT,
};

let browser: Browser | undefined;
let page: Page | undefined;
let extensionId: string | undefined;

/**
 * Start the browser and load the extension.
 */
beforeEach(async () => {
  // Our extension is in the root folder.
  const extension = path.resolve(".");

  // Launch the browser and wait for it to boot.
  browser = await puppeteer.launch({
    args: [
      `--no-sandbox`,
      `--disable-setuid-sandbox`,
      `--disable-extensions-except=${extension}`,
      `--load-extension=${extension}`,
    ],
    devtools: true,
    headless: false,
  });
  [page] = await browser.pages();

  // Check to see whether the extension has loaded.
  const targets = await browser.targets();
  const extensionTarget = targets.find((target) =>
    target.url().startsWith("chrome-extension://"),
  );
  const extensionUrl = extensionTarget?.url();
  const regex = /^chrome-extension:\/\/([a-z]{32})\/.*$/;
  const match = extensionUrl?.match(regex);
  extensionId = match ? match[1] : undefined;
}, 10000);

/**
 * Stop the browser.
 */
afterEach(async () => {
  await browser?.close();
  browser = undefined;
});

// TODO(mayrarobles): Figure out what is a good alternative to this because this
// check isn't working.
xit(
  "Extension writes report-only Trusted Types headers",
  async () => {
    const response = await page?.goto(DEV_SERVER, PUPPETEER_NAVIGATION_OPTS);
    const headers = response?.headers();
    expect(headers).toBeTruthy();
    expect(headers!["content-security-policy-report-only"]).toContain(
      "require-trusted-types-for",
    );
  },
  TEST_TIMEOUT,
);

test(
  "Extension DevTools Panel loads properly",
  async () => {
    await page?.goto(DEV_SERVER, PUPPETEER_NAVIGATION_OPTS);

    // const panel = await getDevtoolsPanel(page, { panelName: 'index.html' });
    if (!browser || !extensionId) {
      fail("Did not initialize the browser and the extension properly.");
    }
    const panel = await openDevToolsPanel(browser, extensionId, (x) => fail(x));

    const panelDocument = await panel.evaluate(() => document.body.innerHTML);

    // Make sure we can interact with the panel Angular UI as well.
    const panelBody = await panel.$("body");
    await panelBody?.evaluate((e) => {
      const n = document.createElement("button");
      n.textContent = "MAGIC BUTTON";
      e.appendChild(n);
    });
    const panelBodyContent = await panelBody?.evaluate((e) => e.innerHTML);
    expect(panelBodyContent).toContain("MAGIC BUTTON");
  },
  TEST_TIMEOUT,
);

test(
  "Extension Dev Tools Panel shows Default Policy created messsage",
  async () => {
    await page?.goto(DEV_SERVER, PUPPETEER_NAVIGATION_OPTS);

    if (!browser || !extensionId) {
      fail("Did not initialize the browser and the extension properly.");
    }
    const panel = await openDevToolsPanel(browser, extensionId, (x) => fail(x));

    // Get the text of the message box (wait a little for Angular to execute).
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const element = await panel.$("simple-snack-bar");
    const elementText = await element?.evaluate((el) => el.textContent);

    expect(elementText).toContain("Trusted Types Default Policy was created.");
  },
  TEST_TIMEOUT,
);

test(
  "Extension Dev Tools Panel shows failed to overwrite extension's default policy message",
  async () => {
    const dev_server_with_defaultPolicy = DEV_SERVER.concat(
      "/?defaultPolicy=true",
    );
    page?.on("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page?.goto(dev_server_with_defaultPolicy, PUPPETEER_NAVIGATION_OPTS);

    if (!browser || !extensionId) {
      fail("Did not initialize the browser and the extension properly.");
    }
    const panel = await openDevToolsPanel(browser, extensionId, (x) => fail(x));

    // Get the text of the message box (wait a little for Angular to execute).
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const element = await panel.$("simple-snack-bar");
    const elementText = await element?.evaluate((el) => el.textContent);

    expect(elementText).toContain(
      "Failed to overwrite the extension's default policy.",
    );
  },
  TEST_TIMEOUT,
);

test(
  "Extension popup content loads properly",
  async () => {
    await page?.goto(DEV_SERVER, PUPPETEER_NAVIGATION_OPTS);
    const popup = await browser?.newPage();
    await popup?.goto(
      `chrome-extension://${extensionId}/${POPUP_PAGE_FILENAME}`,
    );
    const popupContent = await popup?.evaluate(() => document.body.innerHTML);
    expect(popupContent).toBeTruthy();
    expect(popupContent).toContain("Trusted Types Helper");
  },
  TEST_TIMEOUT,
);

test(
  "Extension Menu Interaction to clear violations",
  async () => {
    await page?.goto(DEV_SERVER, PUPPETEER_NAVIGATION_OPTS);

    if (!browser || !extensionId) {
      fail("Did not initialize the browser and the extension properly.");
    }
    // Try a hard refresh because when you load an extension for the first time
    // it doesn't set the Trusted Types headers properly sometimes.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await page?.reload(PUPPETEER_NAVIGATION_OPTS);

    // Try generating a violation to see whether it shows up in the UI.
    await page?.evaluate(() => {
      const n = document.createElement("div");
      n.innerHTML = "<h1>DOM INJECTION</h1>";
      document.body.appendChild(n);
    });

    const panel = await openDevToolsPanel(browser, extensionId, (x) => fail(x));

    // Wait for Angular to render (adjust timeout as needed)
    // (5 seconds is long enough for the default policy instantiated check
    // defined in the content.ts content script.)
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Check if the created violation exists
    const violation = await panel.$(".cluster-card");
    expect(violation).toBeTruthy();
    const violationData = await violation?.evaluate((el) => el.innerHTML);
    expect(violationData).toContain("DOM INJECTION");

    // Clearing the violations
    // 1. Click the menu button
    const menuButton = await panel.$(".open-menu-button");
    expect(menuButton).toBeTruthy();
    await menuButton?.click();

    // Wait for the menu to open (important!) - This is the most likely point of failure if the test is flaky
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 2. Click the "Clear violations" menu item
    const clearButton = await panel.$("button[mat-menu-item]:nth-child(2)");
    expect(clearButton).toBeTruthy();
    await clearButton?.click();

    // 3. Handle the dialog (you'll need to interact with the dialog if it appears)
    // If the dialog is a custom Angular Material Dialog, you'll need to find its elements and interact.
    // Example (adapt to your dialog's structure):
    const dialogTitle = await panel.waitForSelector("h2[mat-dialog-title]"); // Wait for the dialog title to appear
    expect(dialogTitle).toBeTruthy(); // Verify that the dialog opens
    const clearInDialogButton = await panel.$("button[cdkFocusInitial]"); // The "Clear" button in your dialog
    expect(clearInDialogButton).toBeTruthy();
    await clearInDialogButton?.click();

    // You might need to wait for a snackbar or other UI feedback
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 4. Assertions (e.g., check for snackbar message, changes in UI, etc.)
    const snackBar = await panel.$("simple-snack-bar");
    expect(snackBar).toBeTruthy();
    const snackBarText = await snackBar?.evaluate((el) => el.textContent);
    expect(snackBarText).toContain("Violations cleared!");
    const violationCard = await panel.$(".cluster-card");
    expect(violationCard).not.toBeTruthy();
  },
  TEST_TIMEOUT,
);
