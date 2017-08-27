#!/usr/bin/env node

"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var __awaiter = undefined && undefined.__awaiter || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : new P(function (resolve) {
                resolve(result.value);
            }).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require('babel-polyfill');
// Import TypeScript modules
var shelljs = require("shelljs");
var _ = require("lodash");
var fs = require("fs");
var chalk = require("chalk");
var ora = require("ora");
var os = require("os");
var path = require("path");
var program = require("commander");
// Import untyped JavaScript files
var Github = require('github-api');
var URL = require('url-parse');
// Initialize shell ouput coloring functions
var name = chalk.italic.blue;
var error = chalk.bold.underline.red;
// Constants
var pullRequestUrlRegex = /\/pull\/\d+/g;
var pathnameParsingRegex = /^\/(.+?)\/(.+?)(?:\/|$)(?:pull\/(\d+))?/;
var cwd = process.cwd();
var _process$env$VIE_EDIT = process.env.VIE_EDITOR,
    VIE_EDITOR = _process$env$VIE_EDIT === undefined ? 'code' : _process$env$VIE_EDIT;
// Application spinner

var applicationSpinner = ora();
// Setup arguments through the commander.js CLI framework
program.usage('[options] <GitHub repo or pull-request URL>').option('-d, --deep', 'By default, vie clones repos with depth of 1. ' + 'Pass this flag to clone with full depth. PRs are always cloned with full depth.').parse(process.argv);
// If user doesn't provide any arguments, we'll display help
if (!program.args.length) {
    program.outputHelp();
    shelljs.exit(1);
}
// Kick off the program
main();
// Main function
function main() {
    return __awaiter(this, void 0, void 0, /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var _program$args, src, _ref, pathname, isPr, _program$deep, isDeep, _ref2, _ref3, _ref3$, srcUser, _ref3$2, srcRepoName, _ref3$3, prNumber, srcRepoFullName, userFriendlyName, dirName, repoUrl, branch, gh, repo, pr, prRepo, prRepoName, _$get$split, _$get$split2, prUser, prBranch;

        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        _context.prev = 0;
                        _program$args = _slicedToArray(program.args, 1), src = _program$args[0];
                        _ref = new URL(src), pathname = _ref.pathname;
                        isPr = checkIsPr(pathname);
                        _program$deep = program.deep, isDeep = _program$deep === undefined ? false : _program$deep;
                        _ref2 = pathname.match(pathnameParsingRegex) || [], _ref3 = _slicedToArray(_ref2, 4), _ref3$ = _ref3[1], srcUser = _ref3$ === undefined ? '' : _ref3$, _ref3$2 = _ref3[2], srcRepoName = _ref3$2 === undefined ? '' : _ref3$2, _ref3$3 = _ref3[3], prNumber = _ref3$3 === undefined ? '0' : _ref3$3;
                        srcRepoFullName = `${srcUser}/${srcRepoName}`;
                        userFriendlyName = isPr ? `${srcRepoFullName}#${prNumber}` : srcRepoFullName;
                        dirName = path.join(os.tmpdir(), `vie-${srcRepoName}-${Date.now()}`);

                        fs.mkdirSync(dirName);
                        applicationSpinner.succeed(`Files will temporarily reside in ${name(dirName)}`);
                        repoUrl = `https://github.com/${srcRepoFullName}`;
                        branch = 'master';

                        if (!isPr) {
                            _context.next = 25;
                            break;
                        }

                        gh = new Github();
                        repo = gh.getRepo(srcUser, srcRepoName);

                        applicationSpinner.start(`Retrieving PR info ${name(userFriendlyName)}`);
                        _context.next = 19;
                        return repo.getPullRequest(prNumber);

                    case 19:
                        pr = _context.sent;
                        prRepo = _.get(pr, 'data.head', {});
                        prRepoName = _.get(prRepo, 'repo.name', '');
                        _$get$split = _.get(prRepo, 'label', '').split(':'), _$get$split2 = _slicedToArray(_$get$split, 2), prUser = _$get$split2[0], prBranch = _$get$split2[1];

                        branch = prBranch;
                        repoUrl = `https://github.com/${prUser}/${prRepoName}`;

                    case 25:
                        shelljs.cd(dirName);
                        applicationSpinner.start(`Cloning ${name(`${repoUrl}`)} into temporary directory`);
                        _context.next = 29;
                        return exec(`GIT_TERMINAL_PROMPT=0 git clone ${isDeep || isPr ? '' : '--depth 1 '}${repoUrl} .`);

                    case 29:
                        if (!isPr) {
                            _context.next = 33;
                            break;
                        }

                        applicationSpinner.start(`Checking out ${name(branch)}`);
                        _context.next = 33;
                        return exec(`git checkout ${branch}`);

                    case 33:
                        shelljs.cd(cwd);
                        applicationSpinner.start(`Opening ${name(VIE_EDITOR)}...`);
                        _context.next = 37;
                        return exec(`${VIE_EDITOR} ${dirName}`);

                    case 37:
                        applicationSpinner.succeed(`${name(userFriendlyName)} opened with ${name(VIE_EDITOR)}`);
                        _context.next = 45;
                        break;

                    case 40:
                        _context.prev = 40;
                        _context.t0 = _context["catch"](0);

                        console.error(error('\n\nAn error occurred:\n'));
                        console.log(_context.t0.stack ? _context.t0.stack : _context.t0);
                        shelljs.exit(1);

                    case 45:
                    case "end":
                        return _context.stop();
                }
            }
        }, _callee, this, [[0, 40]]);
    }));
}
function exec(str) {
    return new Promise(function (resolve, reject) {
        return shelljs.exec(str, { silent: true }, function (code, _1, errorMsg) {
            if (code === 0) {
                resolve();
            } else {
                console.log(errorMsg);
                reject(errorMsg);
            }
        });
    });
}
function checkIsPr(pathname) {
    return pullRequestUrlRegex.test(pathname);
}