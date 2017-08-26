# vie

`vie`, for **v**iew **i**n **e**ditor, is a command line tool that lets you quickly open any GitHub repository or pull-request in your text editor. vie downloads the repo to a temporary directory that's automatically cleaned up by your operating system.

See [this video demo](https://giphy.com/gifs/3oKGzt8BExxh3EPxpC/fullscreen).

### Notes 

The default text editor that vie looks for VS Code. If you use a different editor, see the [configurations](#configurations) section below.

vie requires that you have Node 8+ installed, otherwise it won't work.

## Installation

```bash
npm i -g viewineditor
``` 

## Usage

### View a GitHub repo

```bash
vie https://github.com/twbs/bootstrap
```

vie will clone the git repo of the link.

### View a GitHub pull-request

```bash
vie https://github.com/twbs/bootstrap/pull/23691
```

vie will clone the git repo from which the pull-request was sent and it will switch to the branch of the pull-request.

## Options

### `-d`, `--deep`

By default, vie clones repos with `--depth 1` for efficiency. If you need to clone the repo with its full history, pass `--deep` or `-d`.

For example

```bash
vie -d https://github.com/twbs/bootstrap
```

**Note**: PRs are always cloned with full depth.

## Configurations

To configure vie, set the following environment variables in your shell initialization file, `.bash_profile`, `.zshrc` etc...

### `VIE_EDITOR`

You can set the `VIE_EDITOR` environment variable to the shell command of the text editor of your choice. This tells vie which command to use to open the cloned repo.

Examples

```bash
export VIE_EDITOR=atom # for Atom
export VIE_EDITOR=subl # for Sublime
export VIE_EDITOR='open -a IntelliJ\ IDEA' # for IntelliJ IDEA
```

## FAQ

#### When will the downloaded files be deleted?

vie clones files to the temp directory of your operating system. Mac, Linux, and Windows handle temp directories differently but they eventually get deleted. vie will print out the location of the temp directory where it is cloning the repo.