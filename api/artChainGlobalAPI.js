const Web3 = require('web3');

const new_account_topup_value = 1e2;
const post_artwork_incentive = 1e3;

// Setup environment when this file is imported
let web3, administrator;
[web3, administrator] = _connect_to_chain("http");

// Fetch the deployed contracts from network
let instance20, instance721;
[instance20, instance721] = _retrieve_deployed_contracts();

function _connect_to_chain(protocol) {
    const deployConf = require('../static/deployConf.json');
    let web3Obj;
    // set the provider you want from Web3.providers
    if (protocol == "http") {
        web3Obj = new Web3(new Web3.providers.HttpProvider(deployConf.server));
    } else if (protocol == "ws") {
        web3Obj = new Web3(new Web3.providers.WebsocketProvider(deployConf.server));
    }
    // Exception is thrown if the connection failed
    //await web3Obj.eth.net.isListening();

    // Set administrator
    const admin = deployConf.administrator;
    
    return [web3Obj, admin];
}

function _retrieve_deployed_contracts() {
    const ACG20 = require('../static/ACG20.json');
    const ACG721 = require('../static/ACG721.json');
    const deployConf = require('../static/deployConf.json');

    address_20 = deployConf.acg20_address;
    address_721 = deployConf.acg721_address;
    interface_20 = JSON.parse(ACG20.abiString);
    interface_721 = JSON.parse(ACG721.abiString)

    instance20 = new web3.eth.Contract(interface_20, address_20);
    instance721 = new web3.eth.Contract(interface_721, address_721);

    console.log("Retrieve contract ACG20 from ", address_20);
    console.log("Retrieve contract ACG721 from ", address_721);

    return [instance20, instance721];
}

async function _create_new_account_and_top_up(password, value) {
    var user = 0x0; //initiate default value for user
    // Create a new account on the node
    try {
        user = await web3.eth.personal.newAccount(password);
        // Top up some eth for new user
        try {
            await web3.eth.sendTransaction({
                from: administrator,
                to: user,
                value: web3.utils.toWei(value.toString(), "ether")
            });
        } catch(err) {
            user = 0x0;
            console.log("Top up for new account error ", err);
        }
       
    } catch(err) {
        console.log("Creating new user account err: ", err);
    }
   
    return user;
};

async function _create_batch_accounts_and_top_up(user_number, password, prefund_eth) {
    console.log("API: ******** Add new users for test ********");
    let users = [];
    for (let i=0; i<user_number; i++) {
        users[i] = await web3.eth.personal.newAccount(password);
        // send some eth to new user
        await web3.eth.sendTransaction({
            from: administrator,
            to: users[i],
            value: web3.utils.toWei(prefund_eth.toString(), "ether")
        });
    };
    return users;
}

async function _retrieve_batch_accounts_from_node(user_number) {
    let users = await web3.eth.getAccounts();
    // First account is supposed to be administrator
    // Need at least (user_number) more accounts for general users
    if (users.length < user_number+1) {
        error("There aren't as many accounts as expected ...");
    }
    return users.slice(2, 2+user_number);
}

/**
 * This function return a promise
 * use to unlock the account whenever we need a transaction on the account
 * @param {*} account_address provided by user
 * @param {*} password        provided by user
 * @param {*} unlock_time     provided by admin
 */
async function unlock_account(account_address, password, unlock_time) {
    let result = true;
    try {
        console.log("unlocking account " + account_address +  " for " + unlock_time + " seconds");
        await web3.eth.personal.unlockAccount(account_address, password, unlock_time);
    } catch(err) {
        result = false;
        console.log("Failed with unlock account as ", err);
    }
    return result;
}

function prepare(protocol = "http") {

    // Connect to private chain
    //[web3, administrator] = await _connect_to_chain(protocol);
    //console.log("Connected to RPC server, set administrator to ", administrator, "...");

    // Retrieve deployed contract instances
    //[instance20, instance721] = await _retrieve_deployed_contracts();

    return web3;
}

async function safeguard_account_balance(account_address) {
    const account_balance_wei = await web3.eth.getBalance(account_address);
    const account_balance_eth = web3.utils.fromWei(account_balance_wei, "ether");

    // Top up account if its balance is lower than specific value
    if (Number(account_balance_eth) < new_account_topup_value) {
        await web3.eth.sendTransaction({
            from: administrator,
            to: account_address,
            value: web3.utils.toWei(new_account_topup_value.toString(), "ether")
        });
    };
}

