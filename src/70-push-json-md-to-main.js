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

run("git add '*.json' '*.md'");

try {
  run(`git push ${authRemoteUrl} HEAD:main`);
  console.log('Successfully pushed HEAD to main.');
} catch (error) {
  console.error('Failed to push HEAD to main.');
  throw error;
}
