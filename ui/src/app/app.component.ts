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
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  DefaultPolicyWarning,
  Message,
  ViolationsByTypes,
  ViolationType,
  Violation,
  ViolationDataType,
  StackTrace,
  DefaultPolicyData,
  sortClusterByMostRecent,
  sortViolationsByTypesByMostRecent,
} from '../../../common/common';
import { NgClass, NgFor, CommonModule } from '@angular/common';
import { TypeGroupComponent } from './type-group/type-group.component';
import { ViolationComponent } from './violation/violation.component';
import { WarningComponent } from './warning/warning.component';
import { ClusterComponent } from './cluster/cluster.component';
import { DefaultPolicyComponent } from './default-policies/default-policies.component';
import { BehaviorSubject, Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
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
    TypeGroupComponent,
    ViolationComponent,
    WarningComponent,
    ClusterComponent,
    DefaultPolicyComponent,
    CommonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  // To detect toggle button changes
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  showFirstViolationOnly = true;
  expandOrHideViolationsMessage = 'Expand violations';
  message = 'No message yet.';
  isSuccess = false;
  violationsByTypes: ViolationsByTypes = {
    HTML: [],
    Script: [],
    URL: [],
  };
  violationsByClusters: TrustedTypesViolationCluster[] = [];
  defaultPolicyData: DefaultPolicyData = {
    HTML: [],
    Script: [],
    URL: [],
  };
  defaultPolicyWarningSubject =
    new BehaviorSubject<DefaultPolicyWarning | null>(null);
  defaultPolicyWarning$: Observable<DefaultPolicyWarning | null> =
    this.defaultPolicyWarningSubject.asObservable();
  selectedViewMode: 'byClusters' | 'byTypes' | 'defaultPolicies' = 'byClusters'; // Default viewing mode

  constructor(private cdr: ChangeDetectorRef) {}

  async populateViolations() {
    const response = await this.getViolationDataFromLocalStorage();
    if (this.selectedViewMode == 'byClusters') {
      this.violationsByClusters = response.forEach(
        (cluster: TrustedTypesViolationCluster) =>
          sortClusterByMostRecent(cluster),
      );
    } else if (this.selectedViewMode == 'byTypes') {
      sortViolationsByTypesByMostRecent(response);
      this.violationsByTypes = response;
    } else if (this.selectedViewMode == 'defaultPolicies') {
      this.defaultPolicyData = response;
    }
    // Trigger re-render because this assignment might happen after the initial
    // paint in ngOnInit().
    this.cdr.detectChanges();
  }

  async getViolationDataFromLocalStorage() {
    const message: Message = {
      type: this.getMessageTypeFromViewMode(),
      inspectedTabId: chrome.devtools.inspectedWindow.tabId,
    };
    const response = await chrome.runtime.sendMessage(message);

    return response;
  }

  getMessageTypeFromViewMode() {
    if (this.selectedViewMode == 'byTypes') {
      return 'listViolationsByType';
    } else if (this.selectedViewMode == 'defaultPolicies') {
      return 'defaultPolicies';
    }
    return 'listViolationsByCluster';
  }

  async updateDefaultPolicyData() {
    const defaultPolicyWarning = await chrome.runtime.sendMessage({
      type: 'getDefaultPolicyWarning',
    });
    this.defaultPolicyWarningSubject.next(defaultPolicyWarning);
  }

  toggleViolationVisibility() {
    this.showFirstViolationOnly = !this.showFirstViolationOnly;
    if (this.showFirstViolationOnly == true) {
      this.expandOrHideViolationsMessage = 'Expand violations';
    } else {
      this.expandOrHideViolationsMessage = 'Hide violations';
    }
  }

  ngOnInit() {
    this.updateDefaultPolicyData();
    this.populateViolations();
  }
}
