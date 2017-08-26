"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// Import TypeScript modules
const shelljs = require("shelljs");
const _ = require("lodash");
const fs = require("fs");
const chalk = require("chalk");
const ora = require("ora");
const os = require("os");
const path = require("path");
const url_1 = require("url");
const program = require("commander");
// Import untyped JavaScript files
const Github = require('github-api');
const name = chalk.italic.blue;
const error = chalk.bold.underline.red;
// Constants
const pullRequestUrlRegex = /\/pull\/\d+/g;
const pathnameParsingRegex = /^\/(.+?)\/(.+?)(?:\/|$)(?:pull\/(\d+))?/;
const cwd = process.cwd();
// Application spinner
const applicationSpinner = ora();
program
    .usage('[options] <GitHub repo or pull-request URL>')
    .option('-d, --deep [value]', 'Specify whether to clone repos deep or shallow. By default PRs are ' +
    'cloned with full depth and repos are cloned with depth level of 1.')
    .parse(process.argv);
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const [src] = program.args;
        const { pathname } = new url_1.URL(src);
        const isPr = getIsPr(pathname);
        const { deep: isDeep = isPr ? true : false } = program;
        const [, srcUser = '', srcRepoName = '', prNumber = '0'] = pathname.match(pathnameParsingRegex) || [];
        const srcRepoFullName = `${srcUser}/${srcRepoName}`;
        const userFriendlyName = (isPr) ? `${srcRepoFullName}#${prNumber}` : srcRepoFullName;
        const dirName = path.join(os.tmpdir(), `ric-${srcRepoName}-${Date.now()}`);
        applicationSpinner.start('Creating temporary directory');
        fs.mkdirSync(dirName);
        applicationSpinner.succeed(`Files will temporarily reside in ${name(dirName)}`);
        let repoUrl = `https://github.com/${srcRepoFullName}`;
        let branch = 'master';
        if (isPr) {
            const gh = new Github();
            const repo = gh.getRepo(srcUser, srcRepoName);
            applicationSpinner.start(`Retrieving info for PR ${name(userFriendlyName)}`);
            const pr = yield repo.getPullRequest(prNumber);
            const headRepo = _.get(pr, 'data.head', {});
            const headRepoName = _.get(headRepo, 'repo.name', '');
            const [user, branch] = _.get(headRepo, 'label', '').split(':');
            repoUrl = `https://github.com/${user}/${headRepoName}`;
        }
        shelljs.cd(dirName);
        applicationSpinner.start(`Cloning ${name(`${repoUrl}`)} into the temporary directory}`);
        yield exec(`git clone ${(isDeep) ? '' : '--depth 1 '}${repoUrl} .`);
        applicationSpinner.start(`Checking out ${name(branch)}`);
        yield exec(`git checkout ${branch}`);
        shelljs.cd(cwd);
        applicationSpinner.stop();
        const reviewingRepoSpinner = ora({
            text: `Reviewing ${name(userFriendlyName)} in ${name('VS Code')}`,
            spinner: { frames: ['📖 '] }
        }).start();
        yield exec(`code ${dirName} --wait`);
        reviewingRepoSpinner.succeed(`Done reviewing ${name(userFriendlyName)}`);
    });
}
// // async function reviewPullRequest(
// //   srcUser: string, 
// //   srcRepoName: string,
// //   prNumber: string,
// //   tmpdirName: string,
// //   srcUserFriendlyName: string
// // ) {
// //   const cwd = process.cwd()
// //   const gh = new Github()
// //   const repo = gh.getRepo(srcUser, srcRepoName)
// //   applicationSpinner.start(`Retrieving info for PR ${name(srcUserFriendlyName)}`)
// //   const pr = await repo.getPullRequest(prNumber)
// //   const headRepo = _.get(pr, 'data.head', {})
// //   const headRepoName = _.get(headRepo, 'repo.name', '')
// //   const [user, branch] = _.get(headRepo, 'label', '').split(':')
// //   shelljs.cd(tmpdirName)
// //   applicationSpinner.start(`Cloning ${name(`${user}/${headRepoName}`)} into ${name(tmpdirName)}`)
// //   await exec(`git clone https://github.com/${user}/${headRepoName} .`)
// //   applicationSpinner.start(`Checking out ${name(branch)}`)
// //   await exec(`git checkout ${branch}`)
// //   shelljs.cd(cwd)
// // }
// // async function reviewRepo(src: string, tmpdirName: string) {
// //   const repo = parse(src)
// //   const hash = await getHash(repo, {})
// //   const fileName = `${hash}.tar.gz`
// //   const file = `${tmpdirName}/${fileName}`
// //   const url = `${repo.url}/archive/${fileName}`
// //   await fetch(url, file)
// //   await untar(file, tmpdirName)
// // }
function exec(str) {
    return new Promise((resolve) => shelljs.exec(str, { silent: true }, resolve));
    // return new Promise((resolve, reject) => shelljs.exec(str, {silent: true}, (code: number, _1, errorMsg) => {
    //   if (code === 0) {
    //     resolve()
    //   } else {
    //     console.error(error('\nAn error occurred:\n'))
    //     console.error(errorMsg)
    //     shelljs.exit(1)
    //   }
    // }))
}
function getIsPr(pathname) {
    return pullRequestUrlRegex.test(pathname);
}
