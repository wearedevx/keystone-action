const fs = require("fs");
const path = require("path");
const core = require("@actions/core");
// const github = require('@actions/github');

const R = /\\([^$])/gm

function unescape(value) {
  const origLength = value.length
  let escaped = value
  let escapedLength = escaped.length

  const matches = value.matchAll(R)

  for (let m of matches) {
    let [whole, replacement] = m

    if (replacement == "n") {
       replacement = "\n"
    } else if (value == "r") {
      replacement = "\r"
    }

    const diff = origLength - escapedLength;
    const i = m.index - diff

    escaped = escaped.substring(0, i)
      + replacement
      + escaped.substring(i + whole.length)

    escapedLength = escaped.length
  }

  return escaped
}

(() => {
  const keystone_slot_1 = core.getInput(`keystone_slot_1`);
  const keystone_slot_2 = core.getInput(`keystone_slot_2`);
  const keystone_slot_3 = core.getInput(`keystone_slot_3`);
  const keystone_slot_4 = core.getInput(`keystone_slot_4`);
  const keystone_slot_5 = core.getInput(`keystone_slot_5`);

  const keystone_slot =
    keystone_slot_1 +
    keystone_slot_2 +
    keystone_slot_3 +
    keystone_slot_4 +
    keystone_slot_5;

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
    const unescapedValue = unescape(value);

    core.setSecret(unescapedValue);
    core.exportVariable(label, unescapedValue);
    core.info(`Loaded ${label}`);
  });

  files.forEach((file) => {
    const dirname = path.dirname(file.path);
    const buffer = Buffer.from(file.content, "base64");

    try {
      fs.mkdirSync(dirname, { recursive: true });
      fs.writeFileSync(file.path, buffer, { mode: 0o644, encoding: "utf8" });

      // also set the content of the file a secret
      core.setSecret(buffer.toString("utf8"));

      core.info(`Wrote ${file.path}`);
    } catch (err) {
      core.error(err);
    }
  });
})();

