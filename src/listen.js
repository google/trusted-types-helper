self.addEventListener('message', msg => {
  console.log("This is from listen: " + JSON.stringify(msg));
  chrome.runtime.sendMessage(msg.data);
});
