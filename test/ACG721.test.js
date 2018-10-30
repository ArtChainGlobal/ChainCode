const assert = require('assert');
require('mocha');
//require("@babel/register");
//const ganache = require('ganache-cli');   //note that ganache does not work on private chain
//import web3
const Web3 = require('web3');
// import ACG20 token deployed before
const ACG20_module = require('../contract_API/ACG20Token');
const ACG20Token = ACG20_module;
const ACG721Token = require('../contract_API/ACG721Token')
//import ip address and port from static json file, based on RPC ip address and port of nodes
const NodeIPAddresses = require('../static/contract_information/node_IP_address.json');
console.log(NodeIPAddresses);
// implement providers for all nodes of the private chain
const web3Array = new Array();
NodeIPAddresses.forEach(element => {
    web3Array.push(new Web3(new Web3.providers.HttpProvider(element.IPAddress)));
});
// console.log(web3Array);

// var provider = new Web3.providers.HttpProvider(NodeIPAddresses[0].IPAddress);
// var provider_2 = new Web3.providers.HttpProvider(NodeIPAddresses[1].IPAddress);
// var provider_3 = new Web3.providers.HttpProvider(NodeIPAddresses[2].IPAddress);
// const web3 = new Web3(provider);
// const web3_2 = new Web3(provider_2);
// const web3_3 = new Web3(provider_3);
//const { interface, bytecode } = require('../compiles/ACG721Compile');

let node0_accounts;
let node1_accounts;
let node2_accounts;
let node3_accounts;
let acg20_founder;
let acg721_founder;
// define const to test static value, such as name of the token and so on
const originTokenName = "ArtChain Global Token 20";
const symbol = "ACG20";
const totalSupply = 350000000000000000;



/**
 * it('passes after 3000ms', function (done) {
  setTimeout(done, 3000)
})
 */
// use beforeEach() if you need to initiate the presetting condition for each test
before(async () => {
    
    node0_accounts = await web3Array[0].eth.getAccounts();
    node1_accounts = await web3Array[1].eth.getAccounts();
    node2_accounts = await web3Array[2].eth.getAccounts();
    node3_accounts = await web3Array[3].eth.getAccounts();
    acg20_founder = node0_accounts[0];  //acg20 was deployed on 
    acg721_founder = node0_accounts[0];
    
    //console.log(accounts.length);
    console.log("Get account 0 of node 0", node0_accounts[0]);
    console.log("Get account 0 of node 1", node1_accounts[0]);
    console.log("Get account 0 of node 2", node2_accounts[0]);
    console.log("Get account 0 of node 3", node3_accounts[0]);
    //console.log(interface);

    const destAccount = node0_accounts[1];
    const fromAccount = node0_accounts[2];
    // topup some to sender before transfer
    const topupValue = 10000;
    const topupAddress = node0_accounts[0];
    
    await ACG20Token.methods.mint(topupAddress, topupValue).send({
        from: node0_accounts[0]
    });
    await ACG20Token.methods.mint(destAccount, topupValue).send({
        from: node0_accounts[0]
    });
    //topup for owner
    await ACG20Token.methods.mint(fromAccount, topupValue).send({
        from: node0_accounts[0]
    });
    const currentOwnerBalance = await ACG20Token.methods.balanceOf(node0_accounts[0]).call();
    const currentSendBalance = await ACG20Token.methods.balanceOf(fromAccount).call();     //we pre-set it before
    const currentDestBalance = await ACG20Token.methods.balanceOf(destAccount).call(); 
    console.log("Owner balance currently is: ", currentOwnerBalance);
    console.log("sender balance after topup of sender account is: ", currentSendBalance);
    console.log("destination balance: ", currentDestBalance);   

    const web3Standard = require('web3');
    await web3Array[0].eth.personal.unlockAccount(node0_accounts[1], "Test@2018", 60*60*24*365*10);
    await web3Array[0].eth.sendTransaction({to:node0_accounts[1], from: node0_accounts[0], value:web3Standard.utils.toWei("1000", "ether")});
    await web3Array[0].eth.personal.unlockAccount(node0_accounts[2], "Test@2018", 60*60*24*365*10);
    await web3Array[0].eth.sendTransaction({to:node0_accounts[2], from: node0_accounts[0], value:web3Standard.utils.toWei("1000", "ether")});
    
})

