/**
 * @fileoverview Description of this file.
 */

// Alert when there is an error in case the user already has a default policy,
// the extension policy may be set first and when the user's default policy
// is set an error occurs.
addEventListener("error", (event) => {
  if (error.name == 'TypeError' && error.message.includes('Policy with name "default" already exists')) {
    alert("Failure when Trusted Types Helper extension tried to set a default policy.", error);
  }
});

try {
  self.trustedTypes.createPolicy('default', {
    createHTML: (string => {
      //TODO implement default policy processing/sanitizing
      console.log(string);

      const htmlViolation = { type: 'HTML',
                               data : string,
                               timestamp: Date.now()
                              };
      const msg = {
        type: 'violation',
        violation: htmlViolation
      };

      window.postMessage(msg, '*');
      return string;
    })
  });
} catch(error) {
  console.error('Trusted Types Default Policy Creation Failed:', error.message);
  const msg = {
    type: 'defaultPolicyCreationFailed',
    defaultPolicyCreationFailed: Date.now()
  }
  window.postMessage(msg, '*');
}


// When page reloads, these lines will get executed
const msg = {
  type: 'defaultPolicySet',
  defaultPolicySet: Date.now()
}
window.postMessage(msg, '*');
