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
  StackFrame,
  StackTrace,
  Violation,
  haveSameRootCause,
} from "../common/common";

//common constants to use for test cases below
const fakeTimestamp: number = 123456789;

const scriptSrcCallingStackFrame: StackFrame = {
  functionName: "src",
  scriptUrl: "path/to/rootcause.js",
  lineNumber: 15,
  columnNumber: 5,
};

const innerHTMLcallingStackFrame: StackFrame = {
  functionName: "innerHTML",
  scriptUrl: "path/to/rootcause.js",
  lineNumber: 10,
  columnNumber: 1,
};

const setAttributeCallingStackFrame: StackFrame = {
  functionName: "setAttribute",
  scriptUrl: "path/to/rootcause.js",
  lineNumber: 8,
  columnNumber: 1,
};

const wrapperFunctionStackFrame: StackFrame = {
  functionName: "anotherFunction",
  scriptUrl: "path/to/another.js",
  lineNumber: 20,
  columnNumber: 2,
};

const externalWrapperfunctionStackFrame: StackFrame = {
  functionName: "anotherFunction",
  scriptUrl: "https://cdn.example-website.com/base.js",
  lineNumber: 20,
  columnNumber: 2,
};

const innerHTMLStackTrace: StackTrace = {
  frames: [
    "Error", // Skipped
    "internalFunction1", // Skipped
    "internalFunction2", // Skipped
    "internalFUnction3", // Skipped
    innerHTMLcallingStackFrame,
    wrapperFunctionStackFrame,
  ],
};

const scriptSrcStackTrace: StackTrace = {
  frames: [
    "Error", // Skipped
    "internalFunction1", // Skipped
    "internalFunction2", // Skipped
    "internalFUnction3", // Skipped
    scriptSrcCallingStackFrame,
    wrapperFunctionStackFrame,
  ],
};

