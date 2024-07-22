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
 * @fileoverview Description of this file.
 */

// Alert when there is an error in case the user already has a default policy,
// the extension policy may be set first and when the user's default policy
// is set an error occurs.
addEventListener("error", (event) => {
  if (event.error.name == 'TypeError' && event.error.message.includes('Policy with name "default" already exists')) {
    const msg = {
      type: 'defaulPolicyOverwriteFailed',
      defaulPolicyOverwriteFailed: Date.now()
    }
    debugger;
    window.postMessage(msg, '*');
    alert("Failed to overwrite the default policy set by the Trusted Types Helper extension.");
  }
});

try {
  self.trustedTypes.createPolicy('default', {
    createHTML: (string => {
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
    })
  });
} catch(error) {
  console.error('Trusted Types Default Policy Creation Failed:', error.message);
  const msg = {
    type: 'defaultPolicyCreationFailed',
    defaultPolicyCreationFailed: Date.now()
  }
  window.postMessage(msg, '*');
}


// When page reloads, these lines will get executed
const msg = {
  type: 'defaultPolicySet',
  defaultPolicySet: Date.now()
}
window.postMessage(msg, '*');
