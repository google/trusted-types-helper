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
  TestBed,
  fakeAsync,
  tick,
  discardPeriodicTasks,
} from '@angular/core/testing';
import { AppComponent } from './app.component';
import {
  isMessage,
  ViolationDataType,
  StackFrameOrError,
  Message,
  createViolation,
} from '../../../common/common';
import { provideAnimations } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';

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
  let onOffState = true; // Start with extension turned on, like real life.

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideAnimations()], // Because this component has animations
    }).compileComponents();

    // Mock chrome.runtime.sendMessage and chrome.devtools.inspectedWindow.tabId
    chromeRuntimeMock = jasmine.createSpyObj('chrome.runtime', ['sendMessage']);
    const fakeSendMessage = (
      message: Message,
      callback: (...args: any) => void,
    ) => {
      // While this type guard isn't strictly necessary, this avoids crashing on
      // the UI sending unusual messages.
      if (isMessage(message)) {
        switch (message.type) {
          case 'listViolationsByType':
            callback && callback(listViolationsResponse);
            return Promise.resolve(listViolationsResponse);
          case 'listViolationsByCluster':
            callback && callback([]);
            return Promise.resolve([]); // TODO: Better value for this
          case 'getOnOffSwitchState':
            callback && callback({ onOffState: onOffState });
            return Promise.resolve({ onOffState: onOffState });
          case 'toggleOnOffSwitch':
            onOffState = !onOffState;
            callback && callback();
            return Promise.resolve();
          default:
            callback && callback();
            return Promise.resolve();
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

  afterEach(() => {
    // Reset to the default value.
    onOffState = true;
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should change viewed violations type', async () => {
    // Initially should be "By Clusters" by default.
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedViewMode).toEqual('byClusters');

    // Can be toggled to "By Types".
    let toggle = fixture.debugElement
      .queryAll(By.css('mat-button-toggle'))
      .find((node) => node.nativeElement.textContent === 'By Types')!;
    toggle.nativeElement.childNodes[0].click(); // Click the button inside.
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedViewMode).toEqual('byTypes');

    // And can be toggled back to "By Clusters".
    toggle = fixture.debugElement
      .queryAll(By.css('mat-button-toggle'))
      .find((node) => node.nativeElement.textContent === 'By Clusters')!;
    toggle.nativeElement.childNodes[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedViewMode).toEqual('byClusters');
  });

  it('should render violations data when displaying by types', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    // Trigger the event that will fetch and render the violations.
    tick(10_000); // Instead of awaiting, see whether we can just advance timer.
    fixture.detectChanges();
    const toggles = fixture.debugElement.queryAll(By.css('mat-button-toggle'));
    toggles
      .find((node) => node.nativeElement.textContent === 'By Types')!
      .nativeElement.childNodes[0].click();
    fixture.whenStable();
    tick(10_000);
    fixture.detectChanges();

    // Expand everything.
    fixture.debugElement.queryAll(By.css('button')).forEach((de) => {
      if (de.nativeElement.textContent.trim() === 'Expand violations') {
        de.nativeElement.click();
        fixture.detectChanges(); // Trigger change detection after each click
      }
    });

    // Make sure that the correct Chrome APIs were called
    expect(chromeRuntimeMock.sendMessage).toHaveBeenCalled();

    // Dump the entire text of the component.
    const allRenderedMessages = fixture.nativeElement.textContent;

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

    // Make sure that future tick(...) calls will work.
    discardPeriodicTasks();
  }));

  it('should poll for extension on/off state', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    // Check initial state (invisible)
    expect(fixture.componentInstance.onOffToggleDisabled).toBe(false);
    expect(fixture.componentInstance.onOffToggleButtonText).toBe('Turn On');

    // Advance time by (more than) 10 seconds to trigger the polling
    tick(20_000);
    fixture.detectChanges();

    // Assertions after the first poll (extension on to start with)
    expect(chromeRuntimeMock.sendMessage).toHaveBeenCalledWith(
      {
        type: 'getOnOffSwitchState',
      },
      jasmine.any(Function),
    );
    // Check if the "Extension is turned off" message is invisible
    let offMessage = fixture.debugElement.query(
      By.css('.card-container.extension-off-warning mat-card-content'),
    );
    expect(offMessage).toBeFalsy();

    // Mock the response for the second poll (extension turned off)
    onOffState = false;

    tick(20_000); // Advance time again
    fixture.detectChanges();

    // Assertions after the second poll (extension is off, warning is visible)
    // Check if the "Extension is turned off" message is visible
    offMessage = fixture.debugElement.query(
      By.css('.card-container.extension-off-warning mat-card-content'),
    );
    expect(offMessage).toBeTruthy();
    expect(offMessage.nativeElement.textContent).toContain(
      'Extension is turned off',
    );

    // Check that the button is clickable and turns on the extension.
    const button = fixture.debugElement.query(
      By.css('.card-container.extension-off-warning mat-card-actions button'),
    );
    expect(button).toBeTruthy();
    button.triggerEventHandler('click', null);
    fixture.detectChanges();

    // Message is correct
    expect(fixture.componentInstance.onOffToggleDisabled).toBe(true);
    expect(fixture.componentInstance.onOffToggleButtonText).toBe('Loading...');
    expect(button.nativeElement.disabled).toBe(true);
    expect(button.nativeElement.textContent).toContain('Loading...');

    tick(20_000); // Advance time again
    fixture.detectChanges();

    // Check if the "Extension is turned off" message is invisible
    offMessage = fixture.debugElement.query(
      By.css('.card-container.extension-off-warning mat-card-content'),
    );
    expect(offMessage).toBeFalsy();

    // Changed backend state.
    expect(onOffState).toBe(true);

    // Make sure that future tick(...) calls will work.
    discardPeriodicTasks();
  }));

  it('should toggle extension on/off', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.toggleExtensionOnOff();

    expect(chromeRuntimeMock.sendMessage).toHaveBeenCalledWith({
      type: 'toggleOnOffSwitch',
    });
    expect(component.onOffToggleDisabled).toBe(true);
    expect(component.onOffToggleButtonText).toBe('Loading...');
  });
});
