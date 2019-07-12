# Smart Speaker Study

This repository contains the source code of the browser extension used by the study of [Privacy Attitudes of Smart Speaker Users](https://blues.cs.berkeley.edu/blog/2019/07/01/uninformed-but-unconcerned-privacy-attitudes-of-smart-speaker-users-pets-19/).

# Developing and building the extension

## Prerequisites

Make sure you have [node.js](https://nodejs.org) and npm installed, then run:

    npm install --only=dev

## Building

The code uses [webpack](https://webpack.js.org/) to transform the modularized source code into the final extension. To build the code, run:

    npm run build

To avoid rerunning this command every time you change the source code, you can use webpack's watch feature:

    npm run watch

## Linting

The linters will run automatically when you commit any code. However, you can also run them manually:

    npm run lint

## Testing

To run the tests for this project, execute `npm test` (or `yarn test` if you use [yarn](https://yarnpkg.com/)). Additional diagnostics tests can be run from the options page of the installed extension.
