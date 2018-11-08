const assert = require('assert');
const acgApi = require('../api/artChainGlobalAPI.js');
const SIMPLE_TEST_ON_ENVIRONMENT = false;

describe('API basic test framework', async function () {

    let users = [];
    const user_number = 4;
    let acg20Inst;
    let acg721Inst;
    const transaction_to_be_checked = [];
    const artwork_id_list = [];
    let artist;
    let artwork_id_sold;
    let collector;
    let web3;
    const universal_password = "password";
    
    before ("Setup test environment step by step", async function () {
        // Set timeout
        //this.timeout(30000);
        console.log("Setup environment start ...");

        // ----------------------------------------------------------
        // Setup environment
        // ----------------------------------------------------------
        web3 = acgApi.prepare();

        // ----------------------------------------------------------
        // Prepare a set of testing accounts by either:
        // 1. create new accounts on the node and top up for them, or:
        // 2. retrieve existing accounts from the node and use
        //    their remaining balances
        // ----------------------------------------------------------
        /*
        if (CREATE_NEW_ACCOUNTS_FOR_TEST) {
            // Create test accounts with prefunded eth
            for (let i=0; i<user_number; i++) {
                users[i] = await acgApi.create_new_account_and_top_up('password', prefund_eth);
            }    
        } else {
            // Retrieve existing accoutns
            users = await acgApi.retrieve_batch_accounts_from_node(user_number);
        }
        // Print out initial balance of testing accounts
        for (let i=0; i<user_number; i++) {
            const userBalance = await web3.eth.getBalance(users[i]);
            console.log("Test accounts: ", users[i], "initial balance is ", web3.utils.fromWei(userBalance, "ether"), "ether");
        }
        */

        // ----------------------------------------------------------
        // Run a simple test to ensure the contracts instances available
        // ----------------------------------------------------------
        if (SIMPLE_TEST_ON_ENVIRONMENT) {
            acgApi.simple_test_on_environment();
        }
        // ----------------------------------------------------------
        // Environment ready to use
        // ----------------------------------------------------------
        console.log("Setup environment finish ...");
        [acg20Inst, acg721Inst] = acgApi.get_contracts_instrance();
    });

    it('Test API: add_new_user', async () => {
        const trans_add_new_user = [];

        // Store new user address to the contract
        for (let i=0; i<user_number; i++) {
            trans_add_new_user[i] = acgApi.add_new_user(universal_password);
        }
        // Expect the operation succeeded
        for (let i=0; i<user_number; i++) {
            users[i] = await trans_add_new_user[i];
        }
        // Check the initial status of new added accounts
        for (let i=0; i<user_number; i++) {
            const userBalance = await web3.eth.getBalance(users[i]);
            console.log("Test accounts: ", users[i], "initial balance is ", web3.utils.fromWei(userBalance, "ether"), "ether");
        }

        // New user's balance is expected to be zero
        const expected_acg20_balance = 0;
        const expected_acg721_balance = 0;

        const trans_acg20_balance = [];
        const trans_acg721_balance = [];
        for (let i=0; i<user_number; i++) {
            trans_acg20_balance[i] = acg20Inst.methods.balanceOf(users[0]).call();
            trans_acg721_balance[i] = acg721Inst.methods.balanceOf(users[0]).call();
        }

        // Check the result
        for (let i=0; i<user_number; i++) {
            const acg20_balance = await trans_acg20_balance[i];
            const acg721_balance = await trans_acg721_balance[i];

            assert.equal(expected_acg20_balance, Number(acg20_balance),
            "New user's balance of ACG20 token should be zero");
            assert.equal(expected_acg721_balance, Number(acg721_balance),
            "New user's balance of ACG721 token should be zero");
        }
    });

    it('Test API: post_new_artwork', async () => {
        const artwork_list = [];
        const artwork_number = 5;
        const post_artwork_incentive = 1e3;
        artist = users[1];
        for (let i=0; i<artwork_number; i++) {
            artwork_list[i] = {
                "type":"paint",
                "artist":"Qin Wang",
                "loyalty":"0.1",
                "status":"normal",
                "prize":"10000"    
            }
        }

        // Obtain chain status
        const trans_acg20_balance_before = acg20Inst.methods.balanceOf(artist).call();
        const trans_acg721_balance_before = acg721Inst.methods.balanceOf(artist).call();
        const acg20_balance_before = await trans_acg20_balance_before;
        const acg721_balance_before = await trans_acg721_balance_before;

        const trans_post_new_artwork = [];
        for (let i=0; i<artwork_number; i++) {
            // Post a new artwork, it will:
            // - Add a new 721 token for user
            // - Add amount of 20 token as incentive
            trans_post_new_artwork[i] = acgApi.post_new_artwork(artist, universal_password, artwork_list[i]); 
        }

        // Wait for the result
        for (let i=0; i<artwork_number; i++) {
            artwork_id_list[i] = await trans_post_new_artwork[i];
        }

        // Obtain chain status after posting the new artwork
        const trans_acg20_balance_after = acg20Inst.methods.balanceOf(artist).call();
        const trans_acg721_balance_after = acg721Inst.methods.balanceOf(artist).call();
        const acg20_balance_after = await trans_acg20_balance_after;
        const acg721_balance_after = await trans_acg721_balance_after;

        // Check the change of user's balance
        assert.equal(
            Number(acg20_balance_before) + Number(post_artwork_incentive * artwork_number),
            Number(acg20_balance_after),
            "ACG20 balance should increase by prize");
        assert.equal(
            Number(acg721_balance_before) + artwork_number,
            Number(acg721_balance_after),
            "ACG721 balance should increase by 1");
        });

        it('Test API: update_artwork', async() => {
            const updated_artwork_id = artwork_id_list[0];
            const updated_info = {
                "type":"paint",
                "artist":"Lin Yang",
                "loyalty":"0.1",
                "status":"private",
                "prize":"10000"
            };
            await acgApi.update_artwork(updated_artwork_id, JSON.stringify(updated_info));
            const updated_metadata = await acg721Inst.methods.referencedMetadata(updated_artwork_id).call();
            artwork_info_after = JSON.parse(updated_metadata);
            //assert.equal(artwork_info_after.status, "private", "Artwork status should be changed");
        });
/*
        it('Test API: buy_token', async () => {

            // Obtain chain status
            const trans_get_balance_before = [];
            for (let i=0; i<user_number; i++) {
                trans_get_balance_before[i] = acg20Inst.methods.balanceOf(users[i]).call();
            }
            // Wait for the result
            const acg20_balance = [];
            for (let i=0; i<user_number; i++) {
                acg20_balance[i] = Number(await trans_get_balance_before[i]);
            }
    
            // buyer buy amount of ACG20 tokens
            const trans_buy_token = [];
            for (let i=0; i<user_number; i++) {
                const token_amount = 1e8 + Math.floor(Math.random()*1e8);
                trans_buy_token[i] = acgApi.buy_token(users[i], token_amount);
                acg20_balance[i] += token_amount;
            }
            // Wait for the result
            for (let i=0; i<user_number; i++) {
                transaction_id = await trans_buy_token[i];
                transaction_to_be_checked.push(transaction_id);
            }

            // Obtain chain status after buying tokens
            const trans_get_balance_after = [];
            for (let i=0; i<user_number; i++) {
                trans_get_balance_after[i] = acg20Inst.methods.balanceOf(users[i]).call();
            }
            // Check the result
            for (let i=0; i<user_number; i++) {
                acg20_balance_after = await trans_get_balance_after[i];
                assert.equal(Number(acg20_balance_after), acg20_balance[i], "ACG20 balance should increase after buy_token()");
            }
        });

        it('Test API: buy_artwork', async() => {
            artwork_id_sold = artwork_id_list[3];
            collector = users[3];

            // Read out artwork information
            const trans_read_metadata =  acg721Inst.methods.referencedMetadata(artwork_id_sold).call();
            // Read out buyer and seller's balance of ACG20
            let trans_get_buyer_balance = acg20Inst.methods.balanceOf(collector).call();
            let trans_get_seller_balance = acg20Inst.methods.balanceOf(artist).call();

            // Calculate sell price and commission
            const metadata = await trans_read_metadata;
            const artwork_info = JSON.parse(metadata);
            const artwork_prize = Number(artwork_info.prize);
            const sell_commission = Math.floor(artwork_prize * Number(artwork_info.loyalty));
            const sell_price = artwork_prize - sell_commission;

            // Wait for the return of user balance
            const buyer_balance_before = await trans_get_buyer_balance;
            const seller_balance_before = await trans_get_seller_balance;

            // Buy artwork
            await acgApi.buy_artwork(collector, artist, artwork_id_sold, artwork_prize);

            // Read out buyer and seller's balance of ACG20
            trans_get_buyer_balance = acg20Inst.methods.balanceOf(collector).call();
            trans_get_seller_balance = acg20Inst.methods.balanceOf(artist).call();
            // Get owner of the sold artwork
            trans_get_owner = acg721Inst.methods.ownerOf(artwork_id_sold).call();

            // Wait for the result
            const buyer_balance_after = await trans_get_buyer_balance;
            const seller_balance_after = await trans_get_seller_balance;
            const new_owner = await trans_get_owner;

            // Check result
            assert.equal(Number(buyer_balance_after), Number(buyer_balance_before)-artwork_prize, "Buyer's balance should decrease");
            assert.equal(Number(seller_balance_after), Number(seller_balance_before)+sell_price, "Seller's balance should increase");
            assert.equal(collector, new_owner, "New owner should be buyer");
            // 

        });
    
        it('Test API: freeze_token', async function () {
            const buyer1 = users[2];
            // Top up buyer's ACG20 token
            let buyer_balance_20 = await acg20Inst.methods.balanceOf(buyer1).call();
            buyer_balance_20 = Number(buyer_balance_20);
            if (buyer_balance_20 < 1e9) {
                const topup_value = 1e9;
                await acgApi.buy_token(buyer1, topup_value);
                buyer_balance_20 += topup_value;
            }

            const artwork_id = artwork_id_list[0];
            const artwork_bid = 1e7;
            await acgApi.freeze_token(buyer1, artwork_id, artwork_bid);

            buyer_balance_20 -= artwork_bid;
            const buyer_balance_after = await acg20Inst.methods.balanceOf(buyer1).call();
            assert.equal(Number(buyer_balance_after), buyer_balance_20, "User's balance should decrease by freezing");
        });

        it('Test API: check_artwork', async function () {
            const trans_check_artwork = [];
            artwork_id_list.forEach((artwork_id) => {
                if (artwork_id !== artwork_id_sold) {
                    trans_check_artwork.push(acgApi.check_artwork(artwork_id));
                }
            });
            // Wait for the result
            trans_check_artwork.forEach(async (trans) => {
                [artwork_owner, artwork_info] = await trans;
                assert.equal(artwork_owner, artist, "Artwork owner should be the artist");
            });
        });

        it('Test API: check_user', async function () {
            // Query user information
            const trans_check_user = [];
            for (let i=0; i<user_number; i++) {
                trans_check_user[i] = acgApi.check_user(users[i]);
            }

            // Wait for result
            for (let i=0; i<user_number; i++) {
                let user_type, user_balance_20, user_balance_721, artwork_list;
                [user_type, user_balance_20, user_balance_721, artwork_list] = 
                await trans_check_user[i];
                // Print out user information
                //console.log("User's type is ", user_type);
                //console.log("User's balance of ACG20 tokens is ", user_balance_20);
                //console.log("User's balance of ACG721 tokens is ", user_balance_721);
                //console.log("User's artwork list is\n", artwork_list);
                }    
        });

        it('Test API: check_transaction', async function () {
            const trans_check_transaction = [];
            transaction_to_be_checked.forEach((trans_id) => {
                trans_check_transaction.push(acgApi.check_transaction(trans_id));
            });

            // Check result
            trans_check_transaction.forEach(async (trans) => {
                transaction = await trans;
                //console.log(transaction);
            });
        });
        */
});
