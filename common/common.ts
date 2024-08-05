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
import { NUMBER_OF_EXTENSION_INTERNAL_STACK_FRAMES } from "../common/stack_trace";

export type ViolationType = "HTML" | "Script" | "URL";

export interface Violation {
  data: string;
  type: ViolationType;
  timestamp: number;
  stackTrace: StackTrace;
  documentUrl: string;
  sourceFile?: string;
}

export function createViolation(
  data: string,
  type: ViolationType,
  timestamp: number,
  stackTrace: StackTrace,
  documentUrl: string,
): Violation {
  const baseViolation: Violation = {
    data,
    type,
    timestamp,
    stackTrace,
    documentUrl,
  };

  // Get source file from the scriptUrl field of the fifth stack frame in the
  // stack trace, that is, the first stack frame after the four we always skip.
  if (
    stackTrace.frames &&
    stackTrace.frames.length > NUMBER_OF_EXTENSION_INTERNAL_STACK_FRAMES
  ) {
    const lastFrame =
      stackTrace.frames[NUMBER_OF_EXTENSION_INTERNAL_STACK_FRAMES];
    if (typeof lastFrame !== "string") {
      baseViolation.sourceFile = lastFrame.scriptUrl;
    }
  }

  return baseViolation;
}

export interface TrustedTypesViolationCluster {
  clusteredViolations: Violation[];
  metadata: ClusterMetadata;
}

export interface ClusterMetadata {
  // Unique ID for cluster
  id: string;
  // Human readable root cause information
  rootCause: string;
  // How many times we've seen this violation
  count: number;
  // last time we've seen this violation
  lastOccurrence: Date;
  // first time we saw this violation
  firstOccurrence: Date;
}

/**
 * This interface represents the data that can be used to create a violation.
 * Something to note is that it does not contain a stack trace of type StackTrace,
 * instead, it contains a string that needs to be parsed into a StackTrace object
 * to create the Violation object.
 */
export interface ViolationData {
  data: string;
  type: ViolationType;
  timestamp: number;
  unprocessedStackTrace: string;
  documentUrl: string;
}

export function createViolationData(
  data: string,
  type: ViolationType,
  timestamp: number,
  unprocessedStackTrace: string,
  documentUrl: string,
) {
  const violationData: ViolationData = {
    data: data,
    type: type,
    timestamp: timestamp,
    unprocessedStackTrace: unprocessedStackTrace,
    documentUrl: documentUrl,
  };
  return violationData;
}

export type ViolationDataType = {
  [key in ViolationType]: Array<Violation>;
};

export class ViolationsByTypes implements ViolationDataType {
  public HTML: Array<Violation> = [];
  public Script: Array<Violation> = [];
  public URL: Array<Violation> = [];

  constructor() {}

  public addViolation(violation: Violation) {
    switch (violation.type) {
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
        console.error(`Unknown violation type: ${violation.type}`);
    }
  }
}

export interface ViolationError {
  data: string;
  type: ViolationType;
  error: true;
}

export interface ViolationFoundMessage {
  type: "violationFound";
  violationData: ViolationData | ViolationError;
}

export interface ListViolationsCommand {
  type: "listViolations";
  inspectedTabId: number;
}

export interface ListViolationsByClusterCommand {
  type: "listViolationsByCluster";
  inspectedTabId: number;
}

export interface ListViolationsByTypesCommand {
  type: "listViolationsByType";
  inspectedTabId: number;
}

export interface DefaultPolicyWarningMessage {
  type: "defaultPolicyWarning";
  defaultPolicyWarning: DefaultPolicyWarning;
}

export interface GetDefaultPolicyWarningCommand {
  type: "getDefaultPolicyWarning";
}

/**
 * Each message has a specific structure based on its type. These structures
 * are used to represent different types of events, commands, or data transfers.
 */
export type Message =
  | ViolationFoundMessage
  | ListViolationsCommand
  | ListViolationsByClusterCommand
  | ListViolationsByTypesCommand
  | DefaultPolicyWarningMessage
  | GetDefaultPolicyWarningCommand;

// TODO: Change this if the type above is updated.
export function isMessage(obj: any): obj is Message {
  return (
    "type" in obj &&
    (obj.type === "violationFound" ||
      obj.type === "listViolations" ||
      obj.type === "listViolationsByClusters" ||
      obj.type === "listViolationsByTypes" ||
      obj.type === "defaultPolicyWarning" ||
      obj.type === "getDefaultPolicyWarning")
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
 * Defines the structure of a default policy warning.
 *
 * @interface DefaultPolicyWarning
 * @property {string} message The warning message.
 * @property {boolean} isSuccess Indicates whether the operation was successful.
 * @property {number} date The timestamp of the warning.
 */
export interface DefaultPolicyWarning {
  message: string;
  isSuccess: boolean;
  date: number;
}

/**
 * Creates a default policy warning.
 *
 * @param {string} message The warning message.
 * @param {boolean} isSuccess Indicates whether the operation was successful.
 * @param {number} date The timestamp of the warning.
 * @returns {DefaultPolicyWarning} The created default policy warning object.
 */
export function createDefaultPolicyWarning(
  message: string,
  isSuccess: boolean,
): DefaultPolicyWarning {
  const defaultPolicyWarning: DefaultPolicyWarning = {
    message: message,
    isSuccess: isSuccess,
    date: Date.now(),
  };
  return defaultPolicyWarning;
}
