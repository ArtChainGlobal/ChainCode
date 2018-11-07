const Web3 = require('web3');
const fs = require('fs');
const ACG20 = require('../static/ACG20.json');
const ACG721 = require('../static/ACG721.json');

const contract20 = {instance: ""};
const contract721 = {instance: ""};
let web3;
let administrator;

async function connect_to_chain(rpc_provider, protocol) {
    if (typeof web3 !== 'undefined') {
        console.log("API: Connect to an existing web3 provider ...");
        web3 = new Web3(web3.currentProvider);
    } else {
        // set the provider you want from Web3.providers
        console.log("API: Set a new web3 provider ...");
        if (protocol == "http") {
            web3 = new Web3(new Web3.providers.HttpProvider(rpc_provider));
        } else if (protocol == "ws") {
            web3 = new Web3(new Web3.providers.WebsocketProvider(rpc_provider));
        }
    }
    // Exception is thrown if the connection failed
    await web3.eth.net.isListening();
    accounts = await web3.eth.getAccounts();
    administrator = accounts[0];
    console.log("Connected to RPC server, set administrator to ", administrator, "...");
    return web3;
}

async function deploy_new_contracts(rpc_provider, protocol = "http") {
    // Connect to private chain
    await connect_to_chain(rpc_provider, protocol);

    // Generate new contract objects
    instance20 = new web3.eth.Contract(JSON.parse(ACG20.abiString), null, {
        data: ACG20.bytecode
    });
    instance721 = new web3.eth.Contract(JSON.parse(ACG721.abiString), null, {
        data: ACG721.bytecode
    });

    // Estimate gas required to deploy the contracts
    const trans_estimate_gas_20 = await instance20.deploy().estimateGas();
    const trans_estimate_gas_721 = await instance721.deploy().estimateGas();
    // const gas_acg20 = await trans_estimate_gas_20;
    // const gas_acg721 = await trans_estimate_gas_721;

    // Deploy the contracts
    const newInstance20 = await instance20.deploy().send({
        from: administrator,
        gas: Math.floor(trans_estimate_gas_20 * 1.5)
    });
    const newInstance721 = await instance721.deploy().send({
        from: administrator,
        gas: Math.floor(trans_estimate_gas_721 * 1.5)
    });
    // newInstance20 = await trans_deploy_acg20;
    // newInstance721 = await trans_deploy_acg721;

    // Register each other for subsequent transactions
    await newInstance20.methods.registerACG721Contract(newInstance721.options.address).send({
        from: administrator
    });
    await newInstance721.methods.registerACG20Contract(newInstance20.options.address).send({
        from: administrator
    });
    // await trans_register_20;
    // await trans_register_721;

    console.log("Contracts deployed successfully ...\nACG20 is deployed at: ",
    newInstance20.options.address,
    "\nACG721 is deployed at: ", newInstance721.options.address);

    const deployedConfig = {
        server: rpc_provider,
        administrator: administrator,
        acg20_address: newInstance20.options.address,
        acg721_address: newInstance721.options.address
    };

    const confString = JSON.stringify(deployedConfig);
    await fs.writeFileSync("./static/deployConf.json", confString);
    console.log("Write deployment result to file ...");
}

module.exports = deploy_new_contracts;
