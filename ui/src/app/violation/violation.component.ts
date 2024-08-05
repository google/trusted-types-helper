import { Component, Input } from '@angular/core';
import {
  StackTrace,
  Violation,
  ViolationType,
} from '../../../../common/common';
import { NgFor, NgClass } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-violation',
  standalone: true,
  imports: [NgFor, NgClass, MatCardModule],
  templateUrl: './violation.component.html',
  styleUrl: './violation.component.css',
})
export class ViolationComponent {
  @Input()
  violation: Violation | undefined = undefined;
  violationMessages: string[] = [];
  timestamp: number = 0; // remove later
  elapsedTime: string = '';
  violationType: string = '';
  stackTraceLines: string[] = [];

  /**
   * Generates an array of messages describing a given violation.
   *
   * @param {Violation} violation - The violation object to generate messages for.
   * @returns {string[]} - An array of strings containing the generated messages.
   *
   */
  generateMessage(violation: Violation): string[] {
    var messages = [
      `Violation Type: ${violation.type}`,
      `Data passed into injection sink: ${violation.data}`,
      'Stack Trace:',
      ...this.generateStackTraceMessage(violation.stackTrace),
      `Document URL: ${violation.documentUrl}`,
    ];

    // Check if getSourceFile is defined and add the message accordingly
    if (violation.sourceFile) {
      messages.push(`Source file of violation: ${violation.sourceFile}`);
    } else {
      messages.push('No source file available.');
    }

    return messages;
  }

  /**
   * Generates a formatted stack trace message from the provided stack trace
   * object, excluding the first three lines.
   *
   * @param stackTrace - The stack trace object containing frame information.
   * @returns A string array representing each line of a formatted stack trace.
   */
  generateStackTraceMessage(stackTrace: StackTrace): string[] {
    const stackTraceLines: string[] = [];
    // Skip the first 4 stack frames:
    // - The first frame is the word 'Error'
    // - The next three frames are calls to helper functions internal to the
    //   extension: createHTML or createScript or createScriptUrl,
    //   createMessage, and getStackTrace
    let skipCount = 4;

    for (const frame of stackTrace.frames) {
      if (skipCount > 0) {
        skipCount--;
        continue;
      }
      if (typeof frame === 'string') {
        stackTraceLines.push(`${frame}\n`);
      } else if (frame.functionName) {
        stackTraceLines.push(
          `  at ${frame.functionName}(${frame.scriptUrl}:${frame.lineNumber}:${frame.columnNumber})\n`,
        );
      } else {
        // No function name, no parenthesis
        stackTraceLines.push(
          `  at ${frame.scriptUrl}:${frame.lineNumber}:${frame.columnNumber}\n`,
        );
      }
    }

    return stackTraceLines;
  }

  getElapsedTime(currentTime: number): void {
    const now: number = Date.now();
    console.log('Date of time of violation: ', currentTime);
    const difference: number = now - currentTime;

    const seconds = Math.floor(difference / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes === 0) {
      // Less than a minute
      this.elapsedTime = 'just now';
    } else if (minutes === 1) {
      this.elapsedTime = 'A minute ago';
    } else if (minutes < 60) {
      this.elapsedTime = `${minutes} minutes ago`;
    } else {
      this.elapsedTime = 'more than an hour ago';
    }
  }

  ngOnInit() {
    if (this.violation) {
      this.violationMessages = this.generateMessage(this.violation);
      this.timestamp = this.violation.timestamp;
      this.violationType = this.violation.type;
      this.getElapsedTime(this.violation.timestamp);
    }
  }
}
