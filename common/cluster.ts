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

function createOrUpdateCluster(
  existingClusters: TrustedTypesViolationCluster[],
  newViolation: Violation,
): TrustedTypesViolationCluster[] {
  // Check if a matching cluster exists
  for (const cluster of existingClusters) {
    if (belongsToCluster(cluster, newViolation)) {
      cluster.clusteredViolations.push(newViolation);
      cluster.metadata.count++;
      cluster.metadata.lastOccurrence = new Date();
      return existingClusters;
    }
  }

  // If no match, create a new cluster
  const newCluster: TrustedTypesViolationCluster = {
    clusteredViolations: [newViolation],
    metadata: {
      id: generateUniqueId(),
      rootCause: "", // TODO
      count: 1,
      firstOccurrence: new Date(),
      lastOccurrence: new Date(),
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
  // TODO(mayrarobles)
  return false;
}
