const path = require('path');

const COMPILE = require('../compiles/compile.js');
const CONTRACT_FOLDER = path.resolve(__dirname, '..', 'contracts');
COMPILE(CONTRACT_FOLDER);

const DEPLOY = require('../deploys/deploy.js');
//const RPC_SERVER = "http://127.0.0.1:32000";      // local
//const RPC_SERVER = "http://47.74.69.177:32000";   // Ali1
const RPC_SERVER = "http://47.74.70.159:32000";   // Ali2
//const RPC_SERVER = "http://13.238.184.2:32000";   // Aws1
//const RPC_SERVER = "http://54.252.240.251:32000";     // Aws2
//const RPC_SERVER = "http://13.239.27.233:32000";     // Aws3

DEPLOY(RPC_SERVER, "http");

return;
