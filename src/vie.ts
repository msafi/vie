#!/usr/bin/env node
require('babel-polyfill')

// Import TypeScript modules
import * as shelljs from 'shelljs'
import * as _ from 'lodash'
import * as fs from 'fs'
import * as chalk from 'chalk'
import * as ora from 'ora'
import * as os from 'os'
import * as path from 'path'
import * as program from 'commander'

// Import untyped JavaScript files
const Github = require('github-api')
const URL = require('url-parse')

// Initialize shell ouput coloring functions
const name = chalk.italic.blue
const error = chalk.bold.underline.red

// Constants
const pullRequestUrlRegex = /\/pull\/\d+/g
const pathnameParsingRegex = /^\/(.+?)\/(.+?)(?:\/|$)(?:pull\/(\d+))?/
const cwd = process.cwd()
const {EDITOR = 'code'} = process.env

// Application spinner
const applicationSpinner = ora()

// Setup arguments through the commander.js CLI framework
program
  .usage('[options] <GitHub repo or pull-request URL>')
  .option('-d, --deep', 'By default, vie clones repos with depth of 1. ' +
    'Pass this flag to clone with full depth. PRs are always cloned with full depth.'
  )
  .parse(process.argv)

// If user doesn't provide any arguments, we'll display help
if (!program.args.length) {
  program.outputHelp()
  shelljs.exit(1)
}

// Kick off the program
main()

// Main function
async function main() {
  try {
    const [src] = program.args
    const {pathname} = new URL(src)
    const isPr = checkIsPr(pathname)
    const {deep: isDeep = false} = program
    const [,
      srcUser = '', 
      srcRepoName = '',
      prNumber = '0'
    ] = pathname.match(pathnameParsingRegex) || []
    const srcRepoFullName = `${srcUser}/${srcRepoName}`
    const userFriendlyName = (isPr) ? `${srcRepoFullName}#${prNumber}` : srcRepoFullName
    const dirName = path.join(os.tmpdir(), `vie-${srcRepoName}-${Date.now()}`)
  
    fs.mkdirSync(dirName)
    applicationSpinner.succeed(`Files will temporarily reside in ${name(dirName)}`)
  
    let repoUrl = `https://github.com/${srcRepoFullName}`
    let branch = 'master'
    
    if (isPr) {
      const gh = new Github()
      const repo = gh.getRepo(srcUser, srcRepoName)
      applicationSpinner.start(`Retrieving PR info ${name(userFriendlyName)}`)
      const pr = await repo.getPullRequest(prNumber)
      const prRepo = _.get(pr, 'data.head', {})
      const prRepoName = _.get(prRepo, 'repo.name', '')
      const [prUser, prBranch] = _.get(prRepo, 'label', '').split(':')
  
      branch = prBranch
      repoUrl = `https://github.com/${prUser}/${prRepoName}`
    }
    
    shelljs.cd(dirName)
    
    applicationSpinner.start(`Cloning ${name(`${repoUrl}`)} into temporary directory`)
    await exec(`GIT_TERMINAL_PROMPT=0 git clone ${(isDeep || isPr) ? '' : '--depth 1 '}${repoUrl} .`)
  
    if (isPr) {
      applicationSpinner.start(`Checking out ${name(branch)}`)
      await exec(`git checkout ${branch}`)
    }
  
    shelljs.cd(cwd)
    
    applicationSpinner.start(`Opening ${name(EDITOR)}...`)
    await exec(`${EDITOR} ${dirName}`)
    applicationSpinner.succeed(`${name(userFriendlyName)} opened with ${name(EDITOR)}`)
  } catch(err) {
    console.error(error('\n\nAn error occurred:\n'))
    console.error(err.stack ? err.stack : err)
    shelljs.exit(1)
  }
}

function exec(str: string) {
  return new Promise((resolve, reject) => shelljs.exec(
    str, 
    {silent: true}, 
    (code: number, _1, errorMsg) => {
      if (code === 0) {
        resolve()
      } else {
        reject(errorMsg)
      }
    }
  ))
}

function checkIsPr(pathname: string) {
  return pullRequestUrlRegex.test(pathname)
}