const onOffSwitch = document.getElementById("on-off");

if (onOffSwitch) {
  // check if it's null
  onOffSwitch.addEventListener("click", async () => {
    console.log("button clicked");
    const message = { action: "ON/OFF clicked" };
    chrome.runtime.sendMessage(message);
  });
}
