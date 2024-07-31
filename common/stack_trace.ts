import { StackTrace, StackFrameOrError } from "./common";

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
