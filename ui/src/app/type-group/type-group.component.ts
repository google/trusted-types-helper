import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { ViolationComponent } from '../violation/violation.component';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Violation, ViolationType } from '../../../../common/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-type-group',
  standalone: true,
  imports: [
    NgClass,
    NgIf,
    MatCardModule,
    MatButtonModule,
    NgFor,
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
