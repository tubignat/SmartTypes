npm run build
mkdir -p node_modules/@smart-types/eslint-plugin
mv build/eslint-plugin.js node_modules/@smart-types/eslint-plugin/index.js
mv build/linter.js node_modules/@smart-types/eslint-plugin/linter.js
mv build/watcher.js node_modules/@smart-types/eslint-plugin/watcher.js
