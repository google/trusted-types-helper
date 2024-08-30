import { DefaultPolicyData, Violation } from "./common";

export function organizeDefaultPolicyData(
  result: any,
  inspectedTabId: number,
): DefaultPolicyData {
  var defaultPolicyData: DefaultPolicyData = {
    HTML: [],
    Script: [],
    URL: [],
  };
  for (const cluster of result[inspectedTabId]) {
    defaultPolicyData = addToAllowList(
      cluster.clusteredViolations[0],
      defaultPolicyData,
    );
  }
  return defaultPolicyData;
}

export function addToAllowList(
  violation: Violation,
  defaultPolicy: DefaultPolicyData,
): DefaultPolicyData {
  switch (violation.type) {
    case "HTML":
      defaultPolicy.HTML.push(violation.data);
      break;
    case "Script":
      defaultPolicy.Script.push(violation.data);
      break;
    case "URL":
      defaultPolicy.URL.push(violation.data);
      break;
    default:
      console.error(`Unknown violation type: ${violation.type}`);
  }
  return defaultPolicy;
}
