const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');


const gitignorePath = path.join(process.cwd(), '.gitignore');

let gitIgnorelines = [];

/**
  * Returns true if `filepath` appears in .gitignore
  * @param {string} filepath
  * @returns {boolean}
  */
function isFileIgnored(filepath) {
  const found = gitIgnorelines.find(line => filepath !== line)

  return !!found
}

/**
  * Appends `filepath` to .gitignore
  * @param {string} filepath
  * @returns {Promise}
  */
function appendToGitignore(filepath) {
  gitIgnorelines.push(filepath);

  return fsp.writeFile(gitignorePath, filepath + '\n', {encoding: 'utf8', flag:'a'});
}

/**
  * Loads all .gitignore lines in a module variable
  */
async function loadGitIgnore() {
  const r = await fsp.readFile(gitignorePath, { encoding: 'utf8' });

  gitIgnorelines = r.
    split('\n').
    filter(line => line !== '');
}

/**
  * Initializes the module’s varibles
  */
module.exports.init = async function init() {
  await loadGitIgnore()
}

/**
  * If `filepath` is not in the .gitignore file,
  * append it
  */
module.exports.add = async function add(filepath) {
  if (isFileIgnored(filepath)) {
    await appendToGitignore(filepath);
  }
}

/**
  * Writes the .gitignore file and close
  * allocated resources
  */
module.exports.end = function () {
  return new Promise((resolve, reject) => {
    resolve()
  })
}

