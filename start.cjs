#!/usr/bin/env node
'use strict';
// Download, unzip, then: node start.cjs. No package installation required.
require('./scripts/launcher.cjs').launch(process.argv.slice(2)).catch(error => {
  console.error('DevFlow: ' + error.message);
  process.exitCode = 1;
});
