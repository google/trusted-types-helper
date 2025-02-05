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
import { Component, WritableSignal, inject, signal } from '@angular/core';
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
import { filter, switchMap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TrustedTypesViolationCluster } from '../../../common/common';
import { TimeAgoPipe } from './shared/pipes/time-ago.pipe';
import { ViolationDataService } from './shared/services/violation-data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

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
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  // TODO: These should eventually move to their own "Extension OFF component"
  onOffSwitchState$: Observable<OnOffSwitchState>;
  onOffToggleDisabled = false;
  onOffToggleButtonText = 'Turn On';
  extensionOn: WritableSignal<boolean>;

  // Data sources from service_worker.ts
  violationsByTypes$: Observable<ViolationsByTypes>;
  violationsByClusters$: Observable<TrustedTypesViolationCluster[]>;
  defaultPolicyData$: Observable<DefaultPolicyData>;

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

  private _snackBar = inject(MatSnackBar);
  private _dialog = inject(MatDialog);

  constructor(private violationDataService: ViolationDataService) {
    // Set the data sources from our service_worker.ts
    this.violationsByTypes$ = alertUserIfObservableIsPassingOnUndefined(
      this.violationDataService.violationDataByType$,
    );
    this.violationsByClusters$ = alertUserIfObservableIsPassingOnUndefined(
      this.violationDataService.violationDataByCluster$,
    );
    this.defaultPolicyData$ = alertUserIfObservableIsPassingOnUndefined(
      this.violationDataService.violationDataByDefaultPolicies$,
    );

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
              // Manual interop to Angular Signals.
              this.extensionOn.set(response.onOffState);
              observer.next(res);
            }
            observer.complete();
          });
        });
      }),
    );
    // Convenience accessor.
    // TODO: Move the template to use the signal version as well.
    this.extensionOn = signal(true);

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

  /**
   * Send a message to the service worker that we are flipping the ON/OFF
   *
   * TODO: Move to own "Extension OFF component" (This might fix the bug with
   * the button being forever disabled.)
   */
  toggleExtensionOnOff() {
    this.sendToggleOnOffSwitchMessage();
    this.onOffToggleDisabled = true;
    this.onOffToggleButtonText = 'Loading...';
  }

  /**
   * Just send the on/off message without changing view state of the warning.
   */
  sendToggleOnOffSwitchMessage() {
    const currentlyOnBeforeToggle = this.extensionOn();
    const msg: Message = {
      type: 'toggleOnOffSwitch',
    };
    chrome.runtime.sendMessage(msg);
    // While we wait for updates from the observable.
    this.extensionOn.set(!currentlyOnBeforeToggle);
    // Be responsible and let the user know.
    if (currentlyOnBeforeToggle) {
      alert(
        'Since you turned off the extension after the default policy was ' +
          'created, you might have to refresh the page for the extension is ' +
          'truly turned off for this tab.',
      );
    }
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

  clearViolationsForTab() {
    let dialogRef = this._dialog.open(AreYouSureDialog);
    dialogRef.afterClosed().subscribe((areTheySure) => {
      if (!areTheySure) {
        return;
      }
      chrome.runtime.sendMessage(
        {
          type: 'clearViolationsInTab',
          inspectedTabId: chrome.devtools.inspectedWindow.tabId,
        } as Message,
        (response) => {
          // Will respond with `true` if the chrome.storage.local.set succeded.
          if (response === true) {
            this._snackBar.open('Violations cleared!', 'Close', {
              duration: 5000,
            });
            // Kick off state refresh.
            this.refreshDataByType();
            this.refreshDataByCluster();
            this.refreshDataByDefaultPolicies();
          } else {
            this._snackBar.open(
              `Error clearing tab violation history: ${JSON.stringify(response)}`,
              'Close',
              { duration: 5000 },
            );
          }
        },
      );
    });
  }
}

/**
 * Just a simple dialog component for an "Are you sure?" box before clearing
 * history.
 */
@Component({
  selector: 'are-you-sure-dialog',
  template: `<h2 mat-dialog-title>Are you sure?</h2>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-button [mat-dialog-close]="true" cdkFocusInitial>
        Clear
      </button>
    </mat-dialog-actions>`,
  imports: [MatDialogModule, MatButtonModule],
  standalone: true,
})
export class AreYouSureDialog {}

/**
 * Show an alert to the user if the Chrome extension communication API has
 * broken down. Probably hacky but this is the best way to reset the Chrome API
 * state.
 *
 * @param stream
 * @returns
 */
function alertUserIfObservableIsPassingOnUndefined<T>(
  stream: Observable<T | undefined>,
): Observable<T> {
  return stream.pipe(
    filter((x) => {
      if (x === undefined) {
        alert(
          'Chrome extension did not initialize properly. Please refresh the page.',
        );
        return false;
      }
      return true;
    }),
  ) as Observable<T>;
}
