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

import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { ViolationComponent } from '../violation/violation.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TrustedTypesViolationCluster } from '../../../../common/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-cluster',
  imports: [
    MatCardModule,
    MatButtonModule,
    ViolationComponent,
    MatBadgeModule,
    MatExpansionModule,
  ],
  templateUrl: './cluster.component.html',
  styleUrl: './cluster.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClusterComponent implements OnInit {
  @Input() cluster: TrustedTypesViolationCluster | undefined;
  firstSeen: string | undefined;
  readonly panelOpenState = signal(false);
  readonly showFirstViolationOnly = signal(true);
  expandOrHideViolationsMessage = 'Expand violations';

  toggleViolationVisibility() {
    this.showFirstViolationOnly.set(!this.showFirstViolationOnly());
    if (this.showFirstViolationOnly()) {
      this.expandOrHideViolationsMessage = 'Expand violations';
    } else {
      this.expandOrHideViolationsMessage = 'Hide violations';
    }
  }

  ngOnInit() {
    if (this.cluster) {
      console.log(this.cluster);
      this.firstSeen = new Date(
        this.cluster.metadata.firstOccurrence,
      ).toUTCString();
    }
  }
}
