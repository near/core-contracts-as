#!/usr/bin/env node

var shell = require('shelljs');
var fs = require("fs");

if (!shell.which('git')) {
  shell.echo('Sorry, this script requires git');
  shell.exit(1);
}

if (!fs.existsSync("core-contracts")) {
  shell.exec('git clone https://github.com/near/core-contracts.git');
} else {
  shell.cd("core-contracts");
  shell.exit("git pull");
}