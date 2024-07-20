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
import { Violations } from '../common/common';
import { TrustedTypesWindow } from 'trusted-types/lib';

// Let's make sure that the common types import properly.
// TODO(mayrarobles): Remove this and use more useful things from '../common/common' to make this code more robust.
const violations : Violations = new Violations();
console.log(JSON.stringify(violations));

// Alert when there is an error in case the user already has a default policy,
// the extension policy may be set first and when the user's default policy
// is set an error occurs.
addEventListener("error", (event) => {
  if (event.error.name == 'TypeError' && event.error.message.includes('Policy with name "default" already exists')) {
    const msg = {
      type: 'defaulPolicyOverwriteFailed',
      defaulPolicyOverwriteFailed: Date.now()
    }
    window.postMessage(msg, '*');
    alert("Failed to overwrite the default policy set by the Trusted Types Helper extension.");
  }
});

try {
  const tt = (self as unknown as TrustedTypesWindow).trustedTypes;
  if (!tt) {
    throw new Error("Browser does not support Trusted Types");
  }
  tt.createPolicy('default', {
    createHTML: string => {
      //TODO implement default policy processing/sanitizing
      console.log(string);

      const htmlViolation = { type: 'HTML',
                               data : string,
                               timestamp: Date.now()
                            };
      const msg = {
        type: 'violation',
        violation: htmlViolation
      };

      window.postMessage(msg, '*');
      return string;
    }
  });
} catch(error) {
  // Although JavaScript allows you to throw any value (including not Error's), in the try-statement
  // above, we either only fail a system call to trustedTypes.createPolicy (generating an Error) or
  // manually throw an Error in case self.trustedTypes is not available.
  if (error instanceof Error) {
    console.error('Trusted Types Default Policy Creation Failed:', error.message);
    const msg = {
      type: 'defaultPolicyCreationFailed',
      defaultPolicyCreationFailed: Date.now()
    }
    window.postMessage(msg, '*');
  }
}

// When page reloads, these lines will get executed
const msg = {
  type: 'defaultPolicySet',
  defaultPolicySet: Date.now()
}
window.postMessage(msg, '*');
