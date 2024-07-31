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

/**
 * @fileoverview Content Script to load before any of the JS on the page in order to inject a default Trusted Types policy to introspect all DOM Sink values.
 */

/// <reference types="chrome"/>
/// <reference types="trusted-types" />
import {
  Message,
  ViolationType,
  createDefaultPolicyWarning,
  createViolationData,
} from "../common/common";
import { TrustedTypesWindow } from "trusted-types/lib";

// Alert when there is an error in case the user already has a default policy,
// the extension policy may be set first and when the user's default policy
// is set an error occurs.
addEventListener("error", (event) => {
  if (
    event.error.name == "TypeError" &&
    event.error.message.includes('Policy with name "default" already exists')
  ) {
    const msg = {
      type: "defaultPolicyWarning",
      defaultPolicyWarning: createDefaultPolicyWarning(
        "Failed to overwrite the extension's default policy.",
        false,
      ),
    };
    window.postMessage(msg, "*");
    alert(
      "Failed to overwrite the default policy set by the Trusted Types Helper extension.",
    );
  }
});

function getStackTrace(): string | undefined {
  var err = new Error();
  return err.stack;
}

try {
  const tt = (self as unknown as TrustedTypesWindow).trustedTypes;
  if (!tt) {
    throw new Error("Browser does not support Trusted Types");
  }

  tt.createPolicy("default", {
    createHTML: (string) => {
      window.postMessage(createMessage(string, "HTML"), "*");
      return string;
    },

    createScript: (string) => {
      window.postMessage(createMessage(string, "Script"), "*");
      return string;
    },

    createScriptURL: (string) => {
      window.postMessage(createMessage(string, "URL"), "*");
      return string;
    },
  });
} catch (error) {
  // Although JavaScript allows you to throw any value (including not Error's), in the try-statement
  // above, we either only fail a system call to trustedTypes.createPolicy (generating an Error) or
  // manually throw an Error in case self.trustedTypes is not available.
  if (error instanceof Error) {
    console.error(
      "Trusted Types Default Policy Creation Failed:",
      error.message,
    );
    const msg = {
      type: "defaultPolicyWarning",
      defaultPolicyWarning: createDefaultPolicyWarning(
        "Trusted Types Default Policy creation failed.",
        false,
      ),
    };
    window.postMessage(msg, "*");
  }
}

// When page reloads, these lines will get executed
const msg = {
  type: "defaultPolicyWarning",
  defaultPolicyWarning: createDefaultPolicyWarning(
    "Trusted Types Default Policy was created.",
    true,
  ),
};
window.postMessage(msg, "*");

/**
 * Creates a Message object representing a violation.
 *
 * This function takes a violation string and type as input,
 * generates a stack trace, and constructs a Violation object.
 *
 * @param string - The violation message string.
 * @param type - The type of violation.
 * @returns A Message object containing the violation details.
 */
function createMessage(string: string, type: ViolationType): Message {
  const stack = getStackTrace();

  if (!stack) {
    // Todo: Make sure to surface this error in the ui
    const msg: Message = {
      type: "violationFound",
      violation: {
        data: string,
        type: type,
        error: true,
      },
    };

    return msg;
  }

  const msg: Message = {
    type: "violationFound",
    violation: createViolationData(
      string,
      type,
      Date.now(),
      stack,
      window.document.URL,
    ),
  };

  return msg;
}
