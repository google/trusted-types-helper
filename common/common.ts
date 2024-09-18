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
    const firstValidFrame =
      stackTrace.frames[NUMBER_OF_EXTENSION_INTERNAL_STACK_FRAMES];
    if (typeof firstValidFrame !== "string") {
      baseViolation.sourceFile = firstValidFrame.scriptUrl;
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
  // last time we've seen this violation, in milliseconds since epoch
  lastOccurrence: number;
  // first time we saw this violation, in milliseconds since epoch
  firstOccurrence: number;
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

export interface ViolationsByTypes {
  HTML: Array<Violation>;
  Script: Array<Violation>;
  URL: Array<Violation>;
}

export function addViolationByType(
  violation: Violation,
  violationsByTypes: ViolationsByTypes,
): ViolationsByTypes {
  switch (violation.type) {
    case "HTML":
      violationsByTypes.HTML.push(violation);
      break;
    case "Script":
      violationsByTypes.Script.push(violation);
      break;
    case "URL":
      violationsByTypes.URL.push(violation);
      break;
    default:
      console.error(`Unknown violation type: ${violation.type}`);
  }
  return violationsByTypes;
}

/**
 * Defines the structure of default policy allowlists.
 *
 * @interface DefaultPolicyData
 * @property {Array<string>} HTML An allowlist for HTML violations.
 * @property {Array<string>} Script An allowlist for Script violations.
 * @property {Array<string>} URL An allowlist for URL violations.
 */
export interface DefaultPolicyData {
  HTML: Array<string>;
  Script: Array<string>;
  URL: Array<string>;
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

export interface DefaultPoliciesCommand {
  type: "defaultPolicies";
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
  | DefaultPoliciesCommand
  | DefaultPolicyWarningMessage
  | GetDefaultPolicyWarningCommand;

// TODO: Change this if the type above is updated.
export function isMessage(message: any): message is Message {
  if (typeof message !== "object" || message === null) {
    return false;
  }

  switch (message.type) {
    case "violationFound":
      return "violationData" in message;
    case "listViolations":
    case "listViolationsByCluster":
    case "listViolationsByType":
    case "defaultPolicies":
      return "inspectedTabId" in message;
    case "defaultPolicyWarning":
      return "defaultPolicyWarning" in message;
    case "getDefaultPolicyWarning":
      return true; // No additional properties to check
    default:
      return false; // Unknown message type
  }
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
