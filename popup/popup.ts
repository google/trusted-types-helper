/**
 * Copyright 2025 Google LLC
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

const onOffSwitchInput = document.getElementById(
  "onOffSwitch",
) as HTMLInputElement;
const onOffSwitch = document.getElementById("on-off");

// Only add interactivity if we know this element exists
if (onOffSwitchInput && onOffSwitch) {
  chrome.runtime.sendMessage({ type: "getOnOffSwitchState" }, (response) => {
    console.log(
      `Received current state of the toggle button: ${JSON.stringify(response)}`,
    );
    onOffSwitchInput.disabled = false;
    onOffSwitchInput.checked = response.onOffState;
  });

  onOffSwitch.addEventListener("click", () => {
    console.log("button clicked");
    const message = { type: "toggleOnOffSwitch" } as Message;
    chrome.runtime.sendMessage(message);
  });
}
