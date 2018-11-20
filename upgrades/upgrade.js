const Web3 = require('web3');
//const fs = require('fs');
const DEPLOYCONF = require('../static/deployConf.json')

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

async function deploy_new_contracts() {
    
    const ACG20 = require('../static/ACG20.json');
    const ACG721 = require('../static/ACG721.json');

    // Generate new contract objects
    raw20 = new web3.eth.Contract(JSON.parse(ACG20.abiString), null, {
        data: ACG20.bytecode
    });
    raw721 = new web3.eth.Contract(JSON.parse(ACG721.abiString), null, {
        data: ACG721.bytecode
    });
    // Estimate gas required to deploy the contracts
    let estimate_gas_20 = await raw20.deploy().estimateGas();
    let estimate_gas_721 = await raw721.deploy().estimateGas();
    // Deploy the contracts
    const raw20New = await raw20.deploy().send({
        from: administrator,
        gas: Math.floor(estimate_gas_20 * 1.5)
    });
    const raw721New = await raw721.deploy().send({
        from: administrator,
        gas: Math.floor(estimate_gas_721 * 1.5)
    });
    return [raw20New, raw721New];
}

async function fetch_proxy() {
    const PROXY = require('../static/Proxy.json');

    const proxy20 = new web3.eth.Contract(JSON.parse(PROXY.abiString), DEPLOYCONF.acg20_address);
    const proxy721 = new web3.eth.Contract(JSON.parse(PROXY.abiString), DEPLOYCONF.acg721_address);
    return [proxy20, proxy721];
}

async function upgrade_contracts(rpc_provider, protocol) {
    // Connect to private chain
    await connect_to_chain(rpc_provider, protocol);

    ///////////////////////////////////////////////////////////
    // Deploy upgraded raw contracts
    ///////////////////////////////////////////////////////////
    [new20raw, new721raw] = await deploy_new_contracts();
    console.log("New versions of raw contract are deployed:\n    ACG20  at address: " + new20raw.options.address + "\n    ACG721 at address: " + new721raw.options.address);

    ///////////////////////////////////////////////////////////
    // Fetch proxies 
    ///////////////////////////////////////////////////////////
    [proxy20, proxy721] = await fetch_proxy();

    ///////////////////////////////////////////////////////////
    // Fetch deployed raw contracts 
    ///////////////////////////////////////////////////////////
    //[old20raw, old721raw] = await fetch_old_contracts();

    ///////////////////////////////////////////////////////////
    // Upgrade implementation to new version
    ///////////////////////////////////////////////////////////
    old20Addr = await proxy20.methods.implementation().call({
        from: administrator
    });
    old721Addr = await proxy721.methods.implementation().call({
        from: administrator
    });
    await proxy20.methods.upgradeTo(new20raw.options.address).send({
        from: administrator
    });
    await proxy721.methods.upgradeTo(new721raw.options.address).send({
        from: administrator
    });
    console.log("Upgrade ACG20  contract from " + old20Addr + " to " + new20raw.options.address);
    console.log("Upgrade ACG721 contract from " + old721Addr + " to " + new721raw.options.address);

    ///////////////////////////////////////////////////////////
    // Fetch new contracts
    ///////////////////////////////////////////////////////////
    const ACG20 = require('../static/ACG20.json');
    const ACG721 = require('../static/ACG721.json');
    const instance20 = new web3.eth.Contract(JSON.parse(ACG20.abiString), DEPLOYCONF.acg20_address);
    const instance721 = new web3.eth.Contract(JSON.parse(ACG721.abiString), DEPLOYCONF.acg721_address);

    ///////////////////////////////////////////////////////////
    // Check if upgraded contracts keep status
    ///////////////////////////////////////////////////////////
    const test_name = await instance20.methods.name().call({
        from: DEPLOYCONF.administrator
    });
    const test_registered_721 = await instance20.methods.acg721Contract().call({
        from: DEPLOYCONF.administrator
    });
    const test_owner = await instance721.methods.owner().call({
        from: DEPLOYCONF.administrator
    });
    const test_registered_20 = await instance721.methods.acg20Contract().call({
        from: DEPLOYCONF.administrator
    });
    console.log("Contracts upgraded keeping all existing data:");
    console.log("ACG20's name is still " + test_name + ", with ACG721(" + test_registered_721 + ") registered before.");
    console.log("ACG721's owner is still " + test_owner + ", with ACG20(" + test_registered_20 + ") registered before.");
}

module.exports = upgrade_contracts;
