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

self.addEventListener("message", (msg) => {
  console.log("This is from listen: " + JSON.stringify(msg));
  chrome.runtime.sendMessage(msg.data);
});

chrome.runtime.onMessage.addListener((msg: Message, sender, sendResponse) => {
  console.log("msg from service worker in listen.ts: " + msg);
  if (msg.type === "getSanitizedInput") {
    console.log("received message from service worker to sanitize");
    const res = sanitizeWithDOMPurify(msg.sanitized);
    sendResponse(res);
  }
});
