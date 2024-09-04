/// <reference types="chrome"/>

import { HTMLData, Message, Violation } from "./common";

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
  violations: any,
): Promise<DefaultPolicyData> {
  var defaultPolicyData: DefaultPolicyData = {
    HTML: {
      tags: [],
      attrs: [],
      violationFragment: [],
      allowlist: [],
    },
    Script: [],
    URL: [],
  };
  for (const cluster of violations) {
    await addToAllowList(
      cluster.clusteredViolations[0],
      defaultPolicyData,
    ).then((input) => {
      defaultPolicyData = input;
    });
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

  static async init(clusters: any): Promise<DefaultPolicyData> {
    var data: DefaultPolicyData = {
      HTML: {
        tags: [],
        attrs: [],
        violationFragment: [],
        allowlist: [],
      },
      Script: [],
      URL: [],
    };
    await organizeDefaultPolicyData(clusters).then((input) => {
      console.log(
        "organizeDefaultPolicyData() in Default policy class is called",
      );
      data = input;
    });
    console.log("data for dp: " + JSON.stringify(data));
    return new DefaultPolicyData(data);
  }

  constructor(data: DefaultPolicyData) {
    this.HTML = data.HTML;
    this.Script = data.Script;
    this.URL = data.URL;
    console.log(
      "actual default policy construtor content: " + JSON.stringify(this),
    );
  }
}
