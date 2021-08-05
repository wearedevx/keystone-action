const fs = require("fs");
const path = require("path");
const core = require("@actions/core");

const yaml = require("yaml");

// const github = require('@actions/github');
// const unescape = require("./unescape");

function getKeystoneFile() {
  const contents = fs.readFileSync(path.join(process.cwd(), "keystone.yml"), "utf-8")

  return yaml.parse(contents)
}

function isSecretMissing(secretDefininition, secrets) {
  let result = false 

  if (secretDefininition.required) {
    const s = secrets.find(({ label }) => label === secretDefininition.key)

    if (s === null || s === undefined) {
      result = true
    } else if (!s.value) {
      result = true
    }
  }
  
  return result
}

function isFileMissing(fileDefinition, files) {
  let result = false

  if (secretDefinition.strict) {
    const s = files.find(({ path }) => path == fileDefinition.path)

    if (s === null || s === undefined) {
      result = true
    } else if (s.content === "") {
      result = true
    }
  }

  return result
}

function missingSecrets(secretDefinitions, secrets) {
  return secretDefinitions.filter(sd => isSecretMissing(sd, secrets))
    .map(sd => sd.key)
}

function missingFiles(fileDefinitions, files) {
  return fileDefinitions.filter(fd => isFileMissing(fd, files))
    .map(fd => fd.path)
}

function decodeKeystoneSlots() {
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
    return { error: err } 
   }

  return { files, secrets, error: null }
}

(() => {
  let { files, secrets, error } = decodeKeystoneSlots();
  
  if (error != null) {
    core.setFailed(error);
    return
  }

  const ksFile = getKeystoneFile();
  let missing;

  if (missing = missingSecrets(ksFile.env, secrets) && missing.length) {
    const errorMessage = `Some required secrets are missing: ${missing.join(', ')}`; 

    core.setFailed(new Error(errorMessage));
    return
  }

  if (missing = missingFiles(ksFile.files, files) && missing.length) {
    const errorMessage = `Some required files are missing: ${missing.join(', ')}`; 

    core.setFailed(new Error(errorMessage))
    return
  }

  secrets.forEach(({ label, value }) => {
    core.setSecret(value);
    core.exportVariable(label, value);
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

