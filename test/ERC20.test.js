const assert = require('assert');
//const ganache = require('ganache-cli');   //note that ganache does not work on private chain
//import web3
const Web3 = require('web3');

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
const { interface, bytecode } = require('../compiles/compile');

let AGC20Token;
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
    accounts_2 = await web3Array[1].eth.getAccounts();
    accounts_3 = await web3Array[2].eth.getAccounts();

    //console.log(accounts.length);
    console.log("Get account 0 of node 0", accounts[0]);
    console.log("Get account 2 of node 0", accounts[2]);
    console.log("Get account 0 of node 1", accounts_2[0]);
    console.log("Get account 0 of node 2", accounts_3[0]);
    //console.log(interface);

    //deploy the contract on node0
    AGC20Token = await new web3Array[0].eth.Contract(JSON.parse(interface))
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
    await AGC20Token.methods.mint(topupAddress, topupValue).send({
        from: accounts[0]
    });
    await AGC20Token.methods.mint(destAccount, topupValue).send({
        from: accounts[0]
    });
    //topup for owner
    await AGC20Token.methods.mint(accounts[0], topupValue).send({
        from: accounts[0]
    });
    const currentOwnerBalance = await AGC20Token.methods.balanceOf(accounts[0]).call();
    const currentSendBalance = await AGC20Token.methods.balanceOf(fromAccount).call();     //we pre-set it before
    const currentDestBalance = await AGC20Token.methods.balanceOf(destAccount).call(); 
    console.log("Owner balance currently is: ", currentOwnerBalance);
    console.log("sender balance after topup of sender account is: ", currentSendBalance);
    console.log("destination balance: ", currentDestBalance);
    
})

/**
 *  Before you test, keep in mind that, everytime you envoke a transaction, you need 
 * to specify which account you use to envoke the transaction
 * */ 