describe("haveSameRootCause function", () => {
  it("clusters identical violations together", () => {
    const innerHtmlViolation: Violation = new Violation(
      "<b>my innerHTML payload</b>",
      "HTML",
      fakeTimestamp,
      innerHTMLStackTrace,
      "www.google.com/start",
    );
    expect(haveSameRootCause(innerHtmlViolation, innerHtmlViolation)).toBe(
      true,
    );
  });

  it("clusters violations with the same stack trace but different payloads", () => {
    const innerHtmlViolation1: Violation = new Violation(
      "<button>adding a button </button>",
      "HTML",
      fakeTimestamp,
      innerHTMLStackTrace,
      "www.google.com/start",
    );
    const innerHtmlViolation2: Violation = new Violation(
      "<div> adding a div </div>",
      "HTML",
      fakeTimestamp,
      innerHTMLStackTrace,
      "www.google.com/start",
    );
    expect(haveSameRootCause(innerHtmlViolation1, innerHtmlViolation2)).toBe(
      true,
    );
  });

  it("clusters violations with the same first stack frame (DOM sink + source file)", () => {
    const scriptSrcViolation1: Violation = new Violation(
      "www.myurl.com",
      "Script",
      fakeTimestamp,
      {
        frames: [
          "Error", // Skipped
          "internalFunction1", // Skipped
          "internalFunction2", // Skipped
          "internalFUnction3", // Skipped
          scriptSrcCallingStackFrame,
          wrapperFunctionStackFrame,
        ],
      },
      "www.google.com/about",
    );
    const scriptSrcViolation2: Violation = new Violation(
      "www.anotherUrlPayload.com",
      "Script",
      fakeTimestamp,
      {
        frames: [
          "Error", // Skipped
          "internalFunction1", // Skipped
          "internalFunction2", // Skipped
          "internalFUnction3", // Skipped
          scriptSrcCallingStackFrame,
          externalWrapperfunctionStackFrame,
        ],
      },
      "www.google.com/start",
    );
    expect(haveSameRootCause(scriptSrcViolation1, scriptSrcViolation2)).toBe(
      true,
    );
  });

  it("clusters violations with the same stack trace on different document URLs", () => {
    const innerHTMLStackTrace: StackTrace = {
      frames: [
        "Error", // Skipped
        "internalFunction1", // Skipped
        "internalFunction2", // Skipped
        "internalFUnction3", // Skipped
        innerHTMLcallingStackFrame,
        wrapperFunctionStackFrame,
      ],
    };
    const innerHtmlViolation1: Violation = new Violation(
      "<button>adding a button </button>",
      "HTML",
      fakeTimestamp,
      innerHTMLStackTrace,
      "www.google.com/start",
    );
    const innerHtmlViolation2: Violation = new Violation(
      "<div> adding a div </div>",
      "HTML",
      fakeTimestamp,
      innerHTMLStackTrace,
      "www.google.com/about",
    );

    expect(haveSameRootCause(innerHtmlViolation1, innerHtmlViolation2)).toBe(
      true,
    );
  });

  it("doesn't cluster violations with different initial stack frames", () => {
    const setAttributeViolation: Violation = new Violation(
      "www.myurl.com",
      "HTML",
      fakeTimestamp,
      {
        frames: [
          "Error", // Skipped
          "internalFunction1", // Skipped
          "internalFunction2", // Skipped
          "internalFunction3", // Skipped
          setAttributeCallingStackFrame,
          wrapperFunctionStackFrame,
        ],
      },
      "www.google.com/about",
    );
    const innerHtmlViolation: Violation = new Violation(
      "www.myurl.com",
      "HTML",
      fakeTimestamp,
      {
        frames: [
          "Error", // Skipped
          "internalFunction1", // Skipped
          "internalFunction2", // Skipped
          "internalFUnction3", // Skipped
          innerHTMLcallingStackFrame,
          wrapperFunctionStackFrame,
        ],
      },
      "www.google.com/about",
    );

    expect(haveSameRootCause(innerHtmlViolation, setAttributeViolation)).toBe(
      false,
    );
  });

  it("doesn't cluster violations with different ViolationTypes", () => {
    const innerHtmlViolationWithUrlPayload: Violation = new Violation(
      "www.myurl.com",
      "HTML",
      fakeTimestamp,
      innerHTMLStackTrace,
      "www.google.com/start",
    );
    const scriptSrcViolation: Violation = new Violation(
      "www.myurl.com",
      "Script",
      fakeTimestamp,
      scriptSrcStackTrace,
      "www.google.com/about",
    );
    expect(
      haveSameRootCause(scriptSrcViolation, innerHtmlViolationWithUrlPayload),
    ).toBe(false);
  });

  it("doesn't cluster violations with same function name but differnt columnn/line numbers", () => {
    const anotherSetAttributeCallingStackFrame: StackFrame = {
      functionName: "setAttribute",
      scriptUrl: "path/to/rootcause.js",
      lineNumber: 25,
      columnNumber: 5,
    };
    const setAttributeViolation1: Violation = new Violation(
      "www.myurl.com",
      "Script",
      fakeTimestamp,
      {
        frames: [
          "Error", // Skipped
          "internalFunction1", // Skipped
          "internalFunction2", // Skipped
          "internalFUnction3", // Skipped
          setAttributeCallingStackFrame,
          wrapperFunctionStackFrame,
        ],
      },
      "www.google.com/about",
    );
    const setAttributeViolation2: Violation = new Violation(
      "www.myurl.com",
      "Script",
      fakeTimestamp,
      {
        frames: [
          "Error", // Skipped
          "internalFunction1", // Skipped
          "internalFunction2", // Skipped
          "internalFUnction3", // Skipped
          anotherSetAttributeCallingStackFrame,
          wrapperFunctionStackFrame,
        ],
      },
      "www.google.com/about",
    );
    expect(
      haveSameRootCause(setAttributeViolation1, setAttributeViolation2),
    ).toBe(false);
  });
});
