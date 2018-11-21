module.exports = {
    extends: ['airbnb-base', 'prettier'],
    env: {
        browser: true,
        webextensions: true,
        jest: true
    },
    rules: {
        camelcase: 1,
        'spaced-comment': 1,
        'no-console': 0,
        'prefer-destructuring': 0 // removed until eslint supports reassignment via destructuring
    }
};
