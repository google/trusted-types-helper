import {
  StackFrame,
  StackTrace,
  Violation,
  createViolation,
  DefaultPolicyData,
} from "../common/common";

import { addToAllowList } from "../common/default-policies";

const fakeTimestamp: number = 123456789;

const scriptCallingStackFrame: StackFrame = {
  functionName: "src",
  scriptUrl: "path/to/rootcause.js",
  lineNumber: 15,
  columnNumber: 4,
};

const wrapperFunctionStackFrame: StackFrame = {
  functionName: "anotherFunction",
  scriptUrl: "path/to/another.js",
  lineNumber: 20,
  columnNumber: 2,
};

const scriptStackTrace: StackTrace = {
  frames: [
    "Error", // Skipped
    "internalFunction1", // Skipped
    "internalFunction2", // Skipped
    "internalFunction3", // Skipped
    scriptCallingStackFrame,
    wrapperFunctionStackFrame,
  ],
};

describe("defaultPolicy", () => {
  it("check script allowlist", () => {
    var defaultPolicyData: DefaultPolicyData = {
      HTML: [],
      Script: [],
      URL: [],
    };
    const expected: DefaultPolicyData = {
      HTML: [],
      Script: ["console.log"],
      URL: [],
    };
    const scriptViolation: Violation = createViolation(
      "console.log",
      "Script",
      fakeTimestamp,
      scriptStackTrace,
      "www.google.com/start",
    );
    expect(addToAllowList(scriptViolation, defaultPolicyData)).toStrictEqual(
      expected,
    );
  });
});
