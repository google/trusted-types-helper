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
    overwriteFailed ?: Date;
};

export type ViolationType = 'HTML' | 'Script' | 'URL';

export class Violation {
    private data: string;
    private type: ViolationType;
    private timestamp: Date;

    public constructor(data: string, type: ViolationType, timestamp: Date) {
        this.data = data;
        this.type = type;
        this.timestamp = timestamp;
    }

    public getData() { return this.data; }

    public getType() { return this.type; }

    public getTimestamp() { return this.timestamp; }
}

type ViolationDataType = {
    [key in ViolationType] : Array<Violation>;
};

export class Violations implements ViolationDataType {
    public HTML: Array<Violation> = [];
    public Script: Array<Violation> = [];
    public URL: Array<Violation> = [];

    constructor () {}
}

export interface Message {
    type: 'violation' | 'listViolations' | 'defaultPolicySet' | 'defaultPolicyCreationFailed' |
        'defaulPolicyOverwriteFailed' | 'getDefaultPolicyData';
    violation?: Violation;
    defaultPolicySet?: Date;
    defaultPolicyCreationFailed?: Date;
    defaulPolicyOverwriteFailed?: Date;
  }

