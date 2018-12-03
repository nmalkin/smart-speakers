const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const BUILD_PATH = path.resolve(__dirname, 'chrome_extension');

module.exports = [
    {
        entry: './src/chrome/background/background.js',
        output: {
            filename: 'background.js',
            path: BUILD_PATH
        },
        mode: 'none',
        plugins: [
            new CopyWebpackPlugin([
                {
                    from: 'src/chrome/manifest.json',
                    to: ''
                },
                {
                    from: 'assets/*',
                    to: ''
                }
            ])
        ]
    },
    {
        entry: './src/chrome/content/content.js',
        output: {
            filename: 'content.js',
            path: BUILD_PATH
        },
        mode: 'none'
    },
    {
        entry: './src/chrome/content/options.js',
        output: {
            filename: 'options.js',
            path: BUILD_PATH
        },
        mode: 'none',
        plugins: [
            new CopyWebpackPlugin([
                {
                    from: 'src/chrome/options.html',
                    to: ''
                }
            ])
        ]
    }
];
