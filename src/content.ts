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

/**
 * Checks whether the error from the ErrorEvent is one that is a failure to
 * write a default policy and then sends the appropriate events to the rest of
 * the extension and warns the user.
 *
 * @param error The error extracted from the error event
 * @returns Whether this was a default policy overwrite error
 */
function sendDefaultPolicyOverwriteErrorMessage(error: Error) {
  if (
    error.name == "TypeError" &&
    error.message.includes('Policy with name "default" already exists')
  ) {
    const msg: Message = {
      type: "defaultPolicyWarning",
      defaultPolicyWarning: createDefaultPolicyWarning(
        "Failed to overwrite the extension's default policy.",
        false,
      ),
    };
    window.postMessage(msg, "*");
    alert(
      "Failed to overwrite the default policy set by the Trusted Types Helper extension. This page not work as expected, so please turn off Trusted Types Helper and refresh the page.",
    );
    return true;
  }
  return false;
}

/**
 * Artifically creates an error object at this location in the code so that
 * we can get a stack trace of where we are in the JavaScript source.
 *
 * @returns An unformatted string of the stack trace where the error object is
 * created
 */
function getStackTrace(): string | undefined {
  var err = new Error();
  return err.stack;
}

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
      violationData: {
        data: string,
        type: type,
        error: true,
      },
    };

    return msg;
  }

  const msg: Message = {
    type: "violationFound",
    violationData: createViolationData(
      string,
      type,
      Date.now(),
      stack,
      window.document.URL,
    ),
  };

  return msg;
}

// Alert when there is an error in case the user already has a default policy,
//
// This runs in case the extension policy is set first and as a result the
// user's default policy fails to be created (since the extension created the
// default policy first.)
addEventListener("error", (event) => {
  sendDefaultPolicyOverwriteErrorMessage(event.error);
});

// Main logic for attempting to set a default policy to intercept Trusted Types
// violations on the page.
//
// Only run this after we have confirmed that the extension is configured to
// overwrite the default policy / Trusted Types on the page.
window.addEventListener("message", (event) => {
  const response = event.data;
  if (response && "onOffState" in response) {
    if (response.onOffState) {
      console.log(`Global switch state is: ${JSON.stringify(response)}`);
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

        const msg: Message = {
          type: "defaultPolicyWarning",
          defaultPolicyWarning: createDefaultPolicyWarning(
            "Trusted Types Default Policy was created.",
            true,
          ),
        };
        window.postMessage(msg, "*");
      } catch (error) {
        // Although JavaScript allows you to throw any value (including not Error's), in the try-statement
        // above, we either only fail a system call to trustedTypes.createPolicy (generating an Error) or
        // manually throw an Error in case self.trustedTypes is not available.
        if (
          error instanceof Error &&
          // Try to see whether this is a default policy overwrite error
          // and handle the generic error alerting if it's not an overwrite
          // error.
          !sendDefaultPolicyOverwriteErrorMessage(error)
        ) {
          console.error(
            "Trusted Types Default Policy Creation Failed:",
            error.message,
          );
          const msg: Message = {
            type: "defaultPolicyWarning",
            defaultPolicyWarning: createDefaultPolicyWarning(
              "Trusted Types Default Policy creation failed.",
              false,
            ),
          };
          window.postMessage(msg, "*");
        }
      }
    } else {
      console.log(
        `Not adding TT to this page because global state was ${JSON.stringify(response)}`,
      );
    }
  } else {
    console.log(`content.js ignoring message: ${JSON.stringify(response)}`);
  }
});

// The extension should start execution by asking for whether to try injecting
// a default policy to intercept Trusted Types violations.
const onOffStateMsg: Message = { type: "getOnOffSwitchState" };
window.postMessage(onOffStateMsg, "*");
