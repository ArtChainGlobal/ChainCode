const assert = require('assert');
require('mocha');
//require("@babel/register");
//const ganache = require('ganache-cli');   //note that ganache does not work on private chain
//import web3
const Web3 = require('web3');
// import ACG20 token deployed before
const ACG20_module = require('../contract_API/ACG20Token');
const ACG20Token = ACG20_module;
//import ip address and port from static json file, based on RPC ip address and port of nodes
const NodeIPAddresses = require('../static/contract_information/node_IP_address.json');

// implement providers for all nodes of the private chain
const web3Array = new Array();
NodeIPAddresses.forEach(element => {
    web3Array.push(new Web3(new Web3.providers.HttpProvider(element.IPAddress)));
});


// var provider = new Web3.providers.HttpProvider(NodeIPAddresses[0].IPAddress);
// var provider_2 = new Web3.providers.HttpProvider(NodeIPAddresses[1].IPAddress);
// var provider_3 = new Web3.providers.HttpProvider(NodeIPAddresses[2].IPAddress);
// const web3 = new Web3(provider);
// const web3_2 = new Web3(provider_2);
// const web3_3 = new Web3(provider_3);
const { interface, bytecode } = require('../compiles/ACG721Compile');

let accounts;
let accounts_2;
let accounts_3;
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
    
    accounts = await web3Array[0].eth.getAccounts();
    accounts_2 = await web3Array[2].eth.getAccounts();
    accounts_3 = await web3Array[3].eth.getAccounts();

    //console.log(accounts.length);
    console.log("Get account 0 of node 0", accounts[0]);
    console.log("Get account 2 of node 0", accounts[2]);
    console.log("Get account 0 of node 1", accounts_2[0]);
    console.log("Get account 0 of node 2", accounts_3[0]);
    console.log(interface);

    // deploy the contract on node0
    ACG721Token = await new web3Array[0].eth.Contract(JSON.parse(interface))
    .deploy({
        data: "0x" + bytecode,
    })
    .send({
        from: accounts[0],
        gas: '2000000'
    });
    const destAccount = accounts_2[0];
    const fromAccount = accounts_3[0];
    // topup some to sender before transfer
    const topupValue = 10000;
    const topupAddress = fromAccount;
    // await ACG20Token.methods.mint(topupAddress, topupValue).send({
    //     from: accounts[0]
    // });
    // await ACG20Token.methods.mint(destAccount, topupValue).send({
    //     from: accounts[0]
    // });
    // //topup for owner
    // await ACG20Token.methods.mint(accounts[0], topupValue).send({
    //     from: accounts[0]
    // });
    const currentOwnerBalance = await ACG20Token.methods.balanceOf(accounts[0]).call();
    const currentSendBalance = await ACG20Token.methods.balanceOf(fromAccount).call();     //we pre-set it before
    const currentDestBalance = await ACG20Token.methods.balanceOf(destAccount).call(); 
    console.log("Owner balance currently is: ", currentOwnerBalance);
    console.log("sender balance after topup of sender account is: ", currentSendBalance);
    console.log("destination balance: ", currentDestBalance);
    // mint an artwork for token 72
    
})

/**
 *  Before you test, keep in mind that, everytime you envoke a transaction, you need 
 * to specify which account you use to envoke the transaction
 * */ 
describe('ArtChainGlobal ACG721 token smart contract', () => {
    it('allow to post artwork', async () => {
        const user_address = accounts_2[0];
        const adminstrator = accounts[0];
        artwork1 = {
            "type":"paint",
            "artist":"Qin Wang",
            "loyalty":"0.1",
            "status":"normal",
            "prize":"10000"
          };
        const artwork_id = 123456;
        try {
            const previousNumberOfArtwork = await ACG721Token.methods.balanceOf(user_address).call();
            console.log("number of artowrk os user: ", previousNumberOfArtwork);
            await ACG721Token.methods.mint(user_address, artwork_id).send({
                from: adminstrator,
                gas: '20000000'
            });
            postNumberOfArtwork = await ACG721Token.methods.balanceOf(user_address).call();
            console.log("post number of artwork", postNumberOfArtwork);
            assert.equal(1 + previousNumberOfArtwork, postNumberOfArtwork);
        } catch(err) {
            console.log(err);
        }
    })
  
    // it('allow to post artwork', async () => {
    //     const user_address = accounts_2[0];
    //     const adminstrator = accounts[0];
    //     artwork1 = {
    //         "type":"paint",
    //         "artist":"Qin Wang",
    //         "loyalty":"0.1",
    //         "status":"normal",
    //         "prize":"10000"
    //       };
    //     const artwork_id = 123456;
    //     const metadata = JSON.stringify(artwork1);
    //     try {
    //         // const gasValue = await ACG721Token.methods.mintWithMetadata(user_address, artwork_id, metadata).estimateGas({
    //         //     from: adminstrator,
    //         // });
    //         // console.log(gasValue);
    //         await ACG721Token.methods.mintWithMetadata(user_address, artwork_id, metadata).send({
    //             from: adminstrator,
    //         });
    //         // await ACG20Token.methods.mint(user_address, 100).send({
    //         //     from: accounts[0],
    //         // })
    //     } catch(err) {
    //         console.log(err);
    //     }
    // })
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

    // it('allow to pay for artwork', async () => {
    //     const buyer_address = accounts[0];
    //     const owner_address = accounts_2[0];
    //     const artworkid = 12345;
    //     const artwork_value = 500;
    //     const currentBalanceOfBuyer = await ACG20Token.methods.balanceOf(buyer_address).call();
    //     const currentBalanceOfOwner = await ACG20Token.methods.balanceOf(owner_address).call();
    //     const buyer_ether = await web3Array[3].eth.getBalance(buyer_address);
    //     console.log(buyer_ether);
    //     console.log("balance of buyer: ", currentBalanceOfBuyer)
    //     console.log("balance of owner: ", currentBalanceOfOwner);
    //     try {
    //         result = await ACG721Token.methods.receiveApproval(buyer_address, owner_address, artwork_value, artworkid).send({
    //             from: buyer_address,
    //         })
    //         console.log("pay successfully", result.events.a);
    //     } catch(err) {
    //         console.log("pay for artwork error", err);
    //     }
    //     const postBalanceOfBuyer = await ACG20Token.methods.balanceOf(buyer_address).call();
    //     const postBalanceOfOwner = await ACG20Token.methods.balanceOf(owner_address).call();
    //     console.log("balance of buyer after the transaction: ", postBalanceOfBuyer)
    //     console.log("balance of owner after the transaction: ", postBalanceOfOwner);
    //     assert.equal(Number(currentBalanceOfBuyer), Number(postBalanceOfBuyer) + Number(artwork_value));
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
    //     const topupAddress = accounts_2[0];
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
    //     //         from: accounts_2[0]
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
    //     const newFounder = accounts_3[0];
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
    //     const spendingAccount = accounts_3[0];
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
    //     const destAccount = accounts_2[0];
    //     const fromAccount = accounts_3[0];
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
    //     const burningAccount = accounts_2[0];
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
    //     const bidder = accounts_2[0];  
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
    //     const newbidder = accounts_3[0];
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