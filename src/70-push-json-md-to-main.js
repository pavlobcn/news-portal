#!/usr/bin/env node

const { execSync } = require('child_process');

const githubUser = process.env.github_user;
const githubPat = process.env.github_pat;

if (!githubUser || !githubPat) {
  console.error('Missing github_user or github_pat environment variables.');
  process.exit(1);
}

const remoteUrl = 'https://github.com/pavlobcn/news-portal.git';
const authRemoteUrl = `https://${githubUser}:${githubPat}@github.com/pavlobcn/news-portal.git`;

const run = (command) => {
  execSync(command, { stdio: 'inherit' });
};

try {
  run(`git remote set-url origin ${remoteUrl}`);
} catch {
  run(`git remote add origin ${remoteUrl}`);
}

run("git add '*.json' '*.md'");

run(`git push ${authRemoteUrl} HEAD:main`);
