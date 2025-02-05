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
} from '@angular/core';
import { ViolationComponent } from '../violation/violation.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Violation, ViolationType } from '../../../../common/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-type-group',
  imports: [
    MatCardModule,
    MatButtonModule,
    ViolationComponent,
    MatBadgeModule,
    MatExpansionModule,
  ],
  templateUrl: './type-group.component.html',
  styleUrl: './type-group.component.css',
  // To detect expand violations button changes
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeGroupComponent implements OnInit {
  @Input()
  violationGroupByType: Violation[] | undefined = undefined;
  showFirstViolationOnly = true;
  expandOrHideViolationsMessage = 'Expand violations';
  type: ViolationType | undefined = undefined;

  toggleViolationVisibility() {
    this.showFirstViolationOnly = !this.showFirstViolationOnly;
    if (this.showFirstViolationOnly == true) {
      this.expandOrHideViolationsMessage = 'Expand violations';
    } else {
      this.expandOrHideViolationsMessage = 'Hide violations';
    }
  }

  ngOnInit() {
    console.log('OnInit');
    if (this.violationGroupByType && this.violationGroupByType.length >= 1) {
      this.type = this.violationGroupByType[0].type;
    }
  }

  ngOnChanges() {}
}
