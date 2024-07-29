import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViolationComponent } from './violation.component';
import {
  Violation,
  ViolationType,
  StackFrame,
} from '../../../../common/common';

describe('ViolationComponent', () => {
  let component: ViolationComponent;
  let fixture: ComponentFixture<ViolationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViolationComponent],
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
    const violation: Violation = new Violation(
      'someData',
      'HTML',
      0,
      { frames: [] },
      'https://example.com',
    );
    violation.setSourceFile('path/to/source.js');

    const messages = component.generateMessage(violation);
    expect(messages).toEqual([
      'Violation Type: HTML',
      'Data passed into injection sink: someData',
      'Stack Trace:',
      'Document URL: https://example.com',
      'Source file of violation: path/to/source.js',
    ]);
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
        'internalFUnction3', // Skipped
        stackFrame1,
        stackFrame2,
      ],
    };
    const formattedStackTrace = component.generateStackTraceMessage(stackTrace);
    expect(formattedStackTrace).toEqual([
      '  at someFunction(path/to/external.js:10:1)\n',
      '  at anotherFunction(path/to/another.js:20:2)\n',
    ]);
  });
});
