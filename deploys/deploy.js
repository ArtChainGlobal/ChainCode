const Web3 = require('web3');
const fs = require('fs');
const ACG20 = require('../static/ACG20.json');
const ACG721 = require('../static/ACG721.json');
const PROXY = require('../static/Proxy.json');

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

async function deploy_new_contracts(rpc_provider, protocol) {
    // Connect to private chain
    await connect_to_chain(rpc_provider, protocol);

    ///////////////////////////////////////////////////////////
    // Deploy raw contracts
    ///////////////////////////////////////////////////////////
    // Generate new contract objects
    raw20 = new web3.eth.Contract(JSON.parse(ACG20.abiString), null, {
        data: ACG20.bytecode
    });
    raw721 = new web3.eth.Contract(JSON.parse(ACG721.abiString), null, {
        data: ACG721.bytecode
    });
    // Estimate gas required to deploy the contracts
    let trans_estimate_gas_20 = await raw20.deploy().estimateGas();
    let trans_estimate_gas_721 = await raw721.deploy().estimateGas();
    // Deploy the contracts
    const raw20New = await raw20.deploy().send({
        from: administrator,
        gas: Math.floor(trans_estimate_gas_20 * 1.5)
    });
    const raw721New = await raw721.deploy().send({
        from: administrator,
        gas: Math.floor(trans_estimate_gas_721 * 1.5)
    });
    console.log("Now raw contracts are deployed, with address " + raw20New.options.address + " and " + raw721New.options.address);

    ///////////////////////////////////////////////////////////
    // Deploy upgradable proxies
    ///////////////////////////////////////////////////////////
    // Deploy upgradable proxy contract
    proxy20 = new web3.eth.Contract(JSON.parse(PROXY.abiString), null, {
        data: PROXY.bytecode
    });
    proxy721 = new web3.eth.Contract(JSON.parse(PROXY.abiString), null, {
        data: PROXY.bytecode
    });
    // Estimate gas required to deploy the contracts
    trans_estimate_gas_20 = await proxy20.deploy({arguments: [raw20New.options.address]}).estimateGas();
    trans_estimate_gas_721 = await proxy721.deploy({arguments: [raw721New.options.address]}).estimateGas();
    // Deploy the contracts
    const dProxy20 = await proxy20.deploy({arguments: [raw20New.options.address]}).send({
        from: administrator,
        gas: Math.floor(trans_estimate_gas_20 * 1.5)
    });
    const dProxy721 = await proxy721.deploy({arguments: [raw721New.options.address]}).send({
        from: administrator,
        gas: Math.floor(trans_estimate_gas_721 * 1.5)
    });

    ///////////////////////////////////////////////////////////
    // Instance and initialise contracts 
    ///////////////////////////////////////////////////////////
    const instance20 = new web3.eth.Contract(JSON.parse(ACG20.abiString), dProxy20.options.address);
    const instance721 = new web3.eth.Contract(JSON.parse(ACG721.abiString), dProxy721.options.address);
    console.log("Contracts deployed successfully ...\nACG20 is deployed at: ",
    instance20.options.address,
    "\nACG721 is deployed at: ", instance721.options.address);

    await instance20.methods.transferOwnership(administrator).send({
        from: administrator
    });
    await instance721.methods.transferOwnership(administrator).send({
        from: administrator
    });

    // Register each other for subsequent transactions
    await instance20.methods.registerACG721Contract(instance721.options.address).send({
        from: administrator
    });
    await instance721.methods.registerACG20Contract(instance20.options.address).send({
        from: administrator
    });

    const deployedConfig = {
        server: rpc_provider,
        administrator: administrator,
        acg20_address: instance20.options.address,
        acg721_address: instance721.options.address
    };

    const confString = JSON.stringify(deployedConfig);
    await fs.writeFileSync("./static/deployConf.json", confString);
    console.log("Write deployment result to file ...");
}

module.exports = deploy_new_contracts;
