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

export interface DefaultPolicyData {
  wasSet?: Date;
  creationFailed?: Date;
  overwriteFailed?: Date;
}

export type ViolationType = "HTML" | "Script" | "URL";

// TODO: Update the type guard below if this type is updated
export class Violation {
  private data: string;
  private type: ViolationType;
  private timestamp: Date;

  public constructor(data: string, type: ViolationType, timestamp: Date) {
    this.data = data;
    this.type = type;
    this.timestamp = timestamp;
  }

  public getData(): string {
    return this.data;
  }

  public getType(): ViolationType {
    return this.type;
  }

  public getTimestamp(): Date {
    return this.timestamp;
  }
}

// TODO: Update this type guard if the type above is updated
export function isViolation(obj: any): obj is Violation {
  return (
    obj &&
    obj.data?.type === "string" &&
    obj.timestamp instanceof Date &&
    obj.type?.type === "string" &&
    ["HTML", "Script", "URL"].includes(obj.type)
  );
}

export type ViolationDataType = {
  [key in ViolationType]: Array<Violation>;
};

export class Violations implements ViolationDataType {
  public HTML: Array<Violation> = [];
  public Script: Array<Violation> = [];
  public URL: Array<Violation> = [];

  constructor() {}

  public addViolation(violation: Violation) {
    switch (violation.getType()) {
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
        console.error(`Unknown violation type: ${violation.getType()}`);
    }
  }
}

// TODO: Change the type guard below if this type is updated
export interface Message {
  type:
    | "violationFound"
    | "listViolations"
    | "defaultPolicySet"
    | "defaultPolicyCreationFailed"
    | "defaultPolicyOverwriteFailed"
    | "getDefaultPolicyData";
  violation?: Violation;
  defaultPolicySet?: Date;
  defaultPolicyCreationFailed?: Date;
  defaultPolicyOverwriteFailed?: Date;
  inspectedTabId?: number;
}

// TODO: Change this if the type above is updated.
export function isMessage(obj: any): obj is Message {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "type" in obj &&
    typeof obj.type === "string" &&
    [
      "violationFound",
      "listViolations",
      "defaultPolicySet",
      "defaultPolicyCreationFailed",
      "defaultPolicyOverwriteFailed",
      "getDefaultPolicyData",
    ].includes(obj.type) &&
    ("violation" in obj
      ? obj.violation === undefined || isViolation(obj.violation)
      : true) &&
    ("defaultPolicySet" in obj
      ? obj.defaultPolicySet instanceof Date ||
        obj.defaultPolicySet === undefined
      : true) &&
    ("defaultPolicyCreationFailed" in obj
      ? obj.defaultPolicyCreationFailed instanceof Date ||
        obj.defaultPolicyCreationFailed === undefined
      : true) &&
    ("defaultPolicyOverwriteFailed" in obj
      ? obj.defaultPolicyOverwriteFailed instanceof Date ||
        obj.defaultPolicyOverwriteFailed === undefined
      : true) &&
    ("inspectedTabId" in obj
      ? typeof obj.inspectedTabId === "number" ||
        obj.inspectedTabId === undefined
      : true)
  );
}
