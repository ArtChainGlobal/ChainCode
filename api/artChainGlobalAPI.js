const Web3 = require('web3');
const path = require('path');
const fs = require('fs');
const solc = require('solc');

function ACGChainAPI() {

    const contract20 = {abiString:"", bytecode:"", instance:""};
    const contract721 = {abiString:"", bytecode:"", instance:""};

    let web3;
    let administrator;

    const new_account_topup_value = 1e2;
    const post_artwork_incentive = 1e3;

    async function connect_to_chain(rpc_provider) {
        if (typeof web3 !== 'undefined') {
            console.log("API: Connect to an existing web3 provider ...");
            web3 = new Web3(web3.currentProvider);
        } else {
            // set the provider you want from Web3.providers
            console.log("API: Set a new web3 provider ...");
            //web3 = new Web3(new Web3.providers.HttpProvider(rpc_provider));
            web3 = new Web3(new Web3.providers.WebsocketProvider(rpc_provider));
        }
        // Exception is thrown if the connection failed
        await web3.eth.net.isListening();
        accounts = await web3.eth.getAccounts();
        administrator = accounts[0];
        console.log("Connected to RPC server, set administrator to ", administrator, "...");
        return web3;
    }

    function compile_contract_from_source(contract_folder) {
        const CONTRACT_ACG20_PATH = path.resolve(contract_folder, 'acg20.sol');
        const CONTRACT_ACG721_PATH = path.resolve(contract_folder, 'acg721.sol');
        const LIB_SAFEMATH_PATH = path.resolve(contract_folder, '..', 'helpers', 'SafeMath.sol');
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

    function read_in_compiled_contract_JSON(contract_folder) {
        const CONTRACT_ACG20_PATH = path.resolve(contract_folder, "ACG20.json");
        const CONTRACT_ACG20_SRC = fs.readFileSync(CONTRACT_ACG20_PATH, 'utf8');

        const compiledAcg20 = JSON.parse(CONTRACT_ACG20_SRC);
        contract20.abiString = JSON.stringify(compiledAcg20.abi);
        contract20.bytecode = compiledAcg20.bytecode;

        const CONTRACT_ACG721_PATH = path.resolve(contract_folder, 'ACG721.json');
        const CONTRACT_ACG721_SRC = fs.readFileSync(CONTRACT_ACG721_PATH, 'utf8');
        
        const compiledAcg721 = JSON.parse(CONTRACT_ACG721_SRC);
        contract721.abiString = JSON.stringify(compiledAcg721.abi);
        contract721.bytecode = compiledAcg721.bytecode;
    }

    function retrieve_deployed_contracts(address) {
        contract20.instance = new web3.eth.Contract(JSON.parse(contract20.abiString), address[0]);
        contract721.instance = new web3.eth.Contract(JSON.parse(contract721.abiString), address[1]);
    }

    async function deploy_new_contracts() {
        // Generate new contract objects
        contract20.instance = new web3.eth.Contract(JSON.parse(contract20.abiString), null, {
            data: contract20.bytecode
        });
        contract721.instance = new web3.eth.Contract(JSON.parse(contract721.abiString), null, {
            data: contract721.bytecode
        });

        // Estimate gas required to deploy the contracts
        const trans_estimate_gas_20 = contract20.instance.deploy().estimateGas();
        const trans_estimate_gas_721 = contract721.instance.deploy().estimateGas();
        const gas_acg20 = await trans_estimate_gas_20;
        const gas_acg721 = await trans_estimate_gas_721;

        // Deploy the contracts
        const trans_deploy_acg20 = contract20.instance.deploy().send({
            from: administrator,
            gas: Math.floor(gas_acg20 * 1.5)
        });
        const trans_deploy_acg721 = contract721.instance.deploy().send({
            from: administrator,
            gas: Math.floor(gas_acg721 * 1.5)
        });
        contract20.instance = await trans_deploy_acg20;
        contract721.instance = await trans_deploy_acg721;

        // Register each other for subsequent transactions
        const trans_register_20 = contract20.instance.methods.registerACG721Contract(contract721.instance.options.address).send({
            from: administrator
        });
        const trans_register_721 = contract721.instance.methods.registerACG20Contract(contract20.instance.options.address).send({
            from: administrator
        });
        await trans_register_20;
        await trans_register_721;

        console.log("Contracts deployed successfully ...\nACG20 is deployed at: ",
        contract20.instance.options.address,
        "\nACG721 is deployed at: ", contract721.instance.options.address);
    }

    async function simple_test_on_environment() {
        console.log("******** Simple test ********");
        const name = await contract20.instance.methods.name().call();
        const owner = await contract721.instance.methods.owner().call();
        console.log("Simple test: ACG20 name =", name);
        console.log("Simple test: Owner of ACG721 =", owner);
    }

    function get_contracts_instrance() {
        return [contract20.instance, contract721.instance];
    }

    async function create_new_account_and_top_up(password, value) {
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

    async function create_batch_accounts_and_top_up(user_number, password, prefund_eth) {
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

    async function retrieve_batch_accounts_from_node(user_number) {
        let users = await web3.eth.getAccounts();
        // First account is supposed to be administrator
        // Need at least (user_number) more accounts for general users
        if (users.length < user_number+1) {
            error("There aren't as many accounts as expected ...");
        }
        return users.slice(2, 2+user_number);
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
        const gasValue = await contract721.instance.methods.mintWithMetadata(user_address, artwork_id, metadata).estimateGas({
            from: administrator
        });
        const trans_721_mint = contract721.instance.methods.mintWithMetadata(user_address, artwork_id, metadata).send({
            from: administrator,
            gas: Math.floor(gasValue * 1.5)
        });
        // Store 20 Token as prize of posting artwork
        const trans_20_mint = contract20.instance.methods.mint(user_address, post_artwork_incentive).send({
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
        const gasValue = await contract721.instance.methods.updateMetadata(artwork_id, metadata).estimateGas({
            from: administrator
        });async
        await contract721.instance.methods.updateMetadata(artwork_id, metadata).send({
            from: administrator,
            gas: Math.floor(gasValue * 1.5)
        });
    }

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

    async function buy_token(buyer_address, value) {
        const receipt = await contract20.instance.methods.mint(buyer_address, value).send({
            from: administrator
        });

        return receipt.transactionHash;
    }

    async function freeze_token(buyer_address, artwork_id, artwork_prize) {
        // Check artwork status is in auction
        const artwork_info = await contract721.instance.methods.referencedMetadata(artwork_id).call();
        if (artwork_info.length <= 0) {
            console.log("Given artwork ID is not stored in the contract");
            return 0;
        }

        const gasValue = await contract20.instance.methods.freeze(buyer_address, artwork_prize, artwork_id).estimateGas({
            from: administrator
        });
        // freeze buyer's ACG20 token
        const receipt = await contract20.instance.methods.freeze(buyer_address, artwork_prize, artwork_id).send({
            from: administrator,
            gas: Math.floor(gasValue * 1.5)
        });

        return receipt.transactionHash;
    }

    async function check_artwork(artwork_id) {
        // Query owner according to token ID
        const trans_query_owner = contract721.instance.methods.ownerOf(artwork_id).call();
        // Query metadata according to token ID
        const trans_query_metadata = contract721.instance.methods.referencedMetadata(artwork_id).call();
        // Wait for the return values
        const owner_address = await trans_query_owner;
        const metadataString = await trans_query_metadata;
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
        return web3.eth.getTransaction(transaction_id);
    }

    return {
        // ----------------------------
        // Auxiliary functions:
        // ----------------------------
        connect_to_chain: connect_to_chain,
        compile_contract_from_source: compile_contract_from_source,
        read_in_compiled_contract_JSON: read_in_compiled_contract_JSON,
        retrieve_deployed_contracts: retrieve_deployed_contracts,
        deploy_new_contracts: deploy_new_contracts,
        get_contracts_instrance: get_contracts_instrance,
        simple_test_on_environment: simple_test_on_environment,
        create_new_account_and_top_up: create_new_account_and_top_up,
        create_batch_accounts_and_top_up: create_batch_accounts_and_top_up,
        retrieve_batch_accounts_from_node, retrieve_batch_accounts_from_node,
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