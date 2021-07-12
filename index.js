const fs = require('fs');
const core = require('@actions/core');
const github = require('@actions/github');

function getOcto() {
  const token = core.getInput('token') || process.env.GITHUB_TOKEN;
  return github.getOctokit(token)
}

(async () => {
  // `who-to-greet` input defined in action metadata file
  const keystone_slot = core.getInput('keystone_slot');
  const repo = github.context.repo.repo.name;
  const owner = github.context.repo.owner.name;
  const octoOptions = {
    repo,
    owner
  }
  const octo = getOcto();

  const secrets = await octo.rest.actions.listRepoSecrets(octoOptions);
  console.log("LS -> index.js:21 -> secrets: ", secrets)

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

  const payload = JSON.stringify(github, undefined, 2)
  console.log(`The event payload: ${payload}`);
  console.log("The action environment:", JSON.stringify(process.env, undefined, 2))
})()

