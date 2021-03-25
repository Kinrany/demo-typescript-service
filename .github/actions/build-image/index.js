/**
 * HERE BE DRAGONS
 *
 * This action installs required packages at runtime,
 * to avoid creating a separate repository just for one action.
 */

const childProcess = require('child_process');

childProcess.execSync('npm install @actions/core @actions/http-client@1.0.9 @actions/github @actions/exec');

async function main() {
  const core = require('@actions/core');
  const github = require('@actions/github');
  const { exec } = require('@actions/exec');

  const registry = core.getInput('registry');
  const token = core.getInput('token');
  const serviceName = core.getInput('service-name');
  const push = core.getInput('push');

  const imageNameAndTag = tag => `${registry}/image:demo-typescript-service_${serviceName}_${tag}`;

  const exitCodeBuild = await exec('docker', [
    'build',
    serviceName,
    '--tag',
    imageNameAndTag(github.context.sha),
    '--tag',
    imageNameAndTag('latest'),
  ]);
  if (exitCodeBuild !== 0) {
    core.setFailed();
    return;
  }

  if (push !== 'true') {
    return;
  }

  const exitCodeLogin = await exec('docker', ['login', '-u', token, '-p', token, registry]);
  if (exitCodeLogin !== 0) {
    core.setFailed();
    return;
  }

  const exitCodePushSha = await exec('docker', ['push', imageNameAndTag(github.context.sha)]);
  const exitCodePushLatest = await exec('docker', ['push', imageNameAndTag('latest')]);
  if (exitCodePushSha !== 0 || exitCodePushLatest !== 0) {
    core.setFailed();
  }
}

process.on('unhandledRejection', (error) => {
  console.error(error);
  process.exit(1);
})

main().catch(error => {
  console.error(error);
  process.exit(1);
});
