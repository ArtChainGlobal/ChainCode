const Web3 = require('web3');

function ACGChainAPI() {

    let web3;
    let administrator;

    let contract20;
    let contract721;

    let address_20;
    let address_721;

    let interface_20;
    let interface_721;

    const new_account_topup_value = 1e2;
    const post_artwork_incentive = 1e3;

    async function _connect_to_chain() {
        const deployConf = require('../static/deployConf.json');
        // set the provider you want from Web3.providers
        //web3 = new Web3(new Web3.providers.HttpProvider(rpc_provider));
        web3Obj = new Web3(new Web3.providers.WebsocketProvider(deployConf.server));
        // Exception is thrown if the connection failed
        await web3Obj.eth.net.isListening();

        // Set administrator
        admin = deployConf.administrator;
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
        // Create a new account on the node
        const user = await web3.eth.personal.newAccount(password);
        // Top up some eth for new user
        await web3.eth.sendTransaction({
            from: administrator,
            to: user,
            value: web3.utils.toWei(value.toString(), "ether")
        });
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
        [contract20, contract721] = await _retrieve_deployed_contracts();

        return web3;
    }

    async function simple_test_on_environment() {
        console.log("******** Simple test ********");
        const name = await contract20.methods.name().call();
        const owner = await contract721.methods.owner().call();
        console.log("Simple test: ACG20 name =", name);
        console.log("Simple test: Owner of ACG721 =", owner);
    }

    function get_contracts_instrance() {
        return [contract20, contract721];
    }

    async function add_new_user(password) {
        // Create a new account on the node
        const user_address = await web3.eth.personal.newAccount(password);
        // Top up some eth for new user
        await web3.eth.sendTransaction({
            from: administrator,
            to: user_address,
            value: web3.utils.toWei(new_account_topup_value.toString(), "ether")
        });
        return user_address;
    }

    async function post_new_artwork(user_address, artwork_info) {
        // Generate an artwork ID, first get current timestamp,
        // i.e., the number of milliseconds since 1 January 1970 00:00:00
        let artwork_id = new Date().getTime();
        // append a 3-digit random number
        artwork_id = (artwork_id*1e3) + Math.floor(Math.random()*1e3);
        // Generate meta data
        const metadata = JSON.stringify(artwork_info);

        // Store 721 Token for user, because we don't know the size of
        // meta data, so need first estimate required gas amount for the transaction
        const gasValue = await contract721.methods.mintWithMetadata(user_address, artwork_id, metadata).estimateGas({
            from: administrator
        });
        const trans_721_mint = contract721.methods.mintWithMetadata(user_address, artwork_id, metadata).send({
            from: administrator,
            gas: Math.floor(gasValue * 1.5)
        });
        // Store 20 Token as prize of posting artwork
        const trans_20_mint = contract20.methods.mint(user_address, post_artwork_incentive).send({
            from: administrator
        });

        // Waiting for the operation on the chain
        await trans_20_mint;
        await trans_721_mint;

        return artwork_id;
    }

    async function update_artwork(artwork_id, artwork_info) {
        // Generate meta data
        const metadata = JSON.stringify(artwork_info);

        // Update meta data with the given token ID
        const gasValue = await contract721.methods.updateMetadata(artwork_id, metadata).estimateGas({
            from: administrator
        });
        await contract721.methods.updateMetadata(artwork_id, metadata).send({
            from: administrator,
            gas: Math.floor(gasValue * 1.5)
        });
    }

    const buy_artwork = async (buyer_address, owner_address, artwork_id, artwork_price) => {

        // Retrieve artwork infomation to calculate commission
        const trans_get_artwork_info = contract721.methods.referencedMetadata(artwork_id).call();

        // Ask seller to approve contract ACG20 to transfer the specified artwork
        const trans_approve_artwork = contract721.methods.approve(
            address_20, artwork_id).send({
            from: owner_address
        });

        // Calculate commission
        const metadata = await trans_get_artwork_info;
        artwork_info = JSON.parse(metadata);
        const commission = Math.floor(artwork_price * Number(artwork_info.loyalty));
        const price = artwork_price - commission;

        // Wait for the return of approve
        await trans_approve_artwork;

        // Submit the purchase transaction
        const gasValue = await contract20.methods.approveAndCall(
            owner_address, price, commission, artwork_id).estimateGas({
            from: buyer_address
        });
        const receipt = await contract20.methods.approveAndCall(
            owner_address, price, commission, artwork_id).send({
                from: buyer_address,
                gas: Math.floor(gasValue*1.5)
            });

        return receipt.transactionHash;
/*
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
        */
    }

    async function buy_token(buyer_address, value) {
        const receipt = await contract20.methods.mint(buyer_address, value).send({
            from: administrator
        });

        return receipt.transactionHash;
    }

    async function freeze_token(buyer_address, artwork_id, artwork_prize) {
        // Check artwork status is in auction
        const artwork_info = await contract721.methods.referencedMetadata(artwork_id).call();
        if (artwork_info.length <= 0) {
            console.log("Given artwork ID is not stored in the contract");
            return 0;
        }

        const gasValue = await contract20.methods.freeze(buyer_address, artwork_prize, artwork_id).estimateGas({
            from: administrator
        });
        // freeze buyer's ACG20 token
        const receipt = await contract20.methods.freeze(buyer_address, artwork_prize, artwork_id).send({
            from: administrator,
            gas: Math.floor(gasValue * 1.5)
        });

        return receipt.transactionHash;
    }

    async function check_artwork(artwork_id) {
        // Query owner according to token ID
        const trans_query_owner = contract721.methods.ownerOf(artwork_id).call();
        // Query metadata according to token ID
        const trans_query_metadata = contract721.methods.referencedMetadata(artwork_id).call();
        // Wait for the return values
        const owner_address = await trans_query_owner;
        const metadataString = await trans_query_metadata;
        const artwork_info = JSON.parse(metadataString);
        return [owner_address, artwork_info];
    }

    async function check_user(user_address) {
        const type = "";

        // Query balance of token ACG721
        const trans_query_balance_721 = contract721.methods.balanceOf(user_address).call();
        // Query balance of token ACG20
        const trans_query_balance_20 = contract20.methods.balanceOf(user_address).call();

        // Wait for value of ACG721 balance
        const user_balance_acg721 = await trans_query_balance_721;
        const trans_query_artwork_list = [];
        // Query the artwork belonging to the user
        for (let artwork_index=0; artwork_index<user_balance_acg721; artwork_index++) {
            trans_query_artwork_list[artwork_index] = contract721.methods.listOfOwnerTokens(user_address, artwork_index).call();
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

    return {
        // ----------------------------
        // Auxiliary functions:
        // ----------------------------
        prepare: prepare,
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
    };
}

module.exports = ACGChainAPI;