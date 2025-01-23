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

import { Component, computed, effect, input } from '@angular/core';
import { DefaultPolicyWarning } from '../../../../common/common';
import { NgClass } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-warning',
  standalone: true,
  imports: [NgClass, MatCardModule],
  templateUrl: './warning.component.html',
  styleUrl: './warning.component.css',
})
export class WarningComponent {
  constructor(private snackBar: MatSnackBar) {}

  defaultPolicyWarning = input<DefaultPolicyWarning | undefined>(undefined);
  isSuccess = computed(() => this.defaultPolicyWarning()?.isSuccess || false);
  message = computed(
    () => this.defaultPolicyWarning()?.message || 'No message yet.',
  );

  // Make sure that the snackbar pops open whenever the DefaultPolicyWarning
  // is updated.
  displayDefaultPolicyWarningMessage = effect(() => {
    this.snackBar.open(this.message(), 'Close');
  });
}
