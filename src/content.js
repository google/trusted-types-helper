/**
 * @fileoverview Description of this file.
 */
// Register default policy
self.trustedTypes.createPolicy('default', {
  createHTML: (string => {
    //TODO implement default policy processing/sanitizing
    console.log(string);
    window.postMessage({ "payload": string }, '*');
    return string;
  })
});
