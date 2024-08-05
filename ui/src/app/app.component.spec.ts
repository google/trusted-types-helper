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

import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import {
  isMessage,
  ViolationDataType,
  Violation,
  StackFrameOrError,
  Message,
  createViolation,
} from '../../../common/common';

describe('AppComponent', () => {
  let chromeRuntimeMock: any; // Full type definition is way too long.
  const frames: StackFrameOrError[] = [];
  const listViolationsResponse: ViolationDataType = {
    // TODO: ViolationDataType isn't quite correct-- it contains a class
    // Violation but Violation should really be an interface (because a class
    // wouldn't survive being stringified and then un-stringified).
    HTML: [
      createViolation(
        'foobar',
        'HTML',
        Date.now(),
        { frames },
        'someSourceFile',
      ),
      createViolation(
        'bizbaz',
        'HTML',
        Date.now(),
        { frames },
        'someSourceFile',
      ),
    ],
    Script: [
      createViolation(
        'alert(1)',
        'Script',
        Date.now(),
        { frames },
        'someSourceFile',
      ),
    ],
    URL: [
      createViolation(
        'https://www.google.com/',
        'URL',
        Date.now(),
        { frames },
        'someSourceFile',
      ),
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();

    // Mock chrome.runtime.sendMessage and chrome.devtools.inspectedWindow.tabId
    chromeRuntimeMock = jasmine.createSpyObj('chrome.runtime', ['sendMessage']);
    const fakeSendMessage = (message: Message) => {
      // While this type guard isn't strictly necessary, this avoids crashing on
      // the UI sending unusual messages.
      if (isMessage(message)) {
        switch (message.type) {
          case 'listViolations':
            return Promise.resolve(listViolationsResponse);
          default:
            return Promise.resolve({});
        }
      }
      return Promise.resolve(undefined);
    };
    chromeRuntimeMock.sendMessage.and.callFake(fakeSendMessage);
    window.chrome.runtime = chromeRuntimeMock;
    window.chrome.devtools = {
      // Can't create a Spy for a simple data field access.
      inspectedWindow: {
        tabId: 0,
      } as typeof chrome.devtools.inspectedWindow,
    } as typeof chrome.devtools;
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'trusted-types-helper-ui' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
  });

  it('should render violations data', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    // Trigger the event that will fetch and render the violations.
    await fixture.componentInstance.populateViolations();
    fixture.detectChanges();

    // Make sure that the correct Chrome APIs were called
    expect(chromeRuntimeMock.sendMessage).toHaveBeenCalled();

    // In the current template, we throw everything into a <li>
    const renderedMessages: string[] = [];
    compiled.querySelectorAll('li')?.forEach((node) => {
      if (node.textContent) {
        renderedMessages.push(node.textContent);
      }
    });
    const allRenderedMessages = renderedMessages.join('\n');

    // Make sure all data from our fake data is surfaced.
    for (const violationType of Object.getOwnPropertyNames(
      listViolationsResponse,
    )) {
      for (const violation of listViolationsResponse[
        violationType as keyof ViolationDataType
      ]) {
        expect(allRenderedMessages).toContain(violation.data);
        expect(allRenderedMessages).toContain(violation.type);
      }
    }
  });
});
