// Compile new contract
const path = require('path');

const COMPILE = require('../compiles/compile.js');
const CONTRACT_FOLDER = path.resolve(__dirname, '..', 'contracts');
COMPILE(CONTRACT_FOLDER);

const UPGRADE = require('../upgrades/upgrade.js');
const RPC_SERVER = "http://47.91.40.55:42000";   // Ali1/node0

UPGRADE(RPC_SERVER, "http");

return;
