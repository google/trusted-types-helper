import { Component, Input, OnInit } from '@angular/core';
import { DefaultPolicyData } from '../../../../common/common';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-warning',
  standalone: true,
  imports: [NgClass],
  templateUrl: './warning.component.html',
  styleUrl: './warning.component.css',
})
export class WarningComponent implements OnInit {
  @Input()
  defaultPolicyData: DefaultPolicyData | null = null;
  isSuccess = false;
  message = 'No message yet.';

  generateDefaultPolicyWarning() {
    if (this.defaultPolicyData) {
      if (this.defaultPolicyData.creationFailed) {
        this.isSuccess = false;
        this.message = 'Default policy creation failed.';
      } else if (this.defaultPolicyData.overwriteFailed) {
        this.isSuccess = false;
        this.message = "Failed to overwrite the extension's default policy.";
      } else if (this.defaultPolicyData.wasSet) {
        this.isSuccess = true;
        this.message = 'Default policy was created.';
      }
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