async function simple_test_on_environment() {
    console.log("******** Simple test ********");
    const name = await instance20.methods.name().call();
    const owner = await instance721.methods.owner().call();
    console.log("Simple test: ACG20 name =", name);
    console.log("Simple test: Owner of ACG721 =", owner);
}

function get_contracts_instrance() {
    return [instance20, instance721];
}

/**
 * This function always returns a promise,
 * return value: 0x0 for failure to create new account
 * return value: address if success to create new account
 * error messgae can be seen at the console
 * @param {*} password provided by user
 */
async function add_new_user(password) {
    let user_address = 0x0; //default value for new user;
    // Create a new account on the node
    try {
        user_address = await web3.eth.personal.newAccount(password);
        // Top up some eth for new user
        await safeguard_account_balance(user_address);
    } catch(err) {
        console.log("Create new user failed ", err);
    }        
    return user_address;
}

/**
 * This function will return a promise (artwork_id), so promise need to be handle
 * return value: 0 if any went wrong
 * return value: artwork_id if nothing wrong
 * @param {*} user_address provided by user
 * @param {*} password     provided by user
 * @param {*} artwork_info provided by user
 */
async function post_new_artwork(user_address, password, artwork_info) {
    // Generate an artwork ID, first get current timestamp,
    // i.e., the number of milliseconds since 1 January 1970 00:00:00
    let artwork_id = new Date().getTime();
    // append a 3-digit random number
    artwork_id = (artwork_id*1e3) + Math.floor(Math.random()*1e3);
    // Generate meta data
    const metadata = JSON.stringify(artwork_info);

    // unlock account for 60 seconds
    const unlockAccount = await unlock_account(user_address, password, 60);
    if (unlockAccount) {
        // Store 721 Token for user, because we don't know the size of
        // meta data, so need first estimate required gas amount for the transaction
        try {
            const gasValue = await instance721.methods.mintWithMetadata(user_address, artwork_id, metadata).estimateGas({
                from: administrator
            });
            const trans_721_mint = instance721.methods.mintWithMetadata(user_address, artwork_id, metadata).send({
                from: administrator,
                gas: Math.floor(gasValue * 1.5)
            });
            // Store 20 Token as prize of posting artwork
            const trans_20_mint = instance20.methods.mint(user_address, post_artwork_incentive).send({
                from: administrator
            });
    
            // Waiting for the operation on the chain
            await trans_20_mint;
            await trans_721_mint;
        } catch(err) {
            artwork_id = 0;
            console.log("something wrong with topup ACG20 and ACG721 ", err);
        }       
    } else {
        console.log("unlock account error");
        artwork_id = 0;
    }
    return artwork_id;
}


/**
 * this function also return a promise
 * artwork_status would be one of: presenting, selling, auction
 * @param {*} artwork_id    provided by user
 * @param {*} artwork_info  provided by user, or default = ""
 * @param {*} artwork_status provided by user, or default = "presenting"
 */
async function update_artwork(owner_address, password, artwork_id, artwork_info) {
    let transaction_id = 0x0;
    // need to verify owner;
    if (!verify_artwork_owner(owner_address, artwork_id)) {
        console.log("mismatch owner_address of the artwork ID, or it does not exist");
        return transaction_id;
    }
    if (artwork_info.status == "selling" || artwork_info.status == "auction") {
        // at first, unlock the account of owner for 30 second
        const unlockAccount = await unlock_account(owner_address, password, 60);
        if (!unlockAccount) {
            console.log("unlock accoung of owner err");
            return transaction_id;
        }
        //them, the owner will approve for administraor to sell his artwork at the price
         // Ask seller to approve contract ACG20 to transfer the specified artwork            
        try {
            await instance721.methods.approve(address_20, artwork_id).send({
                from: owner_address
            });
        } catch (err) {
            console.log("Failed on approve() from artwork seller");
            return transaction_id;
        }
    }
    // Generate meta data
    if (artwork_info != "") {
        const metadata = JSON.stringify(artwork_info);
        try {
            // Update meta data with the given token ID
            const gasValue = await instance721.methods.updateMetadata(artwork_id, metadata).estimateGas({
                from: administrator
            });
            const updateResult = await instance721.methods.updateMetadata(artwork_id, metadata).send({
                from: administrator,
                gas: Math.floor(gasValue * 1.5)
            });
            return updateResult.transactionHash;
        } catch(err) {
            console.log("update artwork_info error as ", err);
            return transaction_id;
        }            
    }        
}

