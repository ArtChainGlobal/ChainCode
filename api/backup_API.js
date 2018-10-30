
const Web3 = require('web3');
const web3Standard = require('web3');
//import the token which was deployed already from the deployment
// the deployed addresses of two contracts and their ABI were copied on these ABI.
// These addresses and ABI will change if we re-deploy these contract, replace with new addresses + ABI needed.
// All we need is import them.
const ACG20Token = require('../contract_ABI/ACG20Token');
const ACG721Token = require('../contract_ABI/ACG721Token');

//import ip address and port from static json file, based on RPC ip address and port of nodes
const NodeIPAddresses = require('../static/contract_information/node_IP_address.json');

// implement providers for all nodes of the private chain
const web3Array = new Array();
NodeIPAddresses.forEach(async (element) => {
    web3Array.push(new Web3(new Web3.providers.HttpProvider(element.IPAddress)));
});

// define global constants
const node0_accounts = await web3Array[0].eth.getAccounts();
const ADMIN_ACCOUNT = node0_Accounts[0];    //the owner, founder of both contracts

/**
 * Create new user module
 * Password need provided by user
 */
const addNewAccount = async (passward) => {
    //the new account will be created on node 0 of the private chain    
    const DEFAULT_ACCOUNT = 0x0;  //default account
    const DEFAULT_ETHER_FOR_NEW_ACCOUNT = await Web3.utils.toWei('1000000', 'ether'); //1,000,000 ethers
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
            const fromAddress = node0_accounts[0];
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
const buy_artwork = async (buyer_address, owner_address, artworkid, artwork_price) => {
    // initiate transaction id
    let transaction_id = 0x0;     //expecting an transaction hash    
    // check the artworkid is existing in the system or not
    const existingOnwer = await ACG721Token.methods.ownerOf(artworkid).call();
    const tokenCurrentBalanceOfBuyer = await ACG20Token.methods.balanceOf(buyer_address).call();
    if ((existingOnwer === owner_address) && (tokenCurrentBalanceOfBuyer >= artwork_price)) {  
        //only continue if the owner is real and correct, the buyer have enough token

    }
    
    try {
        // buyer approve for seller to spend his token
        const buyerApproval = await ACG20Token.methods.approve(buyer_address, owner_address, artwork_price).send({
            from: buyer_address,
        });
        // const newAllowance = await ACG20Token.methods.allowance(buyer_address, owner_address).call();            
        // console.log("allowance for owner is: ", newAllowance);
        // Onwer need to approve for transfer his artwork
        const ownerApproval = await ACG721Token.methods.approve(owner_address, buyer_address, artworkid).send({
            from: owner_address,
        });
        // const approvedAddressOfToken = await ACG721Token.methods.getApprovedAddressOfArtToken(artworkid).call();
        // console.log("token was approved to this address: ", approvedAddressOfToken);
        // if these above approvals were ok, then continue the transfer process
        if (buyerApproval) {
            if (ownerApproval) {
                console.log("transferming is in progress ...");
                    //estimate gas
                const gasEstimated = await ACG721Token.methods.receiveApproval(buyer_address, owner_address, artwork_price, artworkid).estimateGas({
                    from: ADMIN_ACCOUNT,
                });
                // console.log(gasEstimated);
                try {
                    const result = await ACG721Token.methods.receiveApproval(buyer_address, owner_address, artwork_price, artworkid).send({
                        from: ADMIN_ACCOUNT,
                        gas: gasEstimated
                    });
                    // console.log("pay successfully", result.transactionHash);
                    transaction_id = result.transactionHash;
                } catch(err) {
                    console.log("perform transfer token as well as artwork was failed: ", err);
                }                
            }            
        }
        
    } catch(err) {
        console.log("transaction process failed: ", err);
    }        
    return transaction_id;
}

/**
 * BUY TOKEN INTERFACE
 */
async function buy_token(buyer_address, value) {
    // check if the account address is existing to continue
    const existingAccountCheck = false;
    node0_accounts.forEach((account) => {
        if (buyer_address === account) {
            existingAccountCheck = true;
            break;
        }
    });
    if (existingAccountCheck) {
        const receipt = await ACG20Token.methods.mint(buyer_address, value).send({
            from: administrator
        });
    
        return receipt.transactionHash;
    }    
}

async function freeze_token(buyer_address, artwork_id, artwork_prize) {
    // initiate the transaction id
    let transaction_id = 0x0;
    // Check artwork status is in auction
    const artwork_info = await ACG721Token.methods.referencedMetadata(artwork_id).call();
    if (artwork_info.length <= 0) {
        console.log("Given artwork ID is not stored in the contract");
        return 0x0;
    }
    try {
        const gasValue = await AGC20Token.methods.freeze(buyer_address, artwork_prize, artwork_id).estimateGas({
            from: ADMIN_ACCOUNT,
        });
        // freeze buyer's ACG20 token
        const receipt = await AGC20Token.methods.freeze(buyer_address, artwork_prize, artwork_id).send({
            from: ADMIN_ACCOUNT,
            gas: gasValue
        });
        transaction_id = receipt.transactionHash;
    } catch(err) {
        console.log("freeze token process error: ", err);
    }
    return transaction_id;
}

async function check_artwork(artwork_id) {
    // Query owner according to token ID
    const owner_address = await ACG721Token.methods.ownerOf(artwork_id).call();
      // Query metadata according to token ID
    const metadataString = await ACG721Token.methods.referencedMetadata(artwork_id).call();
    const artwork_info = JSON.parse(metadataString);
    return [owner_address, artwork_info];
}

async function check_user(user_address) {
    const type = "";

    // Query balance of token ACG721
    const trans_query_balance_721 = contract721.instance.methods.balanceOf(user_address).call();
    // Query balance of token ACG20
    const trans_query_balance_20 = contract20.instance.methods.balanceOf(user_address).call();

    // Wait for value of ACG721 balance
    const user_balance_acg721 = await trans_query_balance_721;
    const trans_query_artwork_list = [];
    // Query the artwork belonging to the user
    for (let artwork_index=0; artwork_index<user_balance_acg721; artwork_index++) {
        trans_query_artwork_list[artwork_index] = contract721.instance.methods.listOfOwnerTokens(user_address, artwork_index).call();
    }
    // Wait for the return values
    const user_balance_acg20 = await trans_query_balance_20;
    const artwork_id_list = [];
    for (let artwork_index=0; artwork_index<user_balance_acg721; artwork_index++) {
        artwork_id_list[artwork_index] = await trans_query_artwork_list[artwork_index];
    }

    return [type, user_balance_acg20, user_balance_acg721, artwork_id_list];
}

async function check_transaction(transaction_id) {
    return web3Array[0].eth.getTransaction(transaction_id);
}

module.exports = {
    addNewAccount,
    buy_artwork,
    buy_token,
    freeze_token,
    check_artwork,
    check_transaction,
    check_user,
};

