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

