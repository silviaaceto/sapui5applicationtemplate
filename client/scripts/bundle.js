var fs = require('fs-extra');
fs.emptyDirSync("./dist");
fs.copySync("./package.json", "./dist/package.json");
fs.copySync("./src", "./dist/src");