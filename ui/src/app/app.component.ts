/// <reference types="chrome"/>
// import {chrome} from '@types/chrome';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'trusted-types-helper-ui';

  ngOnInit() {
    console.log('OnInit');
    (async () => {
      const response = await chrome.runtime.sendMessage({command: "listViolations"});
      // do something with response here, not outside the function
      console.log(response);
    })();
  }
}
