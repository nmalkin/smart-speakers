const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const BUILD_PATH = path.resolve(__dirname, 'chrome_extension');
const FIREFOX_BUILD_PATH = path.resolve(__dirname, 'firefox_extension');

module.exports = [
    {
        entry: {
            background: './src/chrome/background/background.ts',
            content: './src/chrome/content/content.ts',
            index: './src/chrome/content/index.ts',
            options: './src/chrome/content/options.ts'
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loader: 'ts-loader',
                    options: { onlyCompileBundledFiles: true },
                    exclude: /node_modules/
                }
            ]
        },
        resolve: {
            extensions: ['.ts', '.js']
        },
        output: {
            filename: '[name].js',
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
                    from: 'assets/**/*',
                    to: ''
                },
                {
                    from: 'src/chrome/options.html',
                    to: ''
                }
            ])
        ]
    },
    {
        entry: {
            background: './src/firefox/background/background.ts',
            options: './src/firefox/content/options.ts'
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loader: 'ts-loader',
                    options: { onlyCompileBundledFiles: true },
                    exclude: /node_modules/
                }
            ]
        },
        resolve: {
            extensions: ['.ts', '.js']
        },
        output: {
            filename: '[name].js',
            path: FIREFOX_BUILD_PATH
        },
        mode: 'none',
        plugins: [
            new CopyWebpackPlugin([
                {
                    from: 'src/firefox/manifest.json',
                    to: ''
                },
                {
                    from: 'assets/**/*',
                    to: ''
                },
                {
                    from: 'src/chrome/options.html',
                    to: ''
                }
            ])
        ]
    }
];
