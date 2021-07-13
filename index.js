const fs = require('fs');
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

  files.forEach(({ path, content }) => {
    const dirname = path.dirname(path);

    try {
      fs.mkdirSync(dirname, { recursive: true });
      fs.writeFileSync(path, content, { mode: 0o644 });

      core.info(`Wrote ${path}`);
    } catch (err) {
      core.error(err);
    }
  });
})()

