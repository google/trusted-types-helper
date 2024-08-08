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
import { TrustedTypesViolationCluster } from '../../../../common/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-cluster',
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
  templateUrl: './cluster.component.html',
  styleUrl: './cluster.component.css',
  // To detect expand violations button changes
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClusterComponent implements OnInit {
  @Input()
  cluster: TrustedTypesViolationCluster | undefined = undefined;
  clusterMetadataMessages: string[] = [];
  firstSeen: string = '';
  readonly panelOpenState = signal(false);
  showFirstViolationOnly = true;
  expandOrHideViolationsMessage = 'Expand violations';

  toggleViolationVisibility() {
    console.log('Mat button click before', this.showFirstViolationOnly);
    this.showFirstViolationOnly = !this.showFirstViolationOnly;
    if (this.showFirstViolationOnly == true) {
      this.expandOrHideViolationsMessage = 'Expand violations';
    } else {
      this.expandOrHideViolationsMessage = 'Hide violations';
    }
    console.log('Mat button click after', this.showFirstViolationOnly);
  }

  ngOnInit() {
    console.log('Hi');
    if (this.cluster) {
      console.log(this.cluster);
      this.firstSeen = new Date(
        this.cluster.metadata.firstOccurrence,
      ).toUTCString();
    }
  }

  ngOnChanges() {}
}