/**
 *  Before you test, keep in mind that, everytime you envoke a transaction, you need 
 * to specify which account you use to envoke the transaction
 * */ 
describe('ArtChainGlobal ACG721 token smart contract', () => {
    // it('allow to create new personal account', async () => {
    //     const adminstrator = node0_accounts[0];
    //     const web3Standard = require('web3');
    //     var newAccount = "DEFAULT_ACCOUT";
    //     for (var i = 0; i < 5; i++) {
    //         try {
    //             newAccount = await web3Array[0].eth.personal.newAccount("Test@2018");
    //             console.log(newAccount);
    //         } catch(e) {
    //             console.log("Create account error", e);
    //         }
    //         if (newAccount != "DEFAULT_ACCOUT") {
    //             await web3Array[0].eth.personal.unlockAccount(newAccount, "Test@2018", 60*60*24*365*10);

    //             await web3Array[0].eth.sendTransaction({to:newAccount, from: adminstrator, value:web3Standard.utils.toWei("1000", "ether")});
    //             var newBalance = await web3Array[0].eth.getBalance(newAccount)
    //             console.log("balance of new account: ", newBalance);
    //         }
    //     }      
    // })
    it('allow to post artwork', async () => {
        const user_address = node0_accounts[1];
        const adminstrator = node0_accounts[0];
        artwork1 = {
            "type":"paint",
            "artist":"Qin Wang",
            "loyalty":"0.1",
            "status":"normal",
            "prize":"10000"
          };
        const artwork_id = 1111;
        try {
            const previousNumberOfArtwork = await ACG721Token.methods.balanceOf(user_address).call();
            console.log("number of artowrk os user: ", previousNumberOfArtwork);
            const gasValue = await ACG721Token.methods.mint(user_address, artwork_id).estimateGas({
                from: adminstrator,
            });
            console.log(gasValue);
            await ACG721Token.methods.mint(user_address, artwork_id).send({
                from: adminstrator,
                gas: gasValue
            });
            postNumberOfArtwork = await ACG721Token.methods.balanceOf(user_address).call();
            console.log("post number of artwork", postNumberOfArtwork);
            assert.equal(1 + Number(previousNumberOfArtwork), Number(postNumberOfArtwork));
        } catch(err) {
            console.log(err);
        }
    })
  
    it('allow to post artwork', async () => {
        const user_address = node0_accounts[2];
        const adminstrator = node0_accounts[0];
        artwork1 = {
            "type":"paint",
            "artist":"Qin Wang",
            "loyalty":"0.1",
            "status":"normal",
            "prize":"10000"
          };
        const artwork_id = 2221;
        const metadata = JSON.stringify(artwork1);
        const previousNumberOfArtwork = await ACG721Token.methods.balanceOf(user_address).call();
        console.log("number of artowrk os user: ", previousNumberOfArtwork);
        try {
            const gasValue = await ACG721Token.methods.mintWithMetadata(user_address, artwork_id, metadata).estimateGas({
                from: adminstrator,
            });
            console.log(gasValue);
            await ACG721Token.methods.mintWithMetadata(user_address, artwork_id, metadata).send({
                from: adminstrator,
                gas: gasValue,
            });
            // await ACG20Token.methods.mint(user_address, 100).send({
            //     from: accounts[0],
            // })
        } catch(err) {
            console.log(err);
        }
    })
    // it('allow to deploy the ACG721 contract', async () => {
    //     try {
    //         ACG721Token = await new web3Array[0].eth.Contract(JSON.parse(interface))
    //             .deploy({
    //                 data: "0x" + bytecode,
    //             })
    //             .send({
    //                 from: accounts[0],
    //                 gas: '2000000'
    //             });
    //         console.log("Deployed successfully at address: ", ACG721Token.options.address )
    //     } catch(err) {
    //         console.log("Deployed contract error: ", err);
    //     }
        
    
    // })

    it('allow approve transfer token', async () => {
        const adminstrator = node0_accounts[0];
        const buyer_address = node0_accounts[1];
        const owner_address = node0_accounts[2];
        console.log("buyer account is: ", buyer_address);
        console.log("owner account is ", owner_address);
        
        const artworkid = 2221;
        // check the artworkid is existing in the system or not
        const existingOnwer = await ACG721Token.methods.ownerOf(artworkid).call();
        console.log("onwner of this artwork: ", existingOnwer);
        console.log("owner passed from the function: ", owner_address);
        const artwork_price = 100;
        const tokenCurrentBalanceOfBuyer = await ACG20Token.methods.balanceOf(buyer_address).call();
        const tokenCurrentBalanceOfOwner = await ACG20Token.methods.balanceOf(owner_address).call();
        const artCurrentBalanceOfBuyer = await ACG721Token.methods.balanceOf(buyer_address).call();
        const artCurrentBalanceOfOwner = await ACG721Token.methods.balanceOf(owner_address).call();
        // const buyer_ether = await web3Array[3].eth.getBalance(buyer_address);
        //console.log(buyer_ether);
        console.log("balance token of buyer: ", tokenCurrentBalanceOfBuyer);
        console.log("balance token of owner: ", tokenCurrentBalanceOfOwner);
        console.log("number of art of buyer: ", artCurrentBalanceOfBuyer);
        console.log("number of art of owner: ", artCurrentBalanceOfOwner);
        // buyer approve for seller to spend his token
        try {
            // register the contract 
            // acg20_contract_address = '0xBD7245D74c4387fc5D887aBaf2F6Aa1256af4b30';
            // acg721_contract_address = '0x2f795E8504f32dd2C1Bb604a613b533ABA89C388';
            // await ACG20Token.methods.registerACG721Contract(acg721_contract_address).send({
            //     from: acg20_founder,
            // });
            
            // await ACG721Token.methods.registerACG20Contract(acg20_contract_address).send({
            //     from: acg721_founder,
            // });
            const buyerApproval = await ACG20Token.methods.approve(buyer_address, owner_address, artwork_price).send({
                from: buyer_address,
            });
            const newAllowance = await ACG20Token.methods.allowance(buyer_address, owner_address).call();            
            console.log("allowance for owner is: ", newAllowance);
            // await ACG20Token.methods.transfer(buyer_address, artwork_price).send({
            //     from: owner_address,
            // });
            // await ACG20Token.methods.transferFrom(buyer_address, owner_address, artwork_price).send({
            //     from: acg721_founder,
            // });
            // console.log(gasEstimated);
            // const getAcg721Address = await ACG721Token.methods.getContractOwner().call();
            // console.log("expected acg721_founder address: ", getAcg721Address);
            // console.log("actual acg721 founder address: ", acg721_founder);
            // console.log("actual acg20 founder address ", acg20_founder);
            // assert.equal(getAcg721Address, acg721_founder);
            // const sellerApproval = await ACG20Token.methods.payForArtworkFrom(buyer_address, owner_address, artwork_price, artworkid).send({
            //     from: acg721_founder,
            // });
            // owner need to approve for transfer his artwork
            // const ownerApproval = true;
            const ownerApproval = await ACG721Token.methods.approve(owner_address, buyer_address, artworkid).send({
                from: owner_address,
            });
            const approvedAddressOfToken = await ACG721Token.methods.getApprovedAddressOfArtToken(artworkid).call();
            console.log("token was approved to this address: ", approvedAddressOfToken);

            // manually transfer the token
            // const gasEstimated = await ACG721Token.methods.transferFrom(owner_address, buyer_address, artworkid).estimateGas({
            //     from: acg721_founder,
            // })
            // await ACG721Token.methods.transferFrom(owner_address, buyer_address, artworkid).send({
            //     from: acg721_founder,
            //     gas: gasEstimated,
            // })

            if (buyerApproval) {
                if (ownerApproval) {
                    console.log("transferming is in progress ...");
                        //estimate gas
                    const gasEstimated = await ACG721Token.methods.receiveApproval(buyer_address, owner_address, artwork_price, artworkid).estimateGas({
                        from: adminstrator,
                    });
                    console.log(gasEstimated);
                    try {
                        const result = await ACG721Token.methods.receiveApproval(buyer_address, owner_address, artwork_price, artworkid).send({
                            from: acg721_founder,
                            gas: gasEstimated
                        });
                        console.log("pay successfully", result.transactionHash);
                        assert.equal(Number(tokenCurrentBalanceOfBuyer), Number(postBalanceOfBuyer) + Number(artwork_value));
                    } catch(err) {
                        console.log("perform transfer token as well as artwork was failed: ", err);
                    }
                    
                }
                
            }

            
        } catch(err) {
            console.log("approve for spending error: ", err)
        }        
        const postBalanceOfBuyer = await ACG20Token.methods.balanceOf(buyer_address).call();
        console.log("good! new balance of buyer: ", postBalanceOfBuyer);
        const postBalanceOfOwner = await ACG20Token.methods.balanceOf(owner_address).call();
        console.log("new balance of Owner: ", postBalanceOfOwner);
        const artPostBalanceOfBuyer = await ACG721Token.methods.balanceOf(buyer_address).call();
        const artPostBalanceOfOwner = await ACG721Token.methods.balanceOf(owner_address).call();
        console.log("post number of art of buyer: ", artPostBalanceOfBuyer);
        console.log("post number of art of owner: ", artPostBalanceOfOwner);
    });

    // it('allow to pay for artwork', async () => {
    //     // 1. owner approve to sell the artwork to a buyer
    //     // 2. buyer approve for owner to spend some token
    //     // 3. transfer token to onwer
    //     // 4. transer artwork to buyer

    //     const buyer_address = node2_accounts[0];
    //     const owner_address = node1_accounts[0];
        
    //     const artworkid = 200004;
    //     // check the artworkid is existing in the system or not
    //     const existingOnwer = await ACG721Token.methods.ownerOf(artworkid).call();
    //     console.log("onwner of this artwork: ", existingOnwer);
    //     console.log("owner passed from the function: ", owner_address);
    //     const artwork_value = 500;
    //     const tokenCurrentBalanceOfBuyer = await ACG20Token.methods.balanceOf(buyer_address).call();
    //     const tokenCurrentBalanceOfOwner = await ACG20Token.methods.balanceOf(owner_address).call();
    //     const artCurrentBalanceOfBuyer = await ACG721Token.methods.balanceOf(buyer_address).call();
    //     const artCurrentBalanceOfOwner = await ACG721Token.methods.balanceOf(owner_address).call();
    //     // const buyer_ether = await web3Array[3].eth.getBalance(buyer_address);
    //     //console.log(buyer_ether);
    //     console.log("balance token of buyer: ", tokenCurrentBalanceOfBuyer);
    //     console.log("balance token of owner: ", tokenCurrentBalanceOfOwner);
    //     console.log("number of art of buyer: ", artCurrentBalanceOfBuyer);
    //     console.log("number of art of owner: ", artCurrentBalanceOfOwner);
    //     // check valid contract
    //     //console.log("acg721 registered on acg20 is: ", await ACG20Token.methods.acg721Contract.call());
    //     try {
    //     //     //first ly,
        
    //         // register the contract 
    //         acg20_contract_address = '0xD95E0565BaEce75d12efbbcea4CfB7A9c04B52B0';
    //         acg721_contract_address = '0x937913634644651d41B4FEaFF5a7Cd78d866F353';
    //         await ACG20Token.methods.registerACG721Contract(acg721_contract_address).send({
    //             from: acg20_founder,
    //         });
            
    //         await ACG721Token.methods.registerACG20Contract(acg20_contract_address).send({
    //             from: acg721_founder,
    //         });
    //         // require the seller to approve for the transfer
    //         const sellerApproval = await ACG20Token.methods.approve(owner_address, artworkid).send({
    //             from: acg20_founder,
    //         });

    //         // buyer need to approve for the owner to spend his token first
    //         const ownerApproval = await ACG721Token.methods.approve(buyer_address, artworkid).send({
    //             from: acg721_founder,
    //         });

    //         // verify these above approve


    //         if (sellerApproval) {
    //             if (ownerApproval) {
    //                  //estimate gas
    //                 const gasEstimated = await ACG20Token.methods.receiveApproval(buyer_address, owner_address, artwork_value, artworkid).estimateGas({
    //                     from: acg721_founder,
    //                 });
    //                 console.log(gasEstimated);
    //                 const result = await ACG20Token.methods.receiveApproval(buyer_address, owner_address, artwork_value, artworkid).send({
    //                     from: acg721_founder,
    //                     gas: gasEstimated,
    //                 });
    //                 console.log("pay successfully", result.events.a);
    //                 assert.equal(Number(tokenCurrentBalanceOfBuyer), Number(postBalanceOfBuyer) + Number(artwork_value));
    //             }
               
    //         }
             
    //     } catch(err) {
    //         console.log("pay for artwork error as followings: ", err);
    //     }
    //     const postBalanceOfBuyer = await ACG20Token.methods.balanceOf(buyer_address).call();
    //     const postBalanceOfOwner = await ACG20Token.methods.balanceOf(owner_address).call();
    //     const artPostBalancOfBuyer = await ACG721Token.methods.balanceOf(buyer_address).call();
    //     const artPostBalancOfOnwer = await ACG721Token.methods.balanceOf(owner_address).call();
    //     console.log("balance of buyer after the transaction: ", postBalanceOfBuyer)
    //     console.log("balance of owner after the transaction: ", postBalanceOfOwner);
    //     console.log("number of art of buyer: ", artPostBalancOfBuyer);
    //     console.log("number of art of Owner after transaction: ", artPostBalancOfOnwer);
        
    // })





    // it('deplys a ERC Token contract', async () => {
        
    //     console.log("testing the adress of deployment", ACG20Token.options.address);  
    //     console.log(ACG20Token.methods);      
    //     assert.ok(ACG20Token.options.address);
    //     // this.timeout(15000);
    //     // setTimeout(done, 10000);
    // });
    // it('allow to get balanceOf an account', async () => {
    //     //test balance of founder who we set to acounts[0] of node0
    //     const node0Account0_balanceOf = await ACG20Token.methods.balanceOf(accounts[0]).call({
    //         from: accounts[0]
    //     });
    //     console.log("acount 0 of node0 balance: ", node0Account0_balanceOf);
    //     assert.equal(0, node0Account0_balanceOf);
    // });

    // // Testing the return name of the token
    // it('allow getting name of token', async () => {
    //     const tokenName = await ACG20Token.methods.name().call({
    //         from: accounts[0]
    //     });
    //     console.log("Token name", tokenName);
    //     assert.equal(originTokenName, tokenName);
    // })
    // //Testing get owner - predefine = accounts[0]
    // it('get the owner: ', async () => {
    //     const getOwner = await ACG20Token.methods.owner().call();
    //     console.log("the owner who create the contract is: ", getOwner);
    //     assert.equal(accounts[0], getOwner);
    // })
    // it('get total supply: ', async () => {
    //     const totalSupply = await ACG20Token.methods.totalSupply().call();
    //     console.log("total supply of the token ACG20: ", totalSupply);
    //     assert.equal(0, totalSupply);
    // })
    // it('top up token for user accounts_1[0] by owner only', async () => {
    //     const topupValue = 1000;
    //     const topupAddress = node2_accounts[0];
    //     const previousBalance = await ACG20Token.methods.balanceOf(topupAddress).call();
    //     console.log('previous balance is: ', previousBalance);
    //     await ACG20Token.methods.mint(topupAddress, topupValue).send({
    //         from: accounts[0]
    //     });
    //     const newAccountBalance = await ACG20Token.methods.balanceOf(topupAddress).call();
    //     console.log(newAccountBalance);
    //     assert.equal(Number(topupValue) + Number(previousBalance), Number(newAccountBalance));
    //     // cannot topup for the account if sender is not the founder/owner
    //     // this need to recode on solidity and test again since it gave an error not handdled
    //     // const notAllowedTopupResult = false;
    //     // try {
    //     //     await ACG20Token.methods.mint(topupAddress, topupValue).send({
    //     //         from: node2_accounts[0]
    //     //     });
    //     //     notAllowedTopupResult = true;
    //     // } catch(e) {
    //     //     console.log(e);
    //     // }
        
    //     // assert.equl(notAllowedTopupResult, false);
    // })
    // test halt() of an account
    // it('is the account haled ', async () => {
    //     assert.ok(await ACG20Token.methods.halt().call());
    // })
    // test changing new founder
    // it('allow change founder', async () => {
    //     const newFounder = node3_accounts[0];
    //     const founderChangeResult = await ACG20Token.methods.changeFounder(newFounder).send({
    //         from: accounts[0]
    //     });
    //     console.log("the new founder is: ", await ACG20Token.methods.founder().call());
    // })
    // // Test unlock and locking account
    // it('allow to unlock an account', async () => { 
    //     var result = false;       
    //     try {
    //         //web3.personal.unlockAccount("0x..", "<passs>", 1000);
    //         await web3.eth.personal.unlockAccount(accounts[3], "Test@2018", 1000000);
    //         await web3.eth.personal.unlockAccount(accounts[2], "Test@2018", 1000000);
    //         result = true
    //     } catch (e) {
    //         console.log(e);
    //         //return false;
    //     }
    //     assert.ok(result);
    // })
    // // Test create new account using web3
    // it('allow to create new personal account', async () => {
    //     var newAccount = "DEFAULT_ACCOUT";
    //     try {
    //         newAccount = await web3.eth.personal.newAccount("Test@2018");
    //         console.log(newAccount);
    //     } catch(e) {
    //         console.log("Create account error", e);
    //     }
    //     if (newAccount != "DEFAULT_ACCOUT") {
    //         await web3.eth.personal.unlockAccount(newAccount, "Test@2018");
    //         var newBalance = await web3.eth.getBalance(newAccount)
    //         console.log("balance of new account: ", newBalance);
    //     }
    // })

    /**left: 
     * test account A approve for account B to spend A's token
     * problem: only owner can approve for this test
     * other accounts will result in the failure of the test
     */
    
    // it('allow account[0] to approve for account_2[0] to spend token', async () => {
    //     const approvedAccount = accounts[0];
    //     const spendingAccount = node3_accounts[0];
    //     const spendingValue = 2000;
    //     try {
    //         //first of all, the Sender need to approve for accounts[0] to spend or transfer
    //         const approvedResult = await ACG20Token.methods.approve(spendingAccount, spendingValue).send({
    //             from: approvedAccount,
    //         })
    //         if (approvedResult) {
    //             console.log('approval result: ', approvedResult);
    //             const approvedValue = await ACG20Token.methods.allowance(approvedAccount, spendingAccount).call();
    //             console.log("value allowed for spending: ", approvedValue);
    //             assert.equal(spendingValue, approvedValue);
    //         } else {
    //             console.log("Approve result in false result", approvedResult);
    //             const approvedValue = await ACG20Token.methods.allowance(approvedAccount, spendingAccount).call();
    //             console.log("value allowed for spending: ", approvedValue);
    //         }
            
    //     } catch(approvedErr) {
    //         console.log("Approve Error: ", approvedErr);
    //     };

    // })


    // //test transfer function of the Token 
    // it('allows transfer from one to other account', async () => {
    //     const destAccount = node2_accounts[0];
    //     const fromAccount = node3_accounts[0];
    //     const spendingAccount = accounts[0];
    //     const transferValue = 1000;
    //     // using try catch
    //     try {
    //         //first of all, the Sender need to approve for accounts[0] to spend or transfer
    //         const approvedResult = await ACG20Token.methods.approve(spendingAccount, transferValue).call({
    //             from: fromAccount,
    //         })
    //         if (approvedResult === true) {
    //             const approvedValue = await ACG20Token.methods.allowance(fromAccount, spendingAccount).call({
    //                 from: fromAccount,
    //             })
    //             console.log("value allowed for spending: ", approvedValue);
    //             console.log("approval success, transferring now ...", approvedResult);
    //             try {
    //                 await ACG20Token.methods.transferFrom(fromAccount, destAccount, transferValue).send({
    //                     from: spendingAccount,
    //                     //gas: 2000000,
    //                     // suppose the transfer need to send from the owner
    //                 });
    //             } catch(transferErr) {
    //                 console.log("Transfer eror: ", transferErr);
    //             }
    //         } else {
    //             console.log("Approve result in false result", approvedResult);
    //         }
            
    //     } catch(approvedErr) {
    //         console.log("Approve Error: ", approvedErr);
    //     };
    //     const newOwnerBalance = await ACG20Token.methods.balanceOf(accounts[0]).call();
    //     const newBalanceOfDestination = await ACG20Token.methods.balanceOf(destAccount).call();
    //     const newBalanceOfSender = await ACG20Token.methods.balanceOf(fromAccount).call();
    //     //console.log(ACG20Token.methods); 
    //     console.log("owner balance af ter approval: ", newOwnerBalance);
    //     console.log("destination balance: ", newBalanceOfDestination);  
    //     console.log("sender balance: ", newBalanceOfSender); 
    //     //assert.equal(Number(newBalanceOfDestination), Number(previousBalance) + Number(transferValue));
    // });
    
    /**
     * This section used to test a user can correctly withdraw and burn token
     * make sure only owner can execute this contract, no one else
     * test function burnFrom only in this case
     */
    // it('allow the founder to burn the token once it', async () => {
    //     const founder = accounts[0];
    //     const burningAccount = node2_accounts[0];
    //     const burningValue = 500;
    //     console.log("current balance of burningAccount: ", await ACG20Token.methods.balanceOf(burningAccount).call());
    //     // try cat to burn tokens
    //     try {
    //         const result = await ACG20Token.methods.burnFrom(burningAccount, burningValue).send({
    //             from: founder
    //         })
    //         if (result) {
    //             console.log("successfully burnt token");
    //             console.log("new balance of burningAccount: ", await ACG20Token.methods.balanceOf(burningAccount).call())
    //         } else {
    //             console.log("result of burning token is not true, ", result);
    //             console.log("new balance of burningAccount: ", await ACG20Token.methods.balanceOf(burningAccount).call())
    //         }
    //     } catch(err) {
    //         console.log("burning token error somewhere as: ", err);
    //     }
    // })

    /**
     * FREEZE FUNCTION TESTING
     * 
     */
    // it('allow the owner to freeze an amount of token from given acount based on artworkid', async () => {
    //     //initiate some constants for the test, and these constant provided by web interface in production
    //     const artworkid = 12345;    
    //     const bidAmount = 300;    
    //     const bidder = node2_accounts[0];  
    //     const contractFounder = accounts[0];
    //     const currentBalance = await ACG20Token.methods.balanceOf(bidder).call();
    //     console.log ("before bid balance of bidder: ", currentBalance);

    //     // free the bidAmount token of the bidArress
    //     try {
    //         const result = await ACG20Token.methods.freeze(bidder, bidAmount, artworkid).send({
    //             from: contractFounder,
    //         });
    //         //console.log("freeze result in true: ", result);
    //         const newBalance = await ACG20Token.methods.balanceOf(bidder).call();
    //         console.log("new balance ofter freezing is: ", newBalance);
    //         assert.equal(currentBalance - bidAmount, newBalance);
    //     } catch(err) {
    //         console.log("freeze false becuase of something, error object is: ", err);
    //     }

    //     //test unfreeze account of the above user by inserting a new bid with new bidder
    //     const newBidAmount = 400;
    //     const newbidder = node3_accounts[0];
    //     const currentBalanceNewBidder = await ACG20Token.methods.balanceOf(newbidder).call();
    //     console.log(currentBalanceNewBidder);
    //     try {
    //         const result = await ACG20Token.methods.freeze(newbidder, newBidAmount, artworkid).send({
    //             from: contractFounder,
    //         })
    //         const newBalanceNewBidder = await ACG20Token.methods.balanceOf(newbidder).call();
    //         console.log("new balance of the new bidder: ", newBalanceNewBidder);
    //         assert.equal(currentBalanceNewBidder - newBidAmount, newBalanceNewBidder);
    //         const newBalancePreBidder = await ACG20Token.methods.balanceOf(bidder).call();
    //         console.log("new balance of the previous bidder return: ", newBalancePreBidder);
    //         assert.equal(newBalancePreBidder, currentBalance);
    //     } catch(err) {
    //         console.log("freeze false becuase of something, error object is: ", err);
    //     }
    // })
   
})