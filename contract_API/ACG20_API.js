
const Web3 = require('web3');
//import the token which was deployed from deployment
const AGC20Token = require('./ACG20Token');
const AGC721Token = require()

//import ip address and port from static json file, based on RPC ip address and port of nodes
const NodeIPAddresses = require('../static/contract_information/node_IP_address.json');

// implement providers for all nodes of the private chain
const web3Array = new Array();
NodeIPAddresses.forEach(async (element) => {
    web3Array.push(new Web3(new Web3.providers.HttpProvider(element.IPAddress)));
});


/**
 * Create new user module
 * Password need provided by user
 */
const addNewAccount = async (passward) => {
    //the new account will be created on node 0 of the private chain
    const node0Accounts = await web3Array[0].eth.getAccounts();
    //console.log(node0Accounts); 
    const DEFAULT_ACCOUNT = 0x0;  //default account
    const DEFAULT_ETHER_FOR_NEW_ACCOUNT = await Web3.utils.toWei('1000', 'ether'); //1000 ethers
    const DEFAULT_UNLOCK_TIME = 60 * 60 * 24 * 365 * 10;    //10 years
   
    var newAccount = DEFAULT_ACCOUNT;
    try {
        //create new account from node0 - web3Array[0]
        newAccount = await web3Array[0].eth.personal.newAccount(passward);
        console.log(newAccount);        
        //unlock the account with a preiod of time
        try {
            await web3Array[0].eth.personal.unlockAccount(newAccount, passward, DEFAULT_UNLOCK_TIME);
            var newBalance = await web3Array[0].eth.getBalance(newAccount)
            //console.log("balance of new account: ", newBalance);
            //topup ether for new account from accounts[0]
            const fromAddress = node0Accounts[0];
            try {
                await web3Array[0].eth.sendTransaction({
                    from: fromAddress,
                    to: newAccount, 
                    value: DEFAULT_ETHER_FOR_NEW_ACCOUNT,
                });
            } catch(err) {
                newAccount = DEFAULT_ACCOUNT;
            }       
            
        } catch(err) {
            console.log("Cannot unlock the account");
            newAccount = DEFAULT_ACCOUNT;
        }
    } catch(e) {
        console.log("Create account error", e);
        newAccount = DEFAULT_ACCOUNT;
    }
    return newAccount;
}

/**
 * interface number 3
 * buy_artwork
 * 
 */
// const buy_artwork = async (buyer_address, owner_address, artwork_id, artwork_price) => {
//     //assume that both the buyer_address and owner_addrss is legitimate
//     try {
//         result = await AGC20Token.methods.payForArtwork(owner_address, artwork_price, artwork_id).send({
//             from: buyer_address,
//         })
//         //console.log("pay successfully", result);
//         return true;
//     } catch(err) {
//         console.log("pay for artwork error", err);
//         return false;
//     }
    
// }

module.exports = {
    addNewAccount,
};

