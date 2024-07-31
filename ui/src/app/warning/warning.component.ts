import { Component, Input, OnInit } from '@angular/core';
import { DefaultPolicyWarning } from '../../../../common/common';
import { NgClass } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-warning',
  standalone: true,
  imports: [NgClass, MatCardModule],
  templateUrl: './warning.component.html',
  styleUrl: './warning.component.css',
})
export class WarningComponent implements OnInit {
  @Input()
  defaultPolicyWarning: DefaultPolicyWarning | null = null;
  isSuccess = false;
  message = 'No message yet.';

  generateDefaultPolicyWarning() {
    if (this.defaultPolicyWarning) {
      this.message = this.defaultPolicyWarning.message;
      this.isSuccess = this.defaultPolicyWarning.isSuccess;
    }
  }

  ngOnInit() {
    console.log('OnInit');
    this.generateDefaultPolicyWarning();
  }

  ngOnChanges() {
    this.generateDefaultPolicyWarning();
  }
}
