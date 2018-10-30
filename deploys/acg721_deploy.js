//const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const { interface, bytecode } = require('../compiles/ACG721Compile');

// const provider = new HDWalletProvider(
//     // two arguements, account Mnemonic, and url - infura link
//     // the following is the text used to create public and private key
//     'another tray rapid bird wise firm renew private always write shrug inject',
//     'https://rinkeby.infura.io/v3/66724f5b8e9c465d8625383690f03cac'
// );
var provider = new Web3.providers.HttpProvider('http://127.0.0.1:8000')
const web3 = new Web3(provider);
// const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8000"));

//async await action
const deploy = async () => {
    //console.log("bytecode", bytecode);
    //console.log("interface", interface)
    const accounts = await web3.eth.getAccounts();
    // get a list of account, then deploy the account
    console.log('attempt to deploy from accounts', accounts[0]);

    const result = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({ 
            data: '0x' + bytecode,      //keep in mind to put '0x' as prefix of the bytecode
            // arguments: ['initial-message-1'],
         })
         .send({
            from: accounts[0],
            gas: '2000000',
         });
    console.log('contract deployed to ', result.options.address);
    console.log(interface);
}

deploy();