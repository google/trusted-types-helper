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
// import {chrome} from '@types/chrome';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DefaultPolicyData, Message, Violations, ViolationType, Violation, ViolationDataType } from "../../../common/common";
import { NgClass, NgFor } from '@angular/common';

const VIOLATION_TYPES_NAMES = ['HTML', 'Script', 'URL'];
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgClass, NgFor],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'trusted-types-helper-ui';
  message = 'No message yet.';
  isSuccess = false;
  violationMessage = '';
  violationMessages: Array<Array<string>>= [];

  async generateViolationMessages() {
    const response = await this.getViolationDataFromLocalStorage();
    const violations = this.giveProperTypings(response);
    // Loop through all violation arrays in the "violations" object
    for (const violationsType of Object.getOwnPropertyNames(violations)) {
      const violationArray = violations[violationsType as keyof Violations];
      if (violationArray && Array.isArray(violationArray)) {
        violationArray.forEach(violation => {
          var messages = [`Violation Type: ${violation.getType()}`, `Data: ${violation.getData()}`, 
            `Timestamp: ${violation.getTimestamp()}`];
          this.violationMessages.push(messages);
        });
      }
    }
  }

  async getViolationDataFromLocalStorage() {
    const response = await chrome.runtime.sendMessage({type: "listViolations",
      inspectedTabId: chrome.devtools.inspectedWindow.tabId});
    return response;
  }

  giveProperTypings(response: ViolationDataType): Violations {
    var violationsPerTab: Violations = new Violations;
    for (const violationGroup of Object.getOwnPropertyNames(response)) {
      for (const violation of response[violationGroup as keyof ViolationDataType]) {
        const violationWithRightTyping = new Violation(violation['data'], violation['type'], violation['timestamp']);
        violationsPerTab.addViolation(violationWithRightTyping);
      }
    }

    return violationsPerTab;
  }

  ngOnInit() {
    console.log('OnInit');
    // Send message requesting default policy data
    (async () => {
      const defaultPolicyData : DefaultPolicyData =
                        await chrome.runtime.sendMessage({type: "getDefaultPolicyData"});
      if (defaultPolicyData.creationFailed) {
        this.isSuccess = false;
        this.message = 'Default policy creation failed.';
      } else if (defaultPolicyData.overwriteFailed) {
        this.isSuccess = false;
        this.message = "Failed to overwrite the extension's default policy."
      } else if (defaultPolicyData.wasSet) {
        this.isSuccess = true;
        this.message = 'Default policy was created.' ;
      }
    })();
  }
}
