#!/usr/bin/env node

const { execSync } = require('child_process');

const githubUser = process.env.GITHUB_USER;
const githubPat = process.env.GITHUB_PAT;

if (!githubUser || !githubPat) {
  console.error('Missing github_user or github_pat environment variables.');
  process.exit(1);
}

const remoteUrl = 'https://github.com/pavlobcn/news-portal.git';
const authRemoteUrl = `https://${githubUser}:${githubPat}@github.com/pavlobcn/news-portal.git`;

const run = (command, options = {}) => {
  execSync(command, { stdio: 'inherit', ...options });
};

const getOutput = (command) => execSync(command, { encoding: 'utf8' }).trim();

const originExists = (() => {
  try {
    execSync('git remote get-url origin', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
})();

if (originExists) {
  run(`git remote set-url origin ${remoteUrl}`);
} else {
  run(`git remote add origin ${remoteUrl}`);
}

run('git add -A');

const hasStagedChanges = (() => {
  try {
    execSync('git diff --cached --quiet', { stdio: 'pipe' });
    return false;
  } catch {
    return true;
  }
})();

if (hasStagedChanges) {
  const commitMessage = `chore: sync local changes (${new Date().toISOString()})`;
  run(`git commit -m ${JSON.stringify(commitMessage)}`);
} else {
  console.log('No local changes to commit.');
}

const localMainExists = (() => {
  try {
    execSync('git show-ref --verify --quiet refs/heads/main', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
})();

if (localMainExists) {
  run('git branch -f main HEAD');
} else {
  run('git branch main HEAD');
}

try {
  run(`git push ${authRemoteUrl} main:main`);
  console.log('Successfully pushed local main to remote main.');
} catch (error) {
  console.error('Failed to push local main to remote main.');
  throw error;
}

const currentBranch = getOutput('git rev-parse --abbrev-ref HEAD');
if (currentBranch !== 'main') {
  run('git switch -C main');
}