describe('ArtChainToken smart contract', () => {

    // it('deplys a ERC Token contract', async () => {
        
    //     console.log("testing the adress of deployment", AGC20Token.options.address);  
    //     console.log(AGC20Token.methods);      
    //     assert.ok(AGC20Token.options.address);
    //     // this.timeout(15000);
    //     // setTimeout(done, 10000);
    // });
    // it('allow to get balanceOf an account', async () => {
    //     //test balance of founder who we set to acounts[0] of node0
    //     const node0Account0_balanceOf = await AGC20Token.methods.balanceOf(accounts[0]).call({
    //         from: accounts[0]
    //     });
    //     console.log("acount 0 of node0 balance: ", node0Account0_balanceOf);
    //     assert.equal(0, node0Account0_balanceOf);
    // });

    // // Testing the return name of the token
    // it('allow getting name of token', async () => {
    //     const tokenName = await AGC20Token.methods.name().call({
    //         from: accounts[0]
    //     });
    //     console.log("Token name", tokenName);
    //     assert.equal(originTokenName, tokenName);
    // })
    // //Testing get owner - predefine = accounts[0]
    // it('get the owner: ', async () => {
    //     const getOwner = await AGC20Token.methods.owner().call();
    //     console.log("the owner who create the contract is: ", getOwner);
    //     assert.equal(accounts[0], getOwner);
    // })
    // it('get total supply: ', async () => {
    //     const totalSupply = await AGC20Token.methods.totalSupply().call();
    //     console.log("total supply of the token ACG20: ", totalSupply);
    //     assert.equal(0, totalSupply);
    // })
    // it('top up token for user accounts_1[0] by owner only', async () => {
    //     const topupValue = 1000;
    //     const topupAddress = accounts_2[0];
    //     const previousBalance = await AGC20Token.methods.balanceOf(topupAddress).call();
    //     console.log('previous balance is: ', previousBalance);
    //     await AGC20Token.methods.mint(topupAddress, topupValue).send({
    //         from: accounts[0]
    //     });
    //     const newAccountBalance = await AGC20Token.methods.balanceOf(topupAddress).call();
    //     console.log(newAccountBalance);
    //     assert.equal(Number(topupValue) + Number(previousBalance), Number(newAccountBalance));
    //     // cannot topup for the account if sender is not the founder/owner
    //     // this need to recode on solidity and test again since it gave an error not handdled
    //     // const notAllowedTopupResult = false;
    //     // try {
    //     //     await AGC20Token.methods.mint(topupAddress, topupValue).send({
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
    //     assert.ok(await AGC20Token.methods.halt().call());
    // })
    // test changing new founder
    // it('allow change founder', async () => {
    //     const newFounder = accounts_3[0];
    //     const founderChangeResult = await AGC20Token.methods.changeFounder(newFounder).send({
    //         from: accounts[0]
    //     });
    //     console.log("the new founder is: ", await AGC20Token.methods.founder().call());
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
    //         const approvedResult = await AGC20Token.methods.approve(spendingAccount, spendingValue).send({
    //             from: approvedAccount,
    //         })
    //         if (approvedResult) {
    //             console.log('approval result: ', approvedResult);
    //             const approvedValue = await AGC20Token.methods.allowance(approvedAccount, spendingAccount).call();
    //             console.log("value allowed for spending: ", approvedValue);
    //             assert.equal(spendingValue, approvedValue);
    //         } else {
    //             console.log("Approve result in false result", approvedResult);
    //             const approvedValue = await AGC20Token.methods.allowance(approvedAccount, spendingAccount).call();
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
    //         const approvedResult = await AGC20Token.methods.approve(spendingAccount, transferValue).call({
    //             from: fromAccount,
    //         })
    //         if (approvedResult === true) {
    //             const approvedValue = await AGC20Token.methods.allowance(fromAccount, spendingAccount).call({
    //                 from: fromAccount,
    //             })
    //             console.log("value allowed for spending: ", approvedValue);
    //             console.log("approval success, transferring now ...", approvedResult);
    //             try {
    //                 await AGC20Token.methods.transferFrom(fromAccount, destAccount, transferValue).send({
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
    //     const newOwnerBalance = await AGC20Token.methods.balanceOf(accounts[0]).call();
    //     const newBalanceOfDestination = await AGC20Token.methods.balanceOf(destAccount).call();
    //     const newBalanceOfSender = await AGC20Token.methods.balanceOf(fromAccount).call();
    //     //console.log(AGC20Token.methods); 
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
    //     console.log("current balance of burningAccount: ", await AGC20Token.methods.balanceOf(burningAccount).call());
    //     // try cat to burn tokens
    //     try {
    //         const result = await AGC20Token.methods.burnFrom(burningAccount, burningValue).send({
    //             from: founder
    //         })
    //         if (result) {
    //             console.log("successfully burnt token");
    //             console.log("new balance of burningAccount: ", await AGC20Token.methods.balanceOf(burningAccount).call())
    //         } else {
    //             console.log("result of burning token is not true, ", result);
    //             console.log("new balance of burningAccount: ", await AGC20Token.methods.balanceOf(burningAccount).call())
    //         }
    //     } catch(err) {
    //         console.log("burning token error somewhere as: ", err);
    //     }
    // })

    /**
     * FREEZE FUNCTION TESTING
     * 
     */
    it('allow the owner to freeze an amount of token from given acount based on artworkid', async () => {
        //initiate some constants for the test, and these constant provided by web interface in production
        const artworkid = 12345;    
        const bidAmount = 300;    
        const bidder = accounts_2[0];  
        const contractFounder = accounts[0];
        const currentBalance = await AGC20Token.methods.balanceOf(bidder).call();
        console.log ("before bid balance of bidder: ", currentBalance);

        // free the bidAmount token of the bidArress
        try {
            const result = await AGC20Token.methods.freeze(bidder, bidAmount, artworkid).send({
                from: contractFounder,
            });
            //console.log("freeze result in true: ", result);
            const newBalance = await AGC20Token.methods.balanceOf(bidder).call();
            console.log("new balance ofter freezing is: ", newBalance);
            assert.equal(currentBalance - bidAmount, newBalance);
        } catch(err) {
            console.log("freeze false becuase of something, error object is: ", err);
        }

        //test unfreeze account of the above user by inserting a new bid with new bidder
        const newBidAmount = 400;
        const newbidder = accounts_3[0];
        const currentBalanceNewBidder = await AGC20Token.methods.balanceOf(newbidder).call();
        console.log(currentBalanceNewBidder);
        try {
            const result = await AGC20Token.methods.freeze(newbidder, newBidAmount, artworkid).send({
                from: contractFounder,
            })
            const newBalanceNewBidder = await AGC20Token.methods.balanceOf(newbidder).call();
            console.log("new balance of the new bidder: ", newBalanceNewBidder);
            assert.equal(currentBalanceNewBidder - newBidAmount, newBalanceNewBidder);
            const newBalancePreBidder = await AGC20Token.methods.balanceOf(bidder).call();
            console.log("new balance of the previous bidder return: ", newBalancePreBidder);
            assert.equal(newBalancePreBidder, currentBalance);
        } catch(err) {
            console.log("freeze false becuase of something, error object is: ", err);
        }
    })
   
})