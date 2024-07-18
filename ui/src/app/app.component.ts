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
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DefaultPolicyData } from "../../../common/common";
import { NgClass } from '@angular/common';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgClass],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'trusted-types-helper-ui';
  message = 'No message yet.';
  isSuccess = false;


  ngOnInit() {
    console.log('OnInit');
    (async () => {

      const response = await chrome.runtime.sendMessage({type: "listViolations"});
      // do something with response here, not outside the function
    })();

    // Send message asking for the last time the default policy was overwritten
    (async () => {
      const defaultPolicyData : DefaultPolicyData =
                        await chrome.runtime.sendMessage({type: "getDefaultPolicyData"});
      if (defaultPolicyData.creationFailed) {
        this.isSuccess = false;
        this.message = 'Default policy creation failed.';
      } else if (defaultPolicyData.wasSet) {
        this.isSuccess = true;
        this.message = 'Default policy was created.' ;
      }
    })();
  }
}
