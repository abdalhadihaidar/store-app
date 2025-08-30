// Simple proxy to the actual server in dist folder
const path = require('path');

// Change working directory to parent to access dist folder
process.chdir(path.join(__dirname, '..'));

// Now require the actual server
require('../dist/server');
