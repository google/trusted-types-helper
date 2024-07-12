/// <reference types="chrome"/>
import {DefaultPolicyData, Message, Violation, Violations} from "../common/common.js";

const CSP_HEADER = 'content-security-policy';
const CSP_HEADER_REPORT_ONLY = 'Content-Security-Policy-Report-Only';
const TRUSTED_TYPES_DIRECTIVE =  "require-trusted-types-for 'script'";

var violations : Violations= new Violations();
var defaultPolicyData: DefaultPolicyData = {};


// Listens to the content script
chrome.runtime.onMessage.addListener((msg: Message, sender, sendResponse) => {
  console.log(msg);
  console.log(sender.tab?.url);

  switch (msg.type) {
    case 'violation':
      if (msg.violation)  {
        violations[msg.violation.getType()].push(msg.violation);
      }
      break;
    case 'listViolations':
      sendResponse({ violations });
      break;
    case 'defaultPolicySet':
      defaultPolicyData.wasSet = msg.defaultPolicySet;
      break;
    case 'defaultPolicyCreationFailed':
      defaultPolicyData.creationFailed = msg.defaultPolicyCreationFailed;
      break;
    case 'getDefaultPolicyData':
      sendResponse(defaultPolicyData);
      break;
  }
});

if (chrome.webRequest !== undefined) {
  chrome.webRequest.onHeadersReceived.addListener(
    checkHeaderForTrustedTypes,
      ({urls: ['<all_urls>']}), ['responseHeaders']);
}

function checkHeaderForTrustedTypes(details: chrome.webRequest.WebResponseHeadersDetails): void {
  // Check if there is already a csp in a header with the trusted types directive
  if (details && details.responseHeaders) {
    if (!(details.responseHeaders.some( (header: chrome.webRequest.HttpHeader) => header.name == CSP_HEADER &&
      header.value && header.value.includes(TRUSTED_TYPES_DIRECTIVE)) )) {
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
                  operation: chrome.declarativeNetRequest.HeaderOperation.APPEND,
                  value: TRUSTED_TYPES_DIRECTIVE + ";",
                },
              ],
            },
            condition: {
              "resourceTypes": [
                "main_frame" as any
              ]
            },
          },
        ],
        removeRuleIds: [1],
      });
    }
  }
}

