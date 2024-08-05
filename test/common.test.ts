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
  Violation,
  StackTrace,
  StackFrame,
  createViolation,
} from "../common/common";
const fakeTimestamp: number = 123456789;

const innerHTMLcallingStackFrame: StackFrame = {
  functionName: "innerHTML",
  scriptUrl: "path/to/rootcause.js",
  lineNumber: 10,
  columnNumber: 1,
};

const wrapperFunctionStackFrame: StackFrame = {
  functionName: "anotherFunction",
  scriptUrl: "path/to/another.js",
  lineNumber: 20,
  columnNumber: 2,
};

const innerHTMLStackTrace: StackTrace = {
  frames: [
    "Error", // Skipped
    "internalFunction1", // Skipped
    "internalFunction2", // Skipped
    "internalFunction3", // Skipped
    innerHTMLcallingStackFrame,
    wrapperFunctionStackFrame,
  ],
};

const incompleteStackTrace: StackTrace = {
  frames: [
    "Error", // Skipped
    "internalFunction1", // Skipped
    "internalFunction2", // Skipped
    "internalFunction3", // Skipped
  ],
};

const rootCauseFrameIsErrorStackTrace: StackTrace = {
  frames: [
    "Error", // Skipped
    "internalFunction1", // Skipped
    "internalFunction2", // Skipped
    "internalFunction3", // Skipped
    "RootCause",
  ],
};

describe("Violation's source file attribute logic", () => {
  it("Gets the script url from the fifth stack frame", () => {
    const innerHTMLViolation: Violation = createViolation(
      "<b>my innerHTML payload</b>",
      "HTML",
      fakeTimestamp,
      innerHTMLStackTrace,
      "www.google.com/start",
    );
    expect(innerHTMLViolation.sourceFile).toBe("path/to/rootcause.js");
  });

  it("Leaves as undefined when there are less than 5 stack frames", () => {
    const violation: Violation = createViolation(
      "<div> adding a div </div>",
      "HTML",
      fakeTimestamp,
      incompleteStackTrace, // Stack trace with only internal functions
      "www.google.com/start",
    );
    expect(violation.sourceFile).toBe(undefined);
  });

  it("Leaves as undefined when the type of the root cause stack frame is a string", () => {
    const violation: Violation = createViolation(
      "www.myurl.com",
      "HTML",
      fakeTimestamp,
      rootCauseFrameIsErrorStackTrace, // Stack trace with fifth stack frame as string
      "www.google.com/start",
    );
    expect(violation.sourceFile).toBe(undefined);
  });
});
