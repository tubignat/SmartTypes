npm run build
mkdir -p node_modules/@smart-types/eslint-plugin
mv src/eslint-plugin.js node_modules/@smart-types/eslint-plugin/index.js
mv src/linter.js node_modules/@smart-types/eslint-plugin/linter.js
