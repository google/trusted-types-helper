/**
 * Copyright 2025 Google LLC
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

/// <reference types="chrome"/>

import { HTMLData, TrustedTypesViolationCluster, Violation } from "./common";

import { parseHTML } from "linkedom";

async function sanitize(input: string): Promise<string> {
  console.log("sanitize() run");
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  console.log("default-policies.ts: tab id: " + tab.id);
  const response = await chrome.tabs.sendMessage(tab.id!, {
    type: "getSanitizedInput",
    sanitized: input,
  });
  // do something with response here, not outside the function
  console.log("default-policies.ts: response: " + response + "\n");
  console.log("sanitize end");
  return response;
}

async function organizeDefaultPolicyData(
  violations: TrustedTypesViolationCluster[],
): Promise<DefaultPolicyData> {
  var defaultPolicyData: DefaultPolicyData = DefaultPolicyData.empty();
  for (const cluster of violations) {
    defaultPolicyData = await addToAllowList(
      cluster.clusteredViolations[0],
      defaultPolicyData,
    );
  }
  return defaultPolicyData;
}

// Given violation information, organize necessary metadata
// to generate default policies based on the violation type
export async function addToAllowList(
  violation: Violation,
  defaultPolicy: DefaultPolicyData,
): Promise<DefaultPolicyData> {
  switch (violation.type) {
    case "HTML":
      var unsanitizedTags: Array<string> = [];
      var unsanitizedAttrs: Array<string> = [];
      var sanitizedTags: Array<string> = [];
      var sanitizedAttrs: Array<string> = [];
      try {
        parseHTMLContent(violation.data, unsanitizedTags, unsanitizedAttrs);
        let clean = violation.data;
        await sanitize(clean)
          .then((input) => {
            clean = input;
          })
          .catch((error) => {
            console.error(error);
          });
        console.log("sanitized input in addToAllowList: " + clean);
        parseHTMLContent(clean, sanitizedTags, sanitizedAttrs);
      } catch (error) {
        console.error(`HTML not parsable`);
        console.log(error);
        // Add to allowlist
        defaultPolicy.HTML.allowlist.push(violation.data);
      }

      // Diff on unsanitized results and satnitized results
      defaultPolicy.HTML.tags = unsanitizedTags.filter(
        (item: any) => !sanitizedTags.includes(item),
      );
      defaultPolicy.HTML.attrs = unsanitizedAttrs.filter(
        (item: any) => !sanitizedAttrs.includes(item),
      );

      // Add HTML input string to display to users later
      //todo limit the length = 30 characters
      defaultPolicy.HTML.violationFragment.push(violation.data);
      break;
    case "Script":
      defaultPolicy.Script.push(violation.data);
      break;
    case "URL":
      if (URL.canParse(violation.data)) {
        const url = new URL(violation.data);
        defaultPolicy.URL.push(`${url.protocol}//${url.hostname}`);
      } else {
        defaultPolicy.URL.push(violation.data);
      }
      break;
    default:
      console.error(`Unknown violation type: ${violation.type}`);
  }
  return defaultPolicy;
}

function parseHTMLContent(
  content: string | undefined,
  tags: Array<string>,
  attrs: Array<string>,
) {
  const { document } = parseHTML(content);
  document.querySelectorAll("*").forEach((element) => {
    const tag = element.tagName;
    if (!tags.includes(tag)) {
      tags.push(tag);
    }
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i].name;
      if (!attrs.includes(attr)) {
        attrs.push(attr);
      }
    }
  });
}

/**
 * Organizes metadata to generate default policies.
 *
 * TODO: There are no class-level methods on here, only statics, so maybe we
 * should refactor into interfaces.
 *
 * @class DefaultPolicyData
 * @param {any} clusters A list of violations the page contains.
 * @property {HTMLData} HTML A metadata necessary to generate default policies.
 * @property {Array<string>} Script A list of allowed scripts.
 * @property {Array<string>} URL A list of allowed URls or domains.
 */
export class DefaultPolicyData {
  HTML: HTMLData;
  Script: Array<string>;
  URL: Array<string>;

  static async init(
    clusters: TrustedTypesViolationCluster[],
  ): Promise<DefaultPolicyData> {
    const computedDefaultPolicyData = await organizeDefaultPolicyData(clusters);
    console.log(
      "organizeDefaultPolicyData() finished with: " +
        JSON.stringify(computedDefaultPolicyData),
    );
    return new DefaultPolicyData(computedDefaultPolicyData);
  }

  /**
   * To make testing and other initializations easier.
   * @returns An empty structure
   */
  static empty(): DefaultPolicyData {
    return {
      HTML: {
        tags: [],
        attrs: [],
        violationFragment: [],
        allowlist: [],
      },
      Script: [],
      URL: [],
    };
  }

  /**
   * TODO: Maybe we need this for rehydration? We'll clean this up later.
   * @param data A JSON that looks almost the same as this class.
   */
  constructor(data: DefaultPolicyData) {
    this.HTML = data.HTML;
    this.Script = data.Script;
    this.URL = data.URL;
    console.log(
      "actual default policy construtor content: " + JSON.stringify(this),
    );
  }
}
