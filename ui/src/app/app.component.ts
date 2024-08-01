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
import {
  DefaultPolicyWarning,
  Message,
  Violations,
  ViolationType,
  Violation,
  ViolationDataType,
  StackTrace,
} from '../../../common/common';
import { NgClass, NgFor, CommonModule } from '@angular/common';
import { ViolationComponent } from './violation/violation.component';
import { WarningComponent } from './warning/warning.component';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NgClass,
    NgFor,
    ViolationComponent,
    WarningComponent,
    CommonModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'trusted-types-helper-ui';
  message = 'No message yet.';
  isSuccess = false;
  violations: Violation[] = [];
  defaultPolicyWarningSubject =
    new BehaviorSubject<DefaultPolicyWarning | null>(null);
  defaultPolicyWarning$: Observable<DefaultPolicyWarning | null> =
    this.defaultPolicyWarningSubject.asObservable();

  async populateViolationsArray() {
    const response = await this.getViolationDataFromLocalStorage();
    const violations = this.giveProperTypings(response);
    // Reset this.violations, otherwise we display repeated violation information
    this.violations = [];
    // Loop through all violation arrays in the Violations object
    for (const violationsType of Object.getOwnPropertyNames(violations)) {
      // violationArray represents a list of violations for a single type
      // of violation (HTML, script or script url)
      const violationArray = violations[violationsType as keyof Violations];
      if (violationArray && Array.isArray(violationArray)) {
        this.violations.push(...violationArray);
      }
    }
  }

  async getViolationDataFromLocalStorage() {
    const response = await chrome.runtime.sendMessage({
      type: 'listViolations',
      inspectedTabId: chrome.devtools.inspectedWindow.tabId,
    });
    return response;
  }

  giveProperTypings(response: ViolationDataType): Violations {
    var violationsPerTab: Violations = new Violations();
    for (const violationGroup of Object.getOwnPropertyNames(response)) {
      for (const violation of response[
        violationGroup as keyof ViolationDataType
      ]) {
        const violationWithRightTyping = new Violation(
          violation['data'],
          violation['type'],
          violation['timestamp'],
          violation['stackTrace'],
          violation['documentUrl'],
        );
        violationsPerTab.addViolation(violationWithRightTyping);
      }
    }

    return violationsPerTab;
  }

  async updateDefaultPolicyData() {
    const defaultPolicyWarning = await chrome.runtime.sendMessage({
      type: 'getDefaultPolicyWarning',
    });
    this.defaultPolicyWarningSubject.next(defaultPolicyWarning);
  }

  ngOnInit() {
    this.updateDefaultPolicyData();
  }
}
