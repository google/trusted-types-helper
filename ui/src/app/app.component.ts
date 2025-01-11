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
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  DefaultPolicyWarning,
  Message,
  ViolationsByTypes,
} from '../../../common/common';
import { DefaultPolicyData } from '../../../common/default-policies';
import { NgClass, NgFor, CommonModule } from '@angular/common';
import { TypeGroupComponent } from './type-group/type-group.component';
import { ViolationComponent } from './violation/violation.component';
import { WarningComponent } from './warning/warning.component';
import { ClusterComponent } from './cluster/cluster.component';
import { DefaultPolicyComponent } from './default-policies/default-policies.component';
import { Observable, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TrustedTypesViolationCluster } from '../../../common/common';
import { TimeAgoPipe } from './shared/pipes/time-ago.pipe';
import { ViolationDataService } from './shared/services/violation-data.service';

/**
 * Tuple for how recently we polled for extension on/off status.
 */
interface OnOffSwitchState {
  state: boolean;
  timestamp: Date;
}

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
    TimeAgoPipe,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  // TODO: These should eventually move to their own "Extension OFF component"
  onOffSwitchState$: Observable<OnOffSwitchState>;
  onOffToggleDisabled = false;
  onOffToggleButtonText = 'Turn On';

  // Data sources from service_worker.ts
  violationsByTypes$: Observable<ViolationsByTypes>;
  violationsByClusters$: Observable<TrustedTypesViolationCluster[]>;
  defaultPolicyData$: Observable<DefaultPolicyData>;

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
    HTML: {
      tags: [],
      attrs: [],
      violationFragment: [],
      allowlist: [],
    },
    Script: [],
    URL: [],
  };
  defaultPolicyWarning$ = signal<DefaultPolicyWarning | undefined>(undefined);
  selectedViewMode: 'byClusters' | 'byTypes' | 'defaultPolicies' = 'byClusters'; // Default viewing mode

  constructor(private violationDataService: ViolationDataService) {
    // Set the data sources from our service_worker.ts
    this.violationsByTypes$ = this.violationDataService.violationDataByType$;
    this.violationsByClusters$ =
      this.violationDataService.violationDataByCluster$;
    this.defaultPolicyData$ =
      this.violationDataService.violationDataByDefaultPolicies$;

    // Call every ten seconds to poll for extension on/off status.
    this.onOffSwitchState$ = interval(10_000).pipe(
      switchMap(() => {
        return new Observable<OnOffSwitchState>((observer) => {
          const msg: Message = {
            type: 'getOnOffSwitchState',
          };
          chrome.runtime.sendMessage(msg, (response) => {
            if (response && 'onOffState' in response) {
              const res = {
                state: response.onOffState,
                timestamp: new Date(),
              };
              observer.next(res);
            }
            observer.complete();
          });
        });
      }),
    );

    // Call once during construction to see whether there is a status on
    // the default policy creation.
    chrome.runtime.sendMessage(
      {
        type: 'getDefaultPolicyWarning',
      },
      (res) => {
        this.defaultPolicyWarning$.set(res);
      },
    );

    // Kick off the initial data fetching.
    this.refreshDataByType();
    this.refreshDataByCluster();
    this.refreshDataByDefaultPolicies();
  }

  private refreshDataByType() {
    console.log(`Calling refreshDataByType from app.component.ts`);
    this.violationDataService.refreshDataByType();
  }

  private refreshDataByCluster() {
    this.violationDataService.refreshDataByCluster();
  }

  private refreshDataByDefaultPolicies() {
    this.violationDataService.refreshDataByDefaultPolicies();
  }

  toggleViolationVisibility() {
    this.showFirstViolationOnly = !this.showFirstViolationOnly;
    if (this.showFirstViolationOnly == true) {
      this.expandOrHideViolationsMessage = 'Expand violations';
    } else {
      this.expandOrHideViolationsMessage = 'Hide violations';
    }
  }

  /**
   * Send a message to the service worker that we are flipping the ON/OFF
   *
   * TODO: Move to own "Extension OFF component"
   */
  toggleExtensionOnOff() {
    const msg: Message = {
      type: 'toggleOnOffSwitch',
    };
    chrome.runtime.sendMessage(msg);
    this.onOffToggleDisabled = true;
    this.onOffToggleButtonText = 'Loading...';
  }

  onViewGroupChange() {
    console.log(`onViewGroupChange triggered: ${this.selectedViewMode}`);
    switch (this.selectedViewMode) {
      case 'byClusters':
        this.refreshDataByCluster();
        break;
      case 'byTypes':
        console.log(`Calling this.refreshDataByType()`);
        this.refreshDataByType();
        break;
      case 'defaultPolicies':
        this.refreshDataByDefaultPolicies();
        break;
    }
  }
}
