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
  ViolationsByTypes,
  ViolationType,
  Violation,
  ViolationDataType,
  StackTrace,
} from '../../../common/common';
import { NgClass, NgFor, CommonModule } from '@angular/common';
import { ViolationComponent } from './violation/violation.component';
import { WarningComponent } from './warning/warning.component';
import { BehaviorSubject, Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TrustedTypesViolationCluster } from '../../../common/common';

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
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  message = 'No message yet.';
  isSuccess = false;
  private populateViolationsInterval: any;
  violationsByTypes: ViolationsByTypes = new ViolationsByTypes();
  violationsByClusters: TrustedTypesViolationCluster[] = [];
  defaultPolicyWarningSubject =
    new BehaviorSubject<DefaultPolicyWarning | null>(null);
  defaultPolicyWarning$: Observable<DefaultPolicyWarning | null> =
    this.defaultPolicyWarningSubject.asObservable();
  selectedMode = 'byClusters'; // Default viewing mode

  async populateViolations() {
    const response = await this.getViolationDataFromLocalStorage();
    debugger;
    if (this.selectedMode == 'byClusters') {
      this.violationsByClusters = response;
    } else if (this.selectedMode == 'byTypes') {
      var processedViolationsByType: ViolationsByTypes =
        new ViolationsByTypes();
      for (const violationGroup of Object.getOwnPropertyNames(response)) {
        for (const violation of response[
          violationGroup as keyof ViolationDataType
        ]) {
          processedViolationsByType.addViolation(violation);
        }
      }
      this.violationsByTypes = processedViolationsByType;
    }
  }

  async getViolationDataFromLocalStorage() {
    var command = 'listViolationsByClusters';
    if (this.selectedMode == 'byTypes') {
      command = 'listViolationsByTypes';
    }
    const response = await chrome.runtime.sendMessage({
      type: command,
      inspectedTabId: chrome.devtools.inspectedWindow.tabId,
    });

    return response;
  }

  async updateDefaultPolicyData() {
    const defaultPolicyWarning = await chrome.runtime.sendMessage({
      type: 'getDefaultPolicyWarning',
    });
    this.defaultPolicyWarningSubject.next(defaultPolicyWarning);
  }

  ngOnInit() {
    console.log('This is after violation is interface');
    this.updateDefaultPolicyData();
    // Start interval to call populateViolations()
    this.populateViolationsInterval = setInterval(() => {
      this.populateViolations();
    }, 500);
  }
}
