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
import { StackTrace, StackFrame, StackFrameOrError } from "./common";
/**
 * The first line is the word "Error" and the next three lines are calls to
 *  functions internal to the extension:"getStackTrace", "createMessage" and
 * either "createHTML", "createScript" or "createUrl".
 */
export const NUMBER_OF_EXTENSION_INTERNAL_STACK_FRAMES: number = 4;

/**
 * Parses a stack trace string into a StackTrace object.
 *
 * The function attempts to extract function names, script URLs, line numbers,
 * and column numbers from each line of the stack trace. If a line cannot be
 * parsed successfully, it is included as a string in the frames array.
 *
 * @param {string} stack - The stack trace string to parse.
 * @returns A StackTrace object containing an array of StackFrameOrError objects.
 */
export function parseStackTrace(stack: string): StackTrace {
  var frames: StackFrameOrError[] = [];

  const lines = stack.split("\n");

  for (const line of lines) {
    const fullMatch = line.match(/at\s+(\S+)\s+\((\S+):(\d+):(\d+)\)/);
    if (fullMatch) {
      const [, functionNameWithAt, scriptUrl, lineNumber, columnNumber] =
        fullMatch;
      const functionName = functionNameWithAt.replace(/^at /, "");
      frames.push({
        functionName: functionName.trim(),
        scriptUrl,
        lineNumber: parseInt(lineNumber, 10),
        columnNumber: parseInt(columnNumber, 10),
      });
      continue;
    }
    // Handle lines without function name (like the last line)
    const urlMatch = line.match(/at https:\/\/(.+):(\d+):(\d+)$/);
    if (urlMatch) {
      const [, scriptUrl, lineNumber, columnNumber] = urlMatch;
      frames.push({
        scriptUrl,
        lineNumber: parseInt(lineNumber, 10),
        columnNumber: parseInt(columnNumber, 10),
      });
      continue;
    }

    // The string does not match any of string formats we were expecting
    frames.push(line);
  }

  return { frames };
}

export function isStackFrame(obj: any): obj is StackFrame {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.scriptUrl === "string" &&
    typeof obj.lineNumber === "number" &&
    typeof obj.columnNumber === "number" &&
    (obj.functionName === undefined || typeof obj.functionName === "string")
  );
}

export function getFirstValidStackFrame(
  stackTrace: StackTrace,
): StackFrameOrError {
  if (stackTrace.frames.length > NUMBER_OF_EXTENSION_INTERNAL_STACK_FRAMES) {
    // The first 4 lines are skipped because the first line is the word "Error"
    // and the next three lines are calls to functions internal to the
    // extension:"getStackTrace", "createMessage" and either "createHTML",
    // "createScript" or "createUrl". So the stack trace must have at least 5
    // lines to look at the first valid stack frame
    return stackTrace.frames[NUMBER_OF_EXTENSION_INTERNAL_STACK_FRAMES];
  }
  return "No valid first stack frame";
}

export function getRootCause(stackTrace: StackTrace): string {
  const frame: StackFrameOrError = getFirstValidStackFrame(stackTrace);
  if (typeof frame === "string") {
    return frame;
  } else if (frame.functionName) {
    return `${frame.functionName} (${frame.scriptUrl}:${frame.lineNumber}:${frame.columnNumber})`;
  } else {
    return `${frame.scriptUrl}:${frame.lineNumber}:${frame.columnNumber}`;
  }
}
