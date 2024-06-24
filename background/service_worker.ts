/// <reference types="chrome"/>
var violations : string[] = [];
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log(msg);
  console.log(sender.tab?.url);
  if (msg.payload) {
    violations.push(msg.payload);
  } else if (msg.command == "listViolations") {
    sendResponse({violations})
  }
});
