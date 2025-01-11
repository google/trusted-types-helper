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

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViolationComponent } from './violation.component';
import {
  Violation,
  ViolationType,
  StackFrame,
} from '../../../../common/common';
import { By } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';

describe('ViolationComponent', () => {
  let component: ViolationComponent;
  let fixture: ComponentFixture<ViolationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViolationComponent],
      providers: [provideAnimations()], // Because this component has animations
    }).compileComponents();

    fixture = TestBed.createComponent(ViolationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate correct messages for a basic violation', () => {
    // Create a mock violation object with mock data
    const violation: Violation = {
      data: 'someData',
      type: 'HTML',
      timestamp: 123456789,
      stackTrace: { frames: [] },
      documentUrl: 'https://example.com',
      sourceFile: 'path/to/source.js',
    };
    component.violation = violation;
    component.ngOnInit(); // Force to reload the component as if the first time.
    fixture.detectChanges();

    fixture.debugElement
      .query(By.css('mat-expansion-panel-header'))
      .nativeElement.click();
    fixture.detectChanges();
    const messages = fixture.debugElement.query(By.css('mat-expansion-panel'))
      .nativeElement.textContent;
    [
      'HTML',
      'someData',
      'Stack trace:',
      'https://example.com',
      // 'path/to/source.js', // TODO: Put this back in the UI.
    ].forEach((s) => expect(messages).toContain(s));
  });

  it('should format a stack trace correctly', () => {
    const stackFrame1: StackFrame = {
      functionName: 'someFunction',
      scriptUrl: 'path/to/external.js',
      lineNumber: 10,
      columnNumber: 1,
    };

    const stackFrame2: StackFrame = {
      functionName: 'anotherFunction',
      scriptUrl: 'path/to/another.js',
      lineNumber: 20,
      columnNumber: 2,
    };
    const stackTrace = {
      frames: [
        'Error', // Skipped
        'internalFunction1', // Skipped
        'internalFunction2', // Skipped
        'internalFunction3', // Skipped
        stackFrame1,
        stackFrame2,
      ],
    };
    const formattedStackTrace = component.generateStackTraceMessage(stackTrace);
    expect(formattedStackTrace.map((s) => s.trim())).toEqual([
      'at someFunction (path/to/external.js:10:1)',
      'at anotherFunction (path/to/another.js:20:2)',
    ]);
  });

  it('should generate correct messages when source file of violation is undefined.', () => {
    // Create a mock violation object with mock data
    const violation: Violation = {
      data: 'someData',
      type: 'HTML',
      timestamp: 123456789,
      stackTrace: {
        frames: [
          'Error', // Skipped
          'internalFunction1', // Skipped
          'internalFunction2', // Skipped
          'internalFunction3', // Skipped
          'internalFunction4', // No source file
        ],
      },
      documentUrl: 'https://example.com',
    };
    component.violation = violation;
    component.ngOnInit(); // Force to reload the component as if the first time.
    fixture.detectChanges();

    fixture.debugElement
      .query(By.css('mat-expansion-panel-header'))
      .nativeElement.click();
    fixture.detectChanges();
    const messages = fixture.debugElement.query(By.css('mat-expansion-panel'))
      .nativeElement.textContent;
    [
      'HTML',
      'someData',
      'Stack trace:',
      'internalFunction4',
      'Document URL: https://example.com',
      // 'No source file available.', // TODO: Put this back in the UI.
    ].forEach((s) => expect(messages).toContain(s));
  });
});
