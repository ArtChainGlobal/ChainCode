const path = require('path');

const COMPILE = require('../compiles/compile.js');
const CONTRACT_FOLDER = path.resolve(__dirname, '..', 'contracts');
COMPILE(CONTRACT_FOLDER);

const DEPLOY = require('../deploys/deploy.js');
//const RPC_SERVER = "http://127.0.0.1:31000";      // local
const RPC_SERVER = "http://47.74.69.177:31000";   // Ali1
//const RPC_SERVER = "http://13.238.184.2:31000";   // Aws1
//const RPC_SERVER = "http://54.252.240.251:31000";     // Aws2


DEPLOY(RPC_SERVER);

return;
