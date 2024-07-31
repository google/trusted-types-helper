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

/// <reference types="chrome"/>
import {
  Message,
  Violation,
  Violations,
  DefaultPolicyWarning,
  createDefaultPolicyWarning,
} from "../common/common";

import { parseStackTrace } from "../common/stack_trace";

const CSP_HEADER = "content-security-policy";
const CSP_HEADER_REPORT_ONLY = "Content-Security-Policy-Report-Only";
const TRUSTED_TYPES_DIRECTIVE = "require-trusted-types-for 'script'";

var defaultPolicyWarning: DefaultPolicyWarning = createDefaultPolicyWarning(
  "No warning yet.",
  false,
);
var violationsPerTab: Record<string, Violations> = {};

// Listens to the content script
chrome.runtime.onMessage.addListener((msg: any, sender, sendResponse) => {
  switch (msg.type) {
    case "violationFound":
      if (sender.tab && sender.tab.id) {
        const activeTabId = sender.tab.id;
        if (!(activeTabId in violationsPerTab)) {
          // Add an empty space in violationsPerTab for this tab id
          violationsPerTab[activeTabId] = new Violations();
        }
        // Create violation object
        var violation: Violation = new Violation(
          msg.data,
          msg.type,
          msg.timestamp,
          parseStackTrace(msg.unprocessedStackTrace),
          msg.documentUrl,
        );
        // Add a violation to the corresponding tab id
        violationsPerTab[activeTabId].addViolation(violation);
        // Store all violations for all tabs in local storage
        chrome.storage.local.set(violationsPerTab);
      }
      break;
    case "listViolations":
      if (msg.inspectedTabId) {
        chrome.storage.local.get(msg.inspectedTabId.toString(), (result) => {
          sendResponse(result[msg.inspectedTabId]);
        });
      }
      return true;
    case "defaultPolicyWarning":
      defaultPolicyWarning = msg.defaultPolicyWarning;
      break;
    case "getDefaultPolicyWarning":
      sendResponse(defaultPolicyWarning);
      break;
  }
});

if (chrome.webRequest !== undefined) {
  chrome.webRequest.onHeadersReceived.addListener(
    checkHeaderForTrustedTypes,
    { urls: ["<all_urls>"] },
    ["responseHeaders"],
  );
}

function checkHeaderForTrustedTypes(
  details: chrome.webRequest.WebResponseHeadersDetails,
): void {
  // Check if there is already a csp in a header with the trusted types directive
  if (details && details.responseHeaders) {
    if (
      !details.responseHeaders.some(
        (header: chrome.webRequest.HttpHeader) =>
          header.name == CSP_HEADER &&
          header.value &&
          header.value.includes(TRUSTED_TYPES_DIRECTIVE),
      )
    ) {
      console.log("Changed the headers!");
      chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [
          {
            id: 1,
            priority: 1,
            action: {
              type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
              responseHeaders: [
                {
                  header: CSP_HEADER_REPORT_ONLY,
                  operation:
                    chrome.declarativeNetRequest.HeaderOperation.APPEND,
                  value: TRUSTED_TYPES_DIRECTIVE + ";",
                },
              ],
            },
            condition: {
              resourceTypes: ["main_frame" as any],
            },
          },
        ],
        removeRuleIds: [1],
      });
    }
  }
}
