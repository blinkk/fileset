# Contributing

Thank you so much for contributing to this project! Our mission is to streamline
website production. We aim to provide a set of lean developer tools that are easily
installable, runnable, and usable for either small or big interactive projects.

Fileset doesn't intend to be the next big web static web server. It is meant to
be a thin alternative to Netlify, and allow existing users of Google Cloud
Platform to serve static sites to users with just a little bit of extra dynamic
functionality.

Keep the above in mind when adding features to Fileset.

## Philosophy

- Write as little code as possible, but as much as necessary to complete a task
  correctly.
- Avoid introducing new dependencies as much as possible. The core project
  should be kept slim/lean. Installing Fileset should install as few
  sub-packages as possible.
- Group code logically by file. A new contributor should be able to quickly
  understand the project structure and where to go to make code changes or
  enhancements – having too many files reduces scannability of the codebase.
  - Avoid creating new files that have just one function. Avoid creating new
    files to contain shared code until that code is used in more than one
    location.
- Things should work "out of the box" for developers as frequently as possible.

## Requirements

- Avoid adding noise or extraneous information to command line utility output or
  visual UIs.
- Make error messages clear and helpful. Put yourself in the user's shoes. When
  encountering a problem, an error message should provide the user with a path
  to fixing the error.

## Writing and style

- Be concise and consistent.
- Include as few words as possible to convey what you're trying to say.
- Use "Sentence case" for titles and labels. Avoid "Title Case" for labels.
- Variable and function names should be concise but self-explanatory.
- Git commit messages should start with a verb. The subject should not exceed
  one line. Example:

```
Add support for atomic deployments
```

## Pull request flow

- Avoid merge commits. Use the "rebase and merge" strategy or "squash and merge"
  strategy (preferred for larger features or commits).
- Preserve the PR# in commit message subjects so the relevant discussion can be
  found later.
- Commits that can be merged directly to `main`:
  - Comments/documentation
  - Implementing functionality that has already been scaffolded
  - Tests
  - Code style fixes/improvements
  - Cleanup or removal of dead code
- Commits that should be sent via pull requests:
  - Designing new user-facing core features
  - Reworking the overall structure of several files or the internals of data structures
- When desinging new user-facing core features, send a draft pull request early
  so there is visibility into the development and rationale, and so that
  feedback can be provided.

## Development workflow

### Getting started

1. Clone this project.
2. Run `npm install`.
3. Run `npm run dev` in one Terminal to start the watcher. The watcher invokes
   the TypeScript compiler when code is changed.
4. Run `node ./dist/src/index.js` to invoke the CLI from the local project
   directory.

### Running against other sites locally

1. From Fileset's root directory, run `npm link`. This tells NPM to "install
   Fileset from this directory, instead of from npmjs.org" for any project that
   depends on Fileset.
2. `cd` to the site's root directory.
3. Ensure `@blinkk/fileset` is in the project's `package.json` dependencies.
4. Run `npm install`.
5. Invoking the `fileset` command will now point to your local development
   version instead of the one hosted on npmjs.org.

To unlink (the order is important):

1. `cd` to the site's root directory.
2. Run `npm unlink --no-save @blinkk/fileset`
3. `cd` to Fileset's root directory.
4. Run `npm unlink`

## Tips

- We recommend using VSCode or a similar editor that supports autofixing and
  displaying TypeScript and ESLint code hints.
- When using VSCode, we recommend the following extensions (see below).

```
amatiasq.sort-imports
dbaeumer.vscode-eslint
```

- When using VSCode, we recommend enabling "Fix All on Save" (see below).

```
# In VSCode's `settings.json`
"editor.codeActionsOnSave": {
  "source.fixAll.eslint": true
},
```