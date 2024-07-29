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

export interface DefaultPolicyData {
  wasSet?: Date;
  creationFailed?: Date;
  overwriteFailed?: Date;
}

export type ViolationType = "HTML" | "Script" | "URL";

// TODO: Update the type guard below if this type is updated
export class Violation {
  private data: string;
  private type: ViolationType;
  private timestamp: number;
  private stackTrace: StackTrace;
  private documentUrl: string;
  private sourceFile?: string;

  public constructor(
    data: string,
    type: ViolationType,
    timestamp: number,
    stackTrace: StackTrace,
    documentUrl: string,
  ) {
    this.data = data;
    this.type = type;
    this.timestamp = timestamp;
    this.stackTrace = stackTrace;
    this.documentUrl = documentUrl;
    // Get source file from the scriptUrl field of the last element in the
    // stack trace
    if (stackTrace.frames && stackTrace.frames.length > 0) {
      const lastFrame = stackTrace.frames[stackTrace.frames.length - 1];
      if (typeof lastFrame !== "string") {
        this.sourceFile = lastFrame.scriptUrl;
      }
    }
  }

  // This setter is used for testing purposes only
  public setSourceFile(sourceFile: string): void {
    this.sourceFile = sourceFile;
  }
  public getData(): string {
    return this.data;
  }

  public getType(): ViolationType {
    return this.type;
  }

  public getTimestamp(): number {
    return this.timestamp;
  }

  public getStackTrace(): StackTrace {
    return this.stackTrace;
  }

  public getDocumentUrl(): string {
    return this.documentUrl;
  }

  public getSourceFile(): string | undefined {
    return this.sourceFile;
  }
}

// TODO: Update this type guard if the type above is updated
export function isViolation(obj: any): obj is Violation {
  return (
    obj &&
    obj.data?.type === "string" &&
    obj.timestamp instanceof Date &&
    obj.type?.type === "string" &&
    ["HTML", "Script", "URL"].includes(obj.type)
  );
}

export type ViolationDataType = {
  [key in ViolationType]: Array<Violation>;
};

export class Violations implements ViolationDataType {
  public HTML: Array<Violation> = [];
  public Script: Array<Violation> = [];
  public URL: Array<Violation> = [];

  constructor() {}

  public addViolation(violation: Violation) {
    switch (violation.getType()) {
      case "HTML":
        this.HTML.push(violation);
        break;
      case "Script":
        this.Script.push(violation);
        break;
      case "URL":
        this.URL.push(violation);
        break;
      default:
        console.error(`Unknown violation type: ${violation.getType()}`);
    }
  }
}

// TODO: Change the type guard below if this type is updated
export interface Message {
  type:
    | "violationFound"
    | "listViolations"
    | "defaultPolicySet"
    | "defaultPolicyCreationFailed"
    | "defaultPolicyOverwriteFailed"
    | "getDefaultPolicyData";
  violation?: Violation;
  defaultPolicySet?: Date;
  defaultPolicyCreationFailed?: Date;
  defaultPolicyOverwriteFailed?: Date;
  inspectedTabId?: number;
}

// TODO: Change this if the type above is updated.
export function isMessage(obj: any): obj is Message {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "type" in obj &&
    typeof obj.type === "string" &&
    [
      "violationFound",
      "listViolations",
      "defaultPolicySet",
      "defaultPolicyCreationFailed",
      "defaultPolicyOverwriteFailed",
      "getDefaultPolicyData",
    ].includes(obj.type) &&
    ("violation" in obj
      ? obj.violation === undefined || isViolation(obj.violation)
      : true) &&
    ("defaultPolicySet" in obj
      ? obj.defaultPolicySet instanceof Date ||
        obj.defaultPolicySet === undefined
      : true) &&
    ("defaultPolicyCreationFailed" in obj
      ? obj.defaultPolicyCreationFailed instanceof Date ||
        obj.defaultPolicyCreationFailed === undefined
      : true) &&
    ("defaultPolicyOverwriteFailed" in obj
      ? obj.defaultPolicyOverwriteFailed instanceof Date ||
        obj.defaultPolicyOverwriteFailed === undefined
      : true) &&
    ("inspectedTabId" in obj
      ? typeof obj.inspectedTabId === "number" ||
        obj.inspectedTabId === undefined
      : true)
  );
}

/**
 * This interface represents a single line in the stack trace.
 */
export interface StackFrame {
  functionName?: string;
  scriptUrl: string;
  lineNumber: number;
  columnNumber: number;
}

export type StackFrameOrError = StackFrame | string;

/**
 * This interface represents the entire stack frame which is composed
 * of stack frames.
 */
export interface StackTrace {
  frames: StackFrameOrError[];
}

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
    const fullMatch = line.match(/at\s+(\w+)\s+\((.+):(\d+):(\d+)\)/);
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
