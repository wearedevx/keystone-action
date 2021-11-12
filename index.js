const fs = require("fs");
const path = require("path");
const core = require("@actions/core");

const gitignore = require("./gitignore");

/**
 * @typedef {Object} File
 * @property {string} path
 * @property {Buffer} content
 */

/**
 * @returns {{ files: File[] }}
 */
function decodeInputs() {
  const filesRaw = core.getInput("files");

  const files = filesRaw.split("\n").map((v) => {
    const [path, base64content] = v.split("#");
    const content = Buffer.from(base64content, "base64");

    return { path, content };
  });

  return { files };
}

/**
 * Promisified version of fs.mkdir()
 * @param {string} path
 * @param {fs.MakeDirectoryOptions} options
 * @returns {Promise<*,Error>}
 */
function mkdir(path, options) {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, options, (err, ...result) => {
      if (err) reject(err);
      else resolve(...result);
    });
  });
}

/**
 * Promisified version of fs.writeFile()
 * @param {string} path
 * @param {string|Buffer} content
 * @param {fs.WriteFileOptions} options
 * @returns {Promise<*,Error>}
 */
function writeFile(path, content, options) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, content, options, (err, ...result) => {
      if (err) reject(err);
      else resolve(...result);
    });
  });
}

/**
 * Writes the file, creating the necessary directories
 * @param {File} file
 * @return {Promise<undefined, Error>}
 */
async function write(file) {
  const dirname = path.dirname(file.path);

  await mkdir(dirname, { recursive: true });
  await writeFile(file.path, file.content, { mode: 0o644, encoding: "binary" });
}

// Main
(async () => {
  await gitignore.init();

  const { files } = decodeInputs();

  for (let file of files) {
    try {
      await write(file);

      // also set the content of the file a secret
      core.setSecret(file.content.toString("utf8"));

      // add to gitignore file if not in there
      await gitignore.add(file.path);

      core.info(`Wrote ${file.path}`);
    } catch (err) {
      core.error(err);
    }
  }

  await gitignore.end();
})();
