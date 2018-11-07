const Web3 = require('web3');
const ACG20 = require('../static/ACG20.json');
const ACG721 = require('../static/ACG721.json');
const deployConf = require('../static/deployConf.json');

// function ACGChainAPI() {
    const rpc_provider = "http://47.91.56.32:32000";
    let web3 = new Web3(new Web3.providers.HttpProvider(rpc_provider));

    const address_20 = deployConf.acg20_address;
    const address_721 = deployConf.acg721_address;
    const interface_20 = JSON.parse(ACG20.abiString);
    const interface_721 = JSON.parse(ACG721.abiString)

    const instance20 = new web3.eth.Contract(interface_20, address_20);
    const instance721 = new web3.eth.Contract(interface_721, address_721);

    const new_account_topup_value = 1e2;
    const post_artwork_incentive = 1e3;
    const administrator = deployConf.administrator;

    async function _connect_to_chain() {
        const deployConf = require('../static/deployConf.json');
        // set the provider you want from Web3.providers
        web3Obj = new Web3(new Web3.providers.HttpProvider(rpc_provider));
        //web3Obj = new Web3(new Web3.providers.WebsocketProvider(deployConf.server));
        // Exception is thrown if the connection failed
        await web3Obj.eth.net.isListening();

        // Set administrator
        
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

    async function prepare() {

        // Connect to private chain
        [web3, administrator] = await _connect_to_chain();
        console.log("Connected to RPC server, set administrator to ", administrator, "...");

        // Retrieve deployed contract instances
        [instance20, instance721] = await _retrieve_deployed_contracts();

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
        var user = 0x0; //default value for new user;
        // Create a new account on the node
        try {
            user_address = await web3.eth.personal.newAccount(password)
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
     * @param {*} artwork_info provided by user
     */
    async function post_new_artwork(user_address, artwork_info) {
        // Generate an artwork ID, first get current timestamp,
        // i.e., the number of milliseconds since 1 January 1970 00:00:00
        let artwork_id = new Date().getTime();
        // append a 3-digit random number
        artwork_id = (artwork_id*1e3) + Math.floor(Math.random()*1e3);
        // Generate meta data
        const metadata = JSON.stringify(artwork_info);

        // unlock account for 1 minutes
        const unlockAccount = await unlock_account(user_address, 60);
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

    async function update_artwork(artwork_id, artwork_info) {
        // Generate meta data
        const metadata = JSON.stringify(artwork_info);

        // Update meta data with the given token ID
        const gasValue = await instance721.methods.updateMetadata(artwork_id, metadata).estimateGas({
            from: administrator
        });
        await instance721.methods.updateMetadata(artwork_id, metadata).send({
            from: administrator,
            gas: Math.floor(gasValue * 1.5)
        });
    }

    /**
     * This function also return a promise, need to be handle
     * return value: 0x0    if anything went wrong
     * return value: transactionHash value: if nothing wrong.
     * @param {*} buyer_address provided by user
     * @param {*} owner_address provided by user
     * @param {*} artwork_id    provided by user
     * @param {*} artwork_price provided by user
     */
    const buy_artwork = async (buyer_address, owner_address, artwork_id, artwork_price) => {

        let transaction_id = 0x0;
        let metadata;

        // Retrieve artwork infomation to calculate commission
        const trans_get_artwork_info = instance721.methods.referencedMetadata(artwork_id).call();
        const trans_get_owner = instance721.methods.ownerOf(artwork_id).call();

        try {
            metadata = await trans_get_artwork_info;
            const owner = await trans_get_owner;
            if (owner !== owner_address) {
                console.log("Owner mismatch contract record");
                return transaction_id;
            }
        } catch (err) {
            console.log("Failed to get artwork information");
            return transaction_id;
        }

        // Calculate commission
        artwork_info = JSON.parse(metadata);
        const commission = Math.floor(artwork_price * Number(artwork_info.loyalty));
        const price = artwork_price - commission;

        // Ask seller to approve contract ACG20 to transfer the specified artwork
        const trans_approve_artwork = instance721.methods.approve(
            address_20, artwork_id).send({
            from: owner_address
        });
        try {
            await trans_approve_artwork;
        } catch (err) {
            console.log("Failed on approve() from artwork seller");
            return transaction_id;
        }

        // Submit the purchase transaction
        try {
            const gasValue = await instance20.methods.approveAndCall(
                owner_address, price, commission, artwork_id).estimateGas({
                from: buyer_address
            });
            const receipt = await instance20.methods.approveAndCall(
                owner_address, price, commission, artwork_id).send({
                    from: buyer_address,
                    gas: Math.floor(gasValue*1.5)
                });
            transaction_id = receipt.transactionHash;        
        } catch (err) {
            console.log("Failed on approveAndCall() from buyer");
            return transaction_id;
        }
        return transaction_id;
    }

    /**
     * This function also return a promise
     * return value: 0x0    if anything went wrong
     * return value: transactionHash value, if nothing wrong.
     * @param {*} buyer_address provided by user
     * @param {*} value         provided by user
     */
    async function buy_token(buyer_address, value) {
        let transaction_id = 0x0;   //default value
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

    /**
     * This function also return a promise
     * return value: 0x0    if anything went wrong
     * return value: transactionHash value, if nothing wrong.
     * @param {*} buyer_address provided by user
     * @param {*} artwork_id    provided by user
     * @param {*} artwork_prize provided by user
     */
    async function freeze_token(buyer_address, artwork_id, artwork_prize) {
        let transaction_id = 0x0;
        // Check artwork status is in auction
        const artwork_info = await instance721.methods.referencedMetadata(artwork_id).call();
        if (artwork_info.length <= 0) {
            console.log("Given artwork ID is not stored in the contract");
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
            Console.log("Freezing token error as: ", err);
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
     * The function to unlock an account when ever we need to make a transaction
     */
    async function unlock_account(account_address, unlock_time) {
        let result = true;
        try {
            await web3.eth.personal.unlockAccount(account_address, "Test@2018", unlock_time);
            var newBalance = await web3.eth.getBalance(account_address)
            console.log("balance of new account: ", newBalance);
        } catch(err) {
            result = false;
            console.log("Something wrong with unlock account as ", err);
        }
        return result;
    }

    module.exports = {
        // ----------------------------
        // Auxiliary functions:
        // ----------------------------
        prepare: prepare,
        safeguard_account_balance: safeguard_account_balance,
        get_contracts_instrance: get_contracts_instrance,
        simple_test_on_environment: simple_test_on_environment,
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
        check_transaction: check_transaction
        // All those above API are promises, need to handle as promises.
    };
// }