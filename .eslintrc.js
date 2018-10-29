module.exports = {
    extends: ['airbnb-base', 'prettier'],
    env: {
        browser: true,
        webextensions: true
    },
    rules: {
        camelcase: 1,
        'spaced-comment': 1,
        'no-console': 0,
        'prefer-destructuring': 1
    }
};