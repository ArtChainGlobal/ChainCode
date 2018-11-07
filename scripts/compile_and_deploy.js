const path = require('path');

const COMPILE = require('../compiles/compile.js');
const CONTRACT_FOLDER = path.resolve(__dirname, '..', 'contracts');
COMPILE(CONTRACT_FOLDER);

const DEPLOY = require('../deploys/deploy.js');
const RPC_SERVER = "http://47.91.56.32:32000";
// rpc on port 32000
DEPLOY(RPC_SERVER);

return;
