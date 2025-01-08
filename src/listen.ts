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

import { Message } from "../common/common";
import { sanitizeWithDOMPurify } from "./purify";

// Content script calls the service worker
self.addEventListener("message", (msg) => {
  if (!msg.data) {
    return;
  }
  console.log("listen.js -> SW: " + JSON.stringify(msg.data));
  chrome.runtime.sendMessage(msg.data, (res) => {
    // Response from the service worker should continue to the content script.
    if (res) {
      console.log(`SW -> listen.js: ${JSON.stringify(res)}`);
      self.postMessage(res, "*");
    }
  });
});

// Service Worker calls the content script
chrome.runtime.onMessage.addListener((msg: Message, _sender, sendResponse) => {
  console.log("msg from service worker in listen.ts: " + msg);
  // Pass along the service worker's initiated messages to the content script.
  self.postMessage(msg, "*");
  // Running sanitizers with the DOM environment is something that the service
  // worker has to ask the content script to do (because the service worker
  // does not have a DOM environment.)
  switch (msg.type) {
    case "getSanitizedInput":
      console.log("received message from service worker to sanitize");
      const res = sanitizeWithDOMPurify(msg.sanitized);
      sendResponse(res);
      break;
    default:
      return false;
  }
  return false;
});
