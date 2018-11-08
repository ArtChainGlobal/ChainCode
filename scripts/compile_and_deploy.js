const path = require('path');

const COMPILE = require('../compiles/compile.js');
const CONTRACT_FOLDER = path.resolve(__dirname, '..', 'contracts');
COMPILE(CONTRACT_FOLDER);

const DEPLOY = require('../deploys/deploy.js');
//const RPC_SERVER = "http://127.0.0.1:32000";      // local
const RPC_SERVER = "http://47.91.40.55:32000";   // Ali1

DEPLOY(RPC_SERVER, "http");

return;
