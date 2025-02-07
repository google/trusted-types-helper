/**
 * Copyright 2025 Google LLC
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
  flushMicrotasks,
} from '@angular/core/testing';
import { ViolationDataService } from './violation-data.service';
import {
  Message,
  StackFrameOrError,
  TrustedTypesViolationCluster,
  ViolationDataType,
  createViolation,
  isMessage,
} from '../../../../../common/common';
import { DefaultPolicyData } from '../../../../../common/default-policies';

describe('ViolationDataService', () => {
  let service: ViolationDataService;
  let chromeRuntimeMock: any;

  /**
   * So that we can do this individually per test to make sure all the
   * FakeAsyncZone's are the same per test.
   */
  function setUpTest() {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ViolationDataService);
  }

  // Some fake data. We can add more later.
  const fakeTabId = 0;
  const frames: StackFrameOrError[] = [];
  const mockViolationByDataType: ViolationDataType = {
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
  const mockViolationByCluster: TrustedTypesViolationCluster[] = [
    // ... your mock cluster data here
  ];
  const mockDefaultPoliciesResponse: DefaultPolicyData =
    DefaultPolicyData.empty();

  beforeEach(() => {
    // Mock Date.now()
    spyOn(Date, 'now').and.returnValue(1234567890); // Fixed timestamp

    // Mock chrome.runtime.sendMessage
    chromeRuntimeMock = jasmine.createSpyObj('chrome.runtime', ['sendMessage']);

    const fakeSendMessage = (
      message: Message,
      callback?: (...response: any) => void,
    ) => {
      if (isMessage(message)) {
        switch (message.type) {
          case 'listViolationsByType': {
            const response = mockViolationByDataType;
            callback && callback(response);
            return Promise.resolve(response);
          }
          case 'listViolationsByCluster': {
            const response = mockViolationByCluster;
            callback && callback(response);
            return Promise.resolve(response);
          }
          case 'defaultPolicies': {
            const response = mockDefaultPoliciesResponse;
            callback && callback(response);
            return Promise.resolve(response);
          }
          default:
            callback && callback();
            return Promise.resolve();
        }
      }
      return Promise.resolve(undefined);
    };

    chromeRuntimeMock.sendMessage.and.callFake(fakeSendMessage);
    window.chrome.runtime = chromeRuntimeMock;

    // Mock chrome.devtools.inspectedWindow so that we don't error out.
    window.chrome.devtools = {
      // Can't create a Spy for a simple data field access.
      inspectedWindow: {
        tabId: fakeTabId,
      } as typeof chrome.devtools.inspectedWindow,
    } as typeof chrome.devtools;
  });

  it('should be created', () => {
    setUpTest();
    expect(service).toBeTruthy();
  });

  it('should refresh data by type', fakeAsync(() => {
    setUpTest();
    let dataEmitted: ViolationDataType | undefined;
    service.violationDataByType$.subscribe((data) => {
      dataEmitted = data;
    });

    service.refreshDataByType();
    tick(0); // Advance time to allow the Observable to emit
    expect(dataEmitted).toEqual(mockViolationByDataType);
    expect(chromeRuntimeMock.sendMessage).toHaveBeenCalledWith({
      type: 'listViolationsByType',
      inspectedTabId: fakeTabId,
    });

    discardPeriodicTasks();
  }));

  it('should refresh data by cluster', fakeAsync(() => {
    setUpTest();
    let dataEmitted: TrustedTypesViolationCluster[] | undefined;
    service.violationDataByCluster$.subscribe((data) => {
      dataEmitted = data;
    });

    service.refreshDataByCluster();
    tick(0);
    expect(dataEmitted).toEqual(mockViolationByCluster);
    expect(chromeRuntimeMock.sendMessage).toHaveBeenCalledWith({
      type: 'listViolationsByCluster',
      inspectedTabId: fakeTabId,
    });

    discardPeriodicTasks();
  }));

  it('should refresh data by default policies', fakeAsync(() => {
    setUpTest();
    let dataEmitted: DefaultPolicyData | undefined;
    service.violationDataByDefaultPolicies$.subscribe((data) => {
      dataEmitted = data;
    });

    service.refreshDataByDefaultPolicies();
    tick(0);
    expect(dataEmitted).toEqual(mockDefaultPoliciesResponse);
    expect(chromeRuntimeMock.sendMessage).toHaveBeenCalledWith({
      type: 'defaultPolicies',
      inspectedTabId: fakeTabId,
    });

    discardPeriodicTasks();
  }));

  it('should refresh data periodically', fakeAsync(() => {
    // Moving this in here to be in the same FakeAsyncZone as our tick(...)
    setUpTest();

    // Subscribe to all three Observables to trigger the intervals
    service.violationDataByType$.subscribe();
    service.violationDataByCluster$.subscribe();
    service.violationDataByDefaultPolicies$.subscribe();

    tick(10_000);
    flushMicrotasks(); // Just in case...

    // Assert that all three message types were sent
    expect(chromeRuntimeMock.sendMessage).toHaveBeenCalledWith({
      type: 'listViolationsByType',
      inspectedTabId: fakeTabId,
    });
    expect(chromeRuntimeMock.sendMessage).toHaveBeenCalledWith({
      type: 'listViolationsByCluster',
      inspectedTabId: fakeTabId,
    });
    expect(chromeRuntimeMock.sendMessage).toHaveBeenCalledWith({
      type: 'defaultPolicies',
      inspectedTabId: fakeTabId,
    });

    discardPeriodicTasks();
  }));

  it('should allow setting a new refresh interval', fakeAsync(() => {
    setUpTest();
    service.setRefreshInterval(5_000); // Change to 5 seconds

    // Subscribe to all three Observables
    service.violationDataByType$.subscribe();
    service.violationDataByCluster$.subscribe();
    service.violationDataByDefaultPolicies$.subscribe();

    tick(5_000);

    // Assert that all three message types were sent with the new interval
    expect(chromeRuntimeMock.sendMessage).toHaveBeenCalledWith({
      type: 'listViolationsByType',
      inspectedTabId: fakeTabId,
    });
    expect(chromeRuntimeMock.sendMessage).toHaveBeenCalledWith({
      type: 'listViolationsByCluster',
      inspectedTabId: fakeTabId,
    });
    expect(chromeRuntimeMock.sendMessage).toHaveBeenCalledWith({
      type: 'defaultPolicies',
      inspectedTabId: fakeTabId,
    });

    discardPeriodicTasks();
  }));
});