/**
 * This function also return a promise, need to be handle
 * return value: 0x0    if anything went wrong
 * return value: transactionHash value: if nothing wrong.
 * artwork_info: is an object with type (string), loyalty (float [0-1]), status (string), artist(string) 
 * let artwork_info = {
 *       type: "painting",
 *       artist: "Qin",
 *       loyalty: 0.15,
 *       status: "presenting",
 *       price: 50.00,
 *   };
 * 
 * @param {*} buyer_address provided by user
 * @param {*} owner_address provided by user
 * @param {*} artwork_id    provided by user
 * @param {*} artwork_price provided by user
 */
const buy_artwork = async (buyer_address, password, owner_address, artwork_id, artwork_price) => {

    let transaction_id = 0x0;
    if (!verify_artwork_owner(owner_address, artwork_id)) {
        console.log("Mismatch owner_address or artwork does not exist");
        return transaction_id;
    }
    // unlock the account for 60 seconds to perform the transaction
    const unlockBuyerAccount = await unlock_account(buyer_address, password, 60);
    if (!unlockBuyerAccount) {
        console.log("unlock accoung of buyer err");
        return transaction_id;
    }
    // Retrieve artwork infomation to calculate commission
    const metadata = await instance721.methods.referencedMetadata(artwork_id).call();
    // Calculate commission
    artwork_info = JSON.parse(metadata);

    // calculate commision
    let commission;
    if (!isNaN(artwork_info.loyalty)) {
        commission = 0;
    }
    commission = Math.floor(artwork_price * Number(artwork_info.loyalty));
    
    const price = artwork_price - commission;  

    // Submit the purchase transaction
    try {
        //await instance721.methods.allowance(buyer_address, address_20)
        const gasValue = await instance20.methods.approveAndCall(
            owner_address, price, commission, artwork_id).estimateGas({
            from: buyer_address
        });
        const receipt = await instance20.methods.approveAndCall(
            owner_address, price, commission, artwork_id).send({
                from: buyer_address,
                gas: Math.floor(gasValue*1.5)
            });
        return receipt.transactionHash;        
    } catch (err) {
        console.log("Failed on approveAndCall() from buyer");
        return transaction_id;
    }
}

/**
 * This function also return a promise
 * return value: 0x0    if anything went wrong
 * return value: transactionHash value, if nothing wrong.
 * @param {*} buyer_address provided by user
 * @param {*} password      provided by user
 * @param {*} value         provided by user
 */
async function buy_token(buyer_address, password, value) {
    let transaction_id = 0x0;   //default value
    // unlock the buyer account for 30 seconds to perform the transaction
    const unlockAccount = await unlock_account(buyer_address, password, 2);
    if (unlockAccount) {
        try {
            const receipt = await instance20.methods.mint(buyer_address, value).send({
                from: administrator
            });
            return receipt.transactionHash;
        } catch(err) {
            console.log("topup ACG20 token error ", err);
            return transaction_id;
        }  
    }     
}

/**
 * This function also return a promise
 * return value: 0x0    if anything went wrong
 * return value: transactionHash value, if nothing wrong.
 * @param {*} buyer_address provided by user
 * @param {*} artwork_id    provided by user
 * @param {*} artwork_prize provided by user
 */
async function freeze_token(buyer_address, password, artwork_id, artwork_prize) {
    let transaction_id = 0x0;
    // Check artwork status is in auction
    const artwork_info = await instance721.methods.referencedMetadata(artwork_id).call();
    if (artwork_info.length <= 0) {
        console.log("Given artwork ID is not stored in the contract");
        return transaction_id;
    }
    // unlock the account of buyer for 60 second
    const unlockBuyerAccount = await unlock_account(buyer_address, password, 60);
    if (!unlockBuyerAccount) {
        console.log("unlock accoung of buyer err");
        return transaction_id;
    }

    // then, buyer approve for owner to freeze his token
    const approveResult = await instance20.methods.approve(administrator, artwork_prize).send({
        from: buyer_address,
    })
    if (!approveResult) {
        console.log("buyer approval process for freezing tokens error as ");
        return transaction_id;
    }
    try {
        const gasValue = await instance20.methods.freeze(buyer_address, artwork_prize, artwork_id).estimateGas({
            from: administrator
        });
        // freeze buyer's ACG20 token
        const receipt = await instance20.methods.freeze(buyer_address, artwork_prize, artwork_id).send({
            from: administrator,
            gas: Math.floor(gasValue * 1.5)
        });    
        return receipt.transactionHash;
    } catch(err) {
        console.log("Freezing token error as: ", err);
        // await instance20.methods.unfreeze(artwork_id).send({
        //     from: administrator,
        // });
        return transaction_id;
    }        
}

