import { StackFrame, StackTrace } from "../common/common";
import { parseStackTrace } from "../common/stack_trace";

const stackFrame1: StackFrame = {
  functionName: "getStackTrace",
  scriptUrl: "content.js",
  lineNumber: 82,
  columnNumber: 15,
};

const stackFrame2: StackFrame = {
  functionName: "createMessage",
  scriptUrl: "content.js",
  lineNumber: 123,
  columnNumber: 19,
};

const stackFrame3: StackFrame = {
  functionName: "createHTML",
  scriptUrl: "content.js",
  lineNumber: 92,
  columnNumber: 28,
};

test("parse stack trace returns expected StackTrace", () => {
  const stack: string =
    "Error\n  at getStackTrace (content.js:82:15)\n  at createMessage (content.js:123:19)\n  at createHTML (content.js:92:28)\n  at https://www.wikipedia.org/portal/wikipedia.org/assets/js/index-24c3e2ca18.js:1:10639";

  const stackFrame4: StackFrame = {
    scriptUrl:
      "www.wikipedia.org/portal/wikipedia.org/assets/js/index-24c3e2ca18.js",
    lineNumber: 1,
    columnNumber: 10639,
  };

  const parsedStack: StackTrace = {
    frames: ["Error", stackFrame1, stackFrame2, stackFrame3, stackFrame4],
  };

  expect(parseStackTrace(stack)).toStrictEqual(parsedStack);
});

test("parse empty stack trace", () => {
  const emptyStack = "";

  // Expect an empty StackTrace object to be returned
  const parsedStack: StackTrace = {
    frames: [""],
  };

  expect(parseStackTrace(emptyStack)).toStrictEqual(parsedStack);
});

test("parse stack trace handles function names with periods", () => {
  const stack: string =
    "Error\n  at getStackTrace (content.js:82:15)\n  at createMessage (content.js:123:19)\n  at get.nested.function (content.js:82:15)\n";

  const stackFrame4: StackFrame = {
    functionName: "get.nested.function", // Notice the period in the function name
    scriptUrl: "content.js",
    lineNumber: 82,
    columnNumber: 15,
  };

  const parsedStack: StackTrace = {
    frames: ["Error", stackFrame1, stackFrame2, stackFrame3, stackFrame4],
  };

  expect(parseStackTrace(stack));
});

test("parse stack trace handles function names with special characters", () => {
  const stack: string =
    "Error\n  at getStackTrace (content.js:82:15)\n  at createMessage (content.js:123:19)\n  at $ (https://code.jquery.com/jquery-3.7.1.min.js:2:7753)\n";

  const stackFrame4: StackFrame = {
    functionName: "$", // Notice this symbol
    scriptUrl: "https://code.jquery.com/jquery-3.7.1.min.js",
    lineNumber: 2,
    columnNumber: 7753,
  };

  const parsedStack: StackTrace = {
    frames: ["Error", stackFrame1, stackFrame2, stackFrame3, stackFrame4],
  };

  expect(parseStackTrace(stack));
});
