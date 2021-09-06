const fs = require("fs");
const path = require("path");
const core = require("@actions/core");

const yaml = require("yaml");
const gitignore = require("./gitignore");

/**
 * @typedef {import("./keystone-file.js").KeystoneFile} KeystoneFile
 * @typedef {import("./keystone-file.js").EnvKey} EnvKey
 * @typedef {import("./keystone-file.js").FileKey} FileKey
 */

/**
 * @typedef {Object} Secret
 * @property {string} label
 * @property {string} value
 */

/**
 * @typedef {Object} File
 * @property {string} path
 * @property {string} content
 */

/**
 * @returns {KeystoneFile}
 */
function getKeystoneFile() {
  const contents = fs.readFileSync(
    path.join(process.cwd(), "keystone.yaml"),
    "utf-8"
  );

  return yaml.parse(contents);
}

/**
 * @param {EnvKey} secretDefininition
 * @param {Secret[]} secrets
 *
 * @returns {bool}
 */
function isSecretMissing(secretDefininition, secrets) {
  let result = false;

  if (secretDefininition.strict) {
    const s = secrets.find(({ label }) => label === secretDefininition.key);

    if (s === null || s === undefined) {
      result = true;
    } else if (!s.value) {
      result = true;
    }
  }

  return result;
}

/**
 * @param {FileKey} fileDefinition
 * @param {File[]} files
 *
 * @returns {bool}
 */
function isFileMissing(fileDefinition, files) {
  let result = false;

  if (fileDefinition.strict) {
    const s = files.find(({ path }) => path == fileDefinition.path);

    if (s === null || s === undefined) {
      result = true;
    } else if (s.content === "") {
      result = true;
    }
  }

  return result;
}

/**
 * @param {EnvKey[]} secretDefinitions
 * @param {Secret[]} secrets
 *
 * @returns {string[]}
 */
function missingSecrets(secretDefinitions, secrets) {
  return secretDefinitions
    .filter((sd) => isSecretMissing(sd, secrets))
    .map((sd) => sd.key);
}

/**
 * @param {FileKey[]} fileDefinitions
 * @param {File[]} files
 *
 * @returns {string[]}
 */
function missingFiles(fileDefinitions, files) {
  return fileDefinitions
    .filter((fd) => isFileMissing(fd, files))
    .map((fd) => fd.path);
}

/**
 * @returns {files: File[], secrets: Secret[], error: Error | null}
 */
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
    return { error: err };
  }

  return { files, secrets, error: null };
}

// Main
(async () => {
  await gitignore.init();

  let { files, secrets, error } = decodeKeystoneSlots();

  if (error != null) {
    core.setFailed(error);
    return;
  }

  const ksFile = getKeystoneFile();
  let missing;
  missing = missingSecrets(ksFile.env, secrets);

  if (missing && missing.length) {
    const errorMessage = `Some required secrets are missing: ${missing.join(
      ", "
    )}`;

    core.setFailed(new Error(errorMessage));
    return;
  }

  missing = missingFiles(ksFile.files, files);
  if (missing && missing.length) {
    const errorMessage = `Some required files are missing: ${missing.join(
      ", "
    )}`;

    core.setFailed(new Error(errorMessage));
    return;
  }

  ksFile.secrets.forEach(({ name }) => {
    const { label, value } = secrets.find((s) => s.label === name);

    core.setSecret(value);
    core.exportVariable(label, value);
    core.info(`Loaded ${label}`);
  });

  for (let fd of ksFile.files) {
    const file = files.find((f) => f.path === fd.path);

    const dirname = path.dirname(file.path);
    const buffer = Buffer.from(file.content, "base64");

    try {
      fs.mkdirSync(dirname, { recursive: true });
      fs.writeFileSync(file.path, buffer, { mode: 0o644, encoding: "utf8" });

      // also set the content of the file a secret
      core.setSecret(buffer.toString("utf8"));

      // add to gitignore file if not in there
      await gitignore.add(file.path);

      core.info(`Wrote ${file.path}`);
    } catch (err) {
      core.error(err);
    }
  }

  await gitignore.end();
})();
