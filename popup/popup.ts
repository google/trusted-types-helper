import { Message } from "../common/common";

const onOffSwitchInput = document.getElementById(
  "onOffSwitch",
) as HTMLInputElement;
const onOffSwitch = document.getElementById("on-off");

// Only add interactivity if we know this element exists
if (onOffSwitchInput && onOffSwitch) {
  chrome.runtime.sendMessage({ type: "getOnOffSwitchState" }, (response) => {
    console.log(
      `Received current state of the toggle button: ${JSON.stringify(response)}`,
    );
    onOffSwitchInput.disabled = false;
    onOffSwitchInput.checked = response.onOffState;
  });

  onOffSwitch.addEventListener("click", () => {
    console.log("button clicked");
    const message = { type: "toggleOnOffSwitch" } as Message;
    chrome.runtime.sendMessage(message);
  });
}
