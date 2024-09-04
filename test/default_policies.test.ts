/// <reference types="chrome"/>
import {
  Message,
  StackFrame,
  StackTrace,
  Violation,
  createViolation,
  isMessage,
} from "../common/common";

import { DefaultPolicyData } from "../common/default-policies";

import { addToAllowList } from "../common/default-policies";

//common constants to use for test cases below
const fakeTimestamp: number = 123456789;

const callingStackFrame: StackFrame = {
  functionName: "src",
  scriptUrl: "path/to/rootcause.js",
  lineNumber: 15,
  columnNumber: 5,
};

const wrapperFunctionStackFrame: StackFrame = {
  functionName: "anotherFunction",
  scriptUrl: "path/to/another.js",
  lineNumber: 20,
  columnNumber: 2,
};

const stackTrace: StackTrace = {
  frames: [
    "Error", // Skipped
    "internalFunction1", // Skipped
    "internalFunction2", // Skipped
    "internalFunction3", // Skipped
    callingStackFrame,
    wrapperFunctionStackFrame,
  ],
};

let res: DefaultPolicyData = {
  HTML: {
    tags: [],
    attrs: [],
    violationFragment: [],
    allowlist: [],
  },
  Script: [],
  URL: [],
};

// Mock this because we DOMPurify doesn't run without a DOM environment.
let sanitizeWithDOMPurify;

describe("addToAllowList function", () => {
  // Calls to Chrome Extension APIs in default_policies.ts
  beforeEach(() => {
    sanitizeWithDOMPurify = jest.fn((s: string) => {
      switch (s) {
        // Values used in our tests.
        case "<p>test</p>":
          return "<p>test</p>";
        case "<img src=x onerror=alert(1)//>":
          return '<img src="x">';
        // Can't predict all string cases-- feel free to add other outputs
        // needed for further test cases!
        default:
          return "SANITIZED BY DOMPURIFY";
      }
    });
    // @ts-ignore
    global.chrome = {
      tabs: {
        // @ts-ignore
        query: (data: any) => Promise.resolve([{ id: 0 }]),
        // @ts-ignore
        sendMessage: jest.fn(
          // This is mocking what is happening in listen.ts
          (_tab_id: number | undefined, message: Message) => {
            if (isMessage(message) && message.type === "getSanitizedInput") {
              const res = sanitizeWithDOMPurify(message.sanitized);
              return Promise.resolve(res);
            }
            return Promise.resolve(undefined);
          },
        ),
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    // @ts-ignore
    delete global.chrome;
  });

  it("add allowed scripts to Script violation allowlist", async () => {
    const scriptViolation: Violation = createViolation(
      "console.log",
      "Script",
      fakeTimestamp,
      stackTrace,
      "www.google.com/about",
    );
    const expected: DefaultPolicyData = {
      HTML: {
        tags: [],
        attrs: [],
        violationFragment: [],
        allowlist: [],
      },
      Script: ["console.log"],
      URL: [],
    };
    expect(await addToAllowList(scriptViolation, res)).toStrictEqual(expected);
    expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(0);
    expect(sanitizeWithDOMPurify).toHaveBeenCalledTimes(0);
  });

  it("add domains to URL violation allowlist", async () => {
    const urlViolation: Violation = createViolation(
      "https://www.google.com/about",
      "URL",
      fakeTimestamp,
      stackTrace,
      "www.google.com/about",
    );
    const expected: DefaultPolicyData = {
      HTML: {
        tags: [],
        attrs: [],
        violationFragment: [],
        allowlist: [],
      },
      Script: ["console.log"],
      URL: ["https://www.google.com"],
    };
    expect(await addToAllowList(urlViolation, res)).toStrictEqual(expected);
    expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(0);
    expect(sanitizeWithDOMPurify).toHaveBeenCalledTimes(0);
  });

  it("add tags and attributes to HTML violation allowlists", async () => {
    const htmlViolation: Violation = createViolation(
      "<img src=x onerror=alert(1)//>",
      "HTML",
      fakeTimestamp,
      stackTrace,
      "www.google.com/about",
    );
    const expected: DefaultPolicyData = {
      HTML: {
        tags: [],
        attrs: ["onerror"],
        violationFragment: ["<img src=x onerror=alert(1)//>"],
        allowlist: [],
      },
      Script: ["console.log"],
      URL: ["https://www.google.com"],
    };
    expect(await addToAllowList(htmlViolation, res)).toStrictEqual(expected);
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(0, {
      type: "getSanitizedInput",
      sanitized: "<img src=x onerror=alert(1)//>",
    });
    expect(sanitizeWithDOMPurify).toHaveBeenCalledWith(
      "<img src=x onerror=alert(1)//>",
    );
  });
});
