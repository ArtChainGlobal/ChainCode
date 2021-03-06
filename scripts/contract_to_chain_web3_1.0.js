const fs = require('fs');
const solc = require('solc');
const Web3 = require('web3');
const path = require('path');

let CTRL_CONNECT_NETWORK = true;
let CTRL_CREATE_NEW_USER = false;
let CTRL_COMPILE_CONTRACT = true;
let CTRL_DEPLOY_CONTRACT = true;
let CTRL_USE_COMPILED_CONTRACT = true;
let CTRL_TEST_DEPLOYED_CONTRACT = false;

let compiledAcg20;

const contract_compile_deploy = async (RPC_SERVER) => {

    let web3;
    let admin;
    const contract20 = {abiString:"", bytecode:"", deployed:"", web3Obj:""};
    const contract721 = {abiString:"", bytecode:"", deployed:"", web3Obj:""};

    // ----------------------------------------------------------------------------
    // Connect to ethereum network
    // ----------------------------------------------------------------------------
    if (CTRL_CONNECT_NETWORK) {
        console.log("******** Connect to ethereum network ********");
        // Connect to local node
        if (typeof web3 !== 'undefined') {
            console.log("Connect to an existing provider ...");
            web3 = new Web3(web3.currentProvider);
        } else {
            // set the provider you want from Web3.providers
            console.log("Set a new provider ...");
            web3 = new Web3(new Web3.providers.HttpProvider(RPC_SERVER));
        }
        // Exception is thrown if the connection failed
        await web3.eth.net.isListening();
        console.log("Connected to RPC server ...");
        accounts = await web3.eth.getAccounts();
        admin = accounts[0];
        console.log("Set admin = ", admin);
    }

    // ----------------------------------------------------------------------------
    // Add new users for test
    // ----------------------------------------------------------------------------
    if (CTRL_CREATE_NEW_USER) {
        /*
        console.log("******** Add new users for test ********");
        // web3.eth.accounts.create
        // web3.personal.newAccount
        const userNumber = 10;
        const userInitBalance = 10;
        for (let i=0; i<userNumber; i++) {
            users[i] = await web3.personal.newAccount('password');
            // send some eth to new user
            await web3.eth.sendTransaction({
                from: admin,
                to: users[i],
                value:web3.toWei(userInitBalance, "ether")})
        }

        // output user initial balance
        console.log("  admin   : " + admin + " \tbalance: " + web3.fromWei(web3.eth.getBalance(admin), "ether") + " ether");
        users.forEach(function(e) {
            console.log("  accounts: " + e + " \tbalance: " + web3.fromWei(web3.eth.getBalance(e), "ether") + " ether");
        });
        */
    }

    // ----------------------------------------------------------------------------
    // Compile contract
    // ----------------------------------------------------------------------------
    if (CTRL_COMPILE_CONTRACT) {
        console.log("******** Compile contract ********");
        if (CTRL_USE_COMPILED_CONTRACT) {
            console.log("******** Use existing contract JSON file ********");
            const CONTRACT_ACG20_PATH = path.resolve(__dirname, '..', 'build', 'contracts', 'ACG20.json');
            const CONTRACT_ACG20_SRC = fs.readFileSync(CONTRACT_ACG20_PATH, 'utf8');
            compiledAcg20 = JSON.parse(CONTRACT_ACG20_SRC);
    
            contract20.abiString = JSON.stringify(compiledAcg20.abi);
            contract20.bytecode = compiledAcg20.bytecode;
    
            const CONTRACT_ACG721_PATH = path.resolve(__dirname, '..', 'build', 'contracts', 'ACG721.json');
            const CONTRACT_ACG721_SRC = fs.readFileSync(CONTRACT_ACG721_PATH, 'utf8');
            compiledAcg721 = JSON.parse(CONTRACT_ACG721_SRC);
    
            contract721.abiString = JSON.stringify(compiledAcg721.abi);
            contract721.bytecode = compiledAcg721.bytecode;
    
        } else {
            console.log("******** Compile JSON file from contract source ********");
            const CONTRACT_ACG20_PATH = path.resolve(__dirname, '..', 'contracts', 'acg20.sol');
            const CONTRACT_ACG721_PATH = path.resolve(__dirname, '..', 'contracts', 'acg721.sol');
            const LIB_SAFEMATH_PATH = path.resolve(__dirname, '..', 'helpers', 'SafeMath.sol');
            const input = {
                'acg20.sol': fs.readFileSync(CONTRACT_ACG20_PATH, 'utf8'),
                'acg721.sol': fs.readFileSync(CONTRACT_ACG721_PATH, 'utf8'),
                'SafeMath.sol': fs.readFileSync(LIB_SAFEMATH_PATH, 'utf8')
            };
            compilingResult = solc.compile({sources: input}, 1, (path) => {
                // Solc doesn't support importing from other folders
                // so resolve the missing files here
                if (path == "helpers/SafeMath.sol") {
                    return {contents: fs.readFileSync('./helpers/SafeMath.sol', 'utf8') };
                } else {
                    return {error: 'File not found'};
                }
            });
            // Output compiling error and warnings.
            if (compilingResult.errors) {
                compilingResult.errors.forEach((errInfo) => {
                    console.log(errInfo);
                });
            }
            // Check if both contracts compiled successfully
            compiledAcg20 = compilingResult.contracts['acg20.sol:ACG20'];
            compiledAcg721 = compilingResult.contracts['acg721.sol:ACG721'];
            if (!compiledAcg20 || !compiledAcg721) {
                console.log("Compiling contract failed, exit ...");
                return;
            }
            contract20.abiString = compiledAcg20.interface;
            contract20.bytecode = '0x' + compiledAcg20.bytecode;
            contract721.abiString = compiledAcg721.interface;
            contract721.bytecode = '0x' + compiledAcg721.bytecode;
        }
    }

    // ----------------------------------------------------------------------------
    // Deploy contract
    // ----------------------------------------------------------------------------
    if (CTRL_DEPLOY_CONTRACT) {
        console.log("******** Deploy contract ********");

        contract20.web3Obj = new web3.eth.Contract(JSON.parse(contract20.abiString), null, {
            data: contract20.bytecode
        });

        //OPTIONAL: Use average gas price to deploy (If you use too low gas price, the transaction may get stuck):
        /*
        web3.eth.getGasPrice().
           then((averageGasPrice) => {
               console.log("Average gas price: " + averageGasPrice);
               gasPrice = averageGasPrice;
           }).
           catch(console.error);
        */

        let estimatedGas = await contract20.web3Obj.deploy().estimateGas();
        console.log("Estimate to use ", estimatedGas, "gas to deploy the contract");
        contract20.deployed = await contract20.web3Obj.deploy().send({
            from: admin,
            gas: estimatedGas
        });

        contract721.web3Obj = new web3.eth.Contract(JSON.parse(contract721.abiString), null, {
            data: contract721.bytecode
        });
        estimatedGas = await contract721.web3Obj.deploy().estimateGas();
        console.log("Estimate to use ", estimatedGas, "gas to deploy the contract");
        contract721.deployed = await contract721.web3Obj.deploy().send({
            from: admin,
            gas: estimatedGas
        });
        console.log("Contracts deployed successfully ...\nACG20 is deployed at: ",
        contract20.deployed.options.address,
        "\nACG721 is deployed at: ", contract721.deployed.options.address);
    }

    // ----------------------------------------------------------------------------
    // Simple test on deployed contracts
    // ----------------------------------------------------------------------------
    if (CTRL_TEST_DEPLOYED_CONTRACT) {
        console.log("******** Simple test ********");
        let acg20Inst = new web3.eth.Contract(JSON.parse(contract20.abiString), contract20.deployed.options.address);
        let acg721Inst = new web3.eth.Contract(JSON.parse(contract721.abiString), contract721.deployed.options.address);
        const name = await acg20Inst.methods.name().call();
        const owner = await acg721Inst.methods.owner().call();
        console.log("Simple test: ACG20 name =", name);
        console.log("Simple test: Owner of ACG721 =", owner);
    }

    // ----------------------------------------------------------------------------
    // Return contract objects
    // ----------------------------------------------------------------------------
    return [contract20, contract721];
};

//contract_compile_deploy("http://127.0.0.1:31000");
module.exports = contract_compile_deploy;