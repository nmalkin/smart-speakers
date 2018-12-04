# Smart Speakers

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

## Jest

Running the test suite is possible with npm but can also be run by installing [yarn](https://yarnpkg.com/lang/en/docs/install/#debian-stable). With one of these, you can run one of the following:

    yarn add --dev jest

    npm install --save-dev jest

to install the Jest package. The entire suite can then be run with one of the following:

    yarn test

    npm test
