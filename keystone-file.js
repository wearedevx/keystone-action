/**
 * @typedef  {Object}              KeystoneFile
 * @property {string}              project_id
 * @property {string}              name
 * @property {Array<EnvKey>}       env
 * @property {Array<FileKey>}      files
 * @property {KeystoneFileOptions} options
 * @property {Array<CiService>}    ci_services
 */

/**
 * @typedef  {Object} EnvKey
 * @property {string} key
 * @property {bool}   strict
 */

/**
 * @typedef  {Object} FileKey
 * @property {string} path
 * @property {bool}   strict
 * @property {bool}   fromcache
 */

/**
 * @typedef {Object} CiService
 * @property {string} name
 * @property {string} type
 * @property {Object} options
 */

module.exports = {};
