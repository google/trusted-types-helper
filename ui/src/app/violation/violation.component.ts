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
  Component,
  Input,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import {
  StackTrace,
  Violation,
  ViolationType,
} from '../../../../common/common';
import { NgFor, NgClass, NgIf } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-violation',
  standalone: true,
  imports: [
    NgFor,
    NgClass,
    NgIf,
    MatCardModule,
    MatChipsModule,
    MatExpansionModule,
  ],
  templateUrl: './violation.component.html',
  styleUrl: './violation.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViolationComponent {
  readonly panelOpenState = signal(false);
  @Input()
  violation: Violation | undefined = undefined;
  @Input()
  isFirstViolation = false;
  elapsedTime: string = '';
  stackTraceLines: string[] = [];
  chipColor = '#D3D3D3';

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
          `  at ${frame.functionName} (${frame.scriptUrl}:${frame.lineNumber}:${frame.columnNumber})\n`,
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

  getElapsedTime(currentTime: number): string {
    const now: number = Date.now();
    const difference: number = now - currentTime;

    const seconds = Math.floor(difference / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes === 0) {
      // Less than a minute
      return 'just now';
    } else if (minutes === 1) {
      return 'A minute ago';
    } else if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else {
      return 'more than an hour ago';
    }
  }

  getChipColor(type: ViolationType): string {
    if (type == 'HTML') {
      return '#C5DCA0'; // Light green
    } else if (type == 'Script') {
      return '#F2EEA0'; // Light yellow
    } else if (type == 'URL') {
      return '#F9DAD0'; // Light red
    }
    return '#D3D3D3'; // Gray
  }

  ngOnInit() {
    if (this.violation) {
      this.stackTraceLines = this.generateStackTraceMessage(
        this.violation.stackTrace,
      );
      this.elapsedTime = this.getElapsedTime(this.violation.timestamp);
      this.chipColor = this.getChipColor(this.violation.type);
    }
  }
}
