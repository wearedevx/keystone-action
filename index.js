const fs = require('fs');
const core = require('@actions/core');
const github = require('@actions/github');

(() => {
  // `who-to-greet` input defined in action metadata file
  const keystone_slot = core.getInput('keystone_slot');
  let files, secrets;

  try {
    const message = JSON.parse(keystone_slot)
    files = message.files
    secrets = message.secrets
  } catch (err) {
    core.setFailed(err.message);
    return
  }

  secrets.forEach(({ label, value }) => {
    core.setSecret(value);
    core.exportVariable(label, value);
  })

  files.forEach(({ path, content }) => {
    fs.writeFileSync(path, content, { mode: 0o644 })
  })

  const payload = JSON.stringify(github.context, undefined, 2)
  console.log(`The event payload: ${payload}`);
})()

