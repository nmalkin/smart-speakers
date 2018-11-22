const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const BUILD_PATH = path.resolve(__dirname, 'chrome_extension');

module.exports = [
    {
        entry: './src/background/background.js',
        output: {
            filename: 'background.js',
            path: BUILD_PATH
        },
        mode: 'none',
        plugins: [
            new CopyWebpackPlugin([
                {
                    from: 'assets/*',
                    to: '',
                    transformPath(targetPath) {
                        // Strip off the first directory in the target path, to place file in top-level directory
                        return targetPath.substring(
                            targetPath.indexOf(path.sep)
                        );
                    }
                }
            ])
        ]
    },
    {
        entry: './src/content/options.js',
        output: {
            filename: 'options.js',
            path: BUILD_PATH
        },
        mode: 'none'
    }
];