/**
 * this function also return a promise
 * return value: the function will return an array of owner_address and artwork_info
 * return value for owner_address: 0x0 if mismatch artwork_id or it does not exist
 * return value for artowrk_info: "" - empty string, if the artwork_id provided does not exist
 * return value for other cases: owner_address: address, artwork_infor: a string
 * @param {*} artwork_id provided by user
 */
async function check_artwork(artwork_id) {
    let owner_address = 0x0;    //initiate owner_address as default value
    let artwork_info = "";      //default value for the artwork_info
    // Query owner according to token ID
    try {
        owner_address = await instance721.methods.ownerOf(artwork_id).call();
    } catch(err) {
        console.log("mismatch artwork_id or it does not exist ", err);
    }
    
    try {
        const metadataString = await instance721.methods.referencedMetadata(artwork_id).call();
        artwork_info = JSON.parse(metadataString);
    } catch(err) {
        console.log("the artwork_id provided does not exist ", err);
    }               
    return [owner_address, artwork_info];
}

/**
 * this function also return a promise
 * return value: an array of type, user_balance_acg20, user_balance_acg721, artwork_id_list
 * return value: artwork_id_list: is also an array of artowrk_id
 * @param {*} user_address provided by user
 */
async function check_user(user_address) {
    const type = "";

    // Query balance of token ACG721
    const trans_query_balance_721 = instance721.methods.balanceOf(user_address).call();
    // Query balance of token ACG20
    const trans_query_balance_20 = instance20.methods.balanceOf(user_address).call();

    // Wait for value of ACG721 balance
    const user_balance_acg721 = await trans_query_balance_721;
    const trans_query_artwork_list = [];
    // Query the artwork belonging to the user
    for (let artwork_index=0; artwork_index<user_balance_acg721; artwork_index++) {
        trans_query_artwork_list[artwork_index] = instance721.methods.listOfOwnerTokens(user_address, artwork_index).call();
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
    return web3.eth.getTransaction(transaction_id);
}

/**
 * Verify owner of an given artwork
 */
async function verify_artwork_owner(owner_address, artwork_id) {
    let result = true;
    // Query owner according to token ID
    try {
        actual_owner_address = await instance721.methods.ownerOf(artwork_id).call();
        if (owner_address != actual_owner_address) {
            result = false;
            console.log("mismatch owner_address of that artwork");
        }
    } catch(err) {
        console.log("Artwork_id does not exist ", err);
        result = false;
    }
    return result;
}

/**
 * 
 * @param {*} artwork_id proficed by user to get the hieghest bidder currently
 */
async function get_high_bidder(artwork_id) {
    let highest_bidder = 0x0;
    let hieghest_bid = 0;
    // verify if this artwork is genuin
    const verifyArtwork = await check_artwork(artwork_id);
    if (verifyArtwork[0] != 0x0) {
        highest_bidder = await instance20.methods.highestBidder(artwork_id).call();
        hieghest_bid = await instance20.methods.highestBid(artwork_id).call();
    }
    return [highest_bidder, hieghest_bid];
}


async function lockAccount(account) {
    try {
        await web3.eth.personal.lockAccount(account);
        console.log(`lock account ${account} successfully`);
    } catch(err) {
        console.log(`lock account ${account} failed`);
    }
}

module.exports = {
    // ----------------------------
    // Auxiliary functions:
    // ----------------------------
    prepare: prepare,
    safeguard_account_balance: safeguard_account_balance,
    get_contracts_instrance: get_contracts_instrance,
    simple_test_on_environment: simple_test_on_environment,
    get_high_bidder: get_high_bidder,
    lockAccount: lockAccount,
    unlock_account: unlock_account,
    // ----------------------------
    // Standard API definition:
    // ----------------------------
    add_new_user: add_new_user,
    post_new_artwork: post_new_artwork,
    update_artwork: update_artwork,
    buy_artwork: buy_artwork,
    buy_token: buy_token,
    freeze_token: freeze_token,
    check_artwork: check_artwork,
    check_user: check_user,
    check_transaction: check_transaction,   
    // All those above API are promises, need to handle as promises.
};
