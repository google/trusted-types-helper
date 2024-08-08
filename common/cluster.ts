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
import { TrustedTypesViolationCluster, Violation } from "./common";
import {
  isStackFrame,
  getFirstValidStackFrame,
  getRootCause,
} from "../common/stack_trace";

export function createOrUpdateCluster(
  existingClusters: TrustedTypesViolationCluster[],
  newViolation: Violation,
): TrustedTypesViolationCluster[] {
  // Check if a matching cluster exists
  for (const cluster of existingClusters) {
    if (belongsToCluster(cluster, newViolation)) {
      cluster.clusteredViolations.push(newViolation);
      cluster.metadata.count++;
      cluster.metadata.lastOccurrence = Date.now();
      cluster.metadata.rootCause = getRootCause(newViolation.stackTrace);
      return existingClusters;
    }
  }

  // If no match, create a new cluster
  const newCluster: TrustedTypesViolationCluster = {
    clusteredViolations: [newViolation],
    metadata: {
      id: generateUniqueId(),
      rootCause: getRootCause(newViolation.stackTrace),
      count: 1,
      firstOccurrence: Date.now(),
      lastOccurrence: Date.now(),
    },
  };

  return [...existingClusters, newCluster];
}

function generateUniqueId(): string {
  // Get the current timestamp in milliseconds
  const timestamp = Date.now().toString();

  // Generate a random hexadecimal string
  const randomHex = Math.random().toString(16).slice(2); // Remove '0.' prefix

  // Combine timestamp and random hex for a unique ID
  return `${timestamp}-${randomHex}`;
}

export function belongsToCluster(
  cluster: TrustedTypesViolationCluster,
  violation: Violation,
): boolean {
  // Check if the violation stack trace shares the same root cause with the
  // first existing violation in the cluster.
  return haveSameRootCause(violation, cluster.clusteredViolations[0]);
}

/**
 * Checks whether 2 violations come from the same root cause, meaning they
 * share the unsafe call to the DOM sink.
 *
 * @param violation1
 * @param violation2
 * @returns
 */
export function haveSameRootCause(
  violation1: Violation,
  violation2: Violation,
): boolean {
  const stackFrame1 = getFirstValidStackFrame(violation1.stackTrace);
  const stackFrame2 = getFirstValidStackFrame(violation2.stackTrace);

  // Handling when getFirstValidStackFrame returns error
  if (
    stackFrame1 == "No valid first stack frame" ||
    stackFrame2 == "No valid first stack frame"
  ) {
    return false;
  }

  if (isStackFrame(stackFrame1) && isStackFrame(stackFrame2)) {
    // Option 1: Check that the violations have the same violation source file,
    // line number and column number
    return (
      stackFrame1.lineNumber == stackFrame2.lineNumber &&
      stackFrame1.columnNumber == stackFrame2.columnNumber
    );
  } else if (
    typeof stackFrame1 === "string" &&
    typeof stackFrame2 === "string"
  ) {
    // Option 2: Check that the first stack frame is the same
    return stackFrame1 == stackFrame2;
  }

  return false;
}
