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

import { Browser, Frame } from 'puppeteer';

/** Making sure that export / import declarations work with ts-jest. */
export const x = 3;

/**
 * Turns out that https://www.npmjs.com/package/puppeteer-devtools does not work with modern Puppeteer so we have to reimplement a minimal version of it.
 * 
 * Inspired by the APIs used in https://github.com/dequelabs/puppeteer-devtools/blob/develop/src/index.ts implementation of `getDevToolsPanel`,
 * but simplified because we don't have to worry about older Chromium versions.
 * 
 * @param browser The browser instance from Puppeteer
 * @param extensionId The extension ID of the installed extension to construct extension page URLs
 * @param fail The function to end the test with a custom failure message, likely from Jest
 * @returns The frame that loaded the extension's DevTools UI
 */
export async function openDevToolsPanel(browser: Browser, extensionId: string, fail: Function): Promise<Frame> {
  // See if we can cycle through the DevTools panels.
  const devToolsTarget = await browser?.waitForTarget(target => {
    return target.url().startsWith('devtools://');
  });
  if (!devToolsTarget) {
    fail('Failed to open the DevTools.');
  }
  const devTools = await devToolsTarget.asPage();
  const extensionPanelView = await devTools.evaluate(`Object.keys(UI.panels).find(key => key.startsWith('chrome-extension://'))`);
  await devTools.evaluate(`UI && UI.viewManager ? UI.viewManager.showView('${extensionPanelView}') : InspectorFrontendAPI.showPanel('${extensionPanelView}')`);

  // Now try to grab the open extension panel.
  const panelTarget = await browser?.waitForTarget(target => {
    return target.url().startsWith(`chrome-extension://${extensionId}`) && target.url().endsWith('index.html');
  });
  if (!panelTarget) {
    fail('Failed to open the DevTools extension panel.');
  }
  const panelPage = await panelTarget.asPage();
  const panelFrames = await panelPage.frames();
  return panelFrames[0];
}