const fs = require('fs');
const path = require('path');
const core = require('@actions/core');
// const github = require('@actions/github');

(() => {
  const keystone_slot = core.getInput(`keystone_slot`);
  let files, secrets;

  try {
    const message = JSON.parse(keystone_slot);
    files = message.files;
    secrets = message.secrets;
  } catch (err) {
    core.setFailed(err.message);
    return;
  }

  secrets.forEach(({ label, value }) => {
    core.setSecret(value);
    core.exportVariable(label, value);
    core.info(`Loaded ${label}`);
  })

  files.forEach((file) => {
    const dirname = path.dirname(file.path);
    const buffer = Buffer.from(file.content, 'base64')

    try {
      fs.mkdirSync(dirname, { recursive: true });
      fs.writeFileSync(file.path, buffer, { mode: 0o644, encoding: 'utf8' });

      // also set the content of the file a secret
      core.setSecret(buffer.toString('utf8'));

      core.info(`Wrote ${file.path}`);
    } catch (err) {
      core.error(err);
    }
  });
})()

