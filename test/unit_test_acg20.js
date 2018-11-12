const expectThrow = require("../scripts/expectThrow.js")

var ACG20TOKEN = artifacts.require("ACG20");

contract('API Support: add_new_user()', function(accounts) {
  let acg20Inst;
  let userInitBalance = 1e4;
  let totalSupply = userInitBalance * accounts.length;
  let userBalance = [];
  let contractOwner = accounts[0];
  
  before("Add users with initial balances", async () => {
    acg20Inst = await ACG20TOKEN.deployed();

    accounts.forEach(async (user) => {
      await acg20Inst.mint(user, userInitBalance);
    });
    accounts.forEach( (user) => {
      userBalance[user] = userInitBalance;
    });
  });
  it("Check the total balance is set correctly", async function() {
    let totalSupplyValue = await acg20Inst.totalSupply.call();
    assert.equal(totalSupplyValue.toNumber(), totalSupply, "Total supply should be 300")
  });
  it("Only contract owner is permitted to mint", async function () {
    let mintAmount = 5e3;
    await expectThrow(acg20Inst.mint(accounts[1], mintAmount, {from: accounts[1]}), "General user is not permitted to mint");
  });
  it("Contract owner could mint to incrase total supply", async function() {
    let mintAmount = 5e3;
    await acg20Inst.mint(accounts[1], mintAmount, {from: contractOwner});
    totalSupply += mintAmount;
    userBalance[accounts[1]] += mintAmount;

    let newBalance = await acg20Inst.balanceOf.call(accounts[1]);
    let newTotalSupply = await acg20Inst.totalSupply.call();

    assert.equal(newBalance.toNumber(), userBalance[accounts[1]], "User's balance increased after minting");
    assert.equal(newTotalSupply.toNumber(), totalSupply, "Total supply increased after minting");
  });
});

contract('API Support: post_new_artwork()', function(accounts) {
  // need to nothing
});

contract('API Support: buy_token()', function(accounts) {
  let acg20Inst;
  let contractOwner = accounts[0];
  let totalSupply = 0;

  before(async () => {
    acg20Inst = await ACG20TOKEN.deployed();
  });
  it("Initial total supply should be zero", async () => {
    let totalSupplyValue = await acg20Inst.totalSupply.call();
    assert.equal(totalSupplyValue.toNumber(), totalSupply, "Intial total supply should be zero");
  });
  it("Buy token should increase total supply", async () => {
    let newTokenAmount = 1e5;
    totalSupply += newTokenAmount;
    await acg20Inst.mint(accounts[1], newTokenAmount, {from: contractOwner});

    let totalSupplyValue = await acg20Inst.totalSupply.call();
    assert.equal(totalSupplyValue.toNumber(), totalSupply, "Total supply increased")
  });
});

contract('API Support: buy_artwork()', function(accounts) {
  let acg20Inst;
  let userInitBalance = 1e4;
  let totalSupply = userInitBalance * accounts.length;
  let userBalance = [];

  before("Add users with initial balances", async () => {
    acg20Inst = await ACG20TOKEN.deployed();

    accounts.forEach(async (user) => {
      await acg20Inst.mint(user, userInitBalance);
    });
    accounts.forEach( (user) => {
      userBalance[user] = userInitBalance;
    });
  });
  it("transfer money from one user to another", async () => {
    let sender = accounts[0];
    let receiver = accounts[1];
    let transferAmout = 1e3;
    let artworkId = 0;

    await acg20Inst.payForArtwork(receiver, transferAmout, artworkId, {from: sender});
    userBalance[sender] -= transferAmout;
    userBalance[receiver] += transferAmout;

    let senderBalanceValue = await acg20Inst.balanceOf.call(sender);
    let recverBalanceValue = await acg20Inst.balanceOf.call(receiver);
    let totalSupplyValue = await acg20Inst.totalSupply.call();

    assert.equal(totalSupplyValue.toNumber(), totalSupply, "Total supply should not change");
    assert.equal(senderBalanceValue.toNumber(), userBalance[sender], "Balance of sender is decreased");
    assert.equal(recverBalanceValue.toNumber(), userBalance[receiver], "Balance of receiver is increased");
  });
  it("User can grant amount of tokens to another user", async () => {
    let owner = accounts[3];
    let spender = accounts[4];
    let approvedAmount = 5e3;

    await acg20Inst.approve(spender, approvedAmount, {from:owner});

    let approvedValue = await acg20Inst.allowance.call(owner, spender);
    assert.equal(approvedValue.toNumber(), approvedAmount, "Spender received expected amount");

    let ownerBalance = await acg20Inst.balanceOf.call(owner);
    assert(ownerBalance.toNumber(), userBalance[owner], "Owner's balance should not be affected by approval operation");
  });
  it("Owner could ask a delegator to transfer his tokens", async () => {
    let owner = accounts[3];
    let spender = accounts[4];
    let receiver = accounts[5];
    let artworkId = 0;
    
    // Record status before transfer operation
    let approvedAmount = await acg20Inst.allowance.call(owner, spender).then((value) => {
      return value.toNumber();
    });
    const transferAmount = approvedAmount/2;
    const commission = 0;

    // Submit transfer operation
    await acg20Inst.payForArtworkFrom(owner, receiver, transferAmount, commission, artworkId, {from:spender});

    approvedAmount -= transferAmount;
    userBalance[owner] -= transferAmount;
    userBalance[receiver] += transferAmount;

    // Record status after transfer operation
    let approvedAfter = await acg20Inst.allowance.call(owner, spender);
    let ownerBalanceAfter = await acg20Inst.balanceOf.call(owner);
    let receiverBalanceAfter = await acg20Inst.balanceOf.call(receiver);

    assert.equal(approvedAfter.toNumber(), approvedAmount, "Approved amount reduced by transfer operation");
    assert.equal(ownerBalanceAfter.toNumber(), userBalance[owner], "Owner's balanced is reduced by transfer operation");
    assert.equal(receiverBalanceAfter.toNumber(), userBalance[receiver], "Receiver's balance is increased by transfer operation");
  });
});

contract('API Support: freeze_token()', function(accounts) {

  let acg20Inst;
  let admin = accounts[0];
  let userInitBalance = 1e4;
  let userBalance = [];
  let totalSupply;

  let bidForArt1 = 0;
  let bidderForArt1;

  let bidForArt2 = 0;
  let bidderForArt2;

  let artist = accounts[4];
  let artwork1 = 0;
  let artwork2 = 1;

  before(async () => {
    acg20Inst = await ACG20TOKEN.deployed();

    accounts.forEach(async (user) => {
      await acg20Inst.mint(user, userInitBalance);
    });
    accounts.forEach( (user) => {
      userBalance[user] = userInitBalance;
    });
    totalSupply = userInitBalance * accounts.length;
  });
  it("Only contract owner is able of freezing tokens", async () => {
    let frozenAmount = 1e3;
    await expectThrow(acg20Inst.freeze(accounts[1], frozenAmount, artwork1, {from: accounts[1]}), "General user is not permitted to freeze tokens");
  });
  it("Frozen tokens amount should not exceed user's balance", async () => {
    let frozenUser = accounts[1];
    let frozenAmount = userBalance[frozenUser] + 1;
    await expectThrow(acg20Inst.freeze(frozenUser, frozenAmount, artwork1, {from: admin}), "Frozen amount should not exceed user balance");
  });
  it("freeze() will reduce user balance but won't change total supply", async () => {
    bidForArt1 = 1e3;
    bidderForArt1 = accounts[1];

    // Buyer need approve his token to be frozen by administrator beforehead

    await acg20Inst.approve(admin, bidForArt1, {from: bidderForArt1});

    await acg20Inst.freeze(bidderForArt1, bidForArt1, artwork1, {from: admin});
    userBalance[bidderForArt1] -= bidForArt1;

    let newBalance = await acg20Inst.balanceOf.call(bidderForArt1);
    assert.equal(newBalance.toNumber(), userBalance[bidderForArt1], "User's balance should be reduced by frozen amount");

    let newTotal = await acg20Inst.totalSupply.call();
    assert.equal(newTotal.toNumber(), totalSupply, "Total supply should not affected by freeze() operation");
  });
  it("If other user provides a higher bid, then token is unfrozen for previous bidder", async () => {
    let prevBidForArt1 = bidForArt1;
    let prevBidderForArt1 =bidderForArt1;
    bidForArt1 = 2e3;
    bidderForArt1 = accounts[2];

    await acg20Inst.approve(admin, bidForArt1, {from: bidderForArt1});
    await acg20Inst.freeze(bidderForArt1, bidForArt1, artwork1, {from: admin});
    userBalance[prevBidderForArt1] += prevBidForArt1;
    userBalance[bidderForArt1] -= bidForArt1;

    let newBalance = await acg20Inst.balanceOf.call(prevBidderForArt1);
    assert.equal(newBalance.toNumber(), newBalance, "Frozen tokens should be withdrawn");
  });
  it("User can even provides higher bid than his own", async () => {
    let prevBidForArt1 = bidForArt1;
    bidForArt1 = 5e3;

    await acg20Inst.approve(admin, bidForArt1, {from: bidderForArt1});
    await acg20Inst.freeze(bidderForArt1, bidForArt1, artwork1, {from: admin});
    userBalance[bidderForArt1] += prevBidForArt1;
    userBalance[bidderForArt1] -= bidForArt1;

    let newBalance = await acg20Inst.balanceOf.call(bidderForArt1);
    assert.equal(newBalance.toNumber(), userBalance[bidderForArt1], "User's balance should be decreased by his highest bid");
  });
  it("User can bid for more than one artwork at the same time", async () => {
    bidderForArt2 = bidderForArt1;
    bidForArt2 = 2e3;
    await acg20Inst.approve(admin, bidForArt2, {from: bidderForArt2});
    await acg20Inst.freeze(bidderForArt2, bidForArt2, artwork2, {from: admin});
    userBalance[bidderForArt2] -= bidForArt2;

    let newBalance = await acg20Inst.balanceOf.call(bidderForArt2);
    assert.equal(newBalance.toNumber(), userBalance[bidderForArt2], "User's balance should be further decreased by his bid for another artwork");
  });
  it("During auction, check recorded bid price and bidder", async () => {
    let recordBidderForArt1 = await acg20Inst.highestBidder.call(artwork1);
    let recordBidForArt1 = await acg20Inst.highestBid.call(artwork1);
  
    assert.equal(recordBidderForArt1, bidderForArt1, "recorded bidder should be user with highest bid");
    assert.equal(recordBidForArt1.toNumber(), bidForArt1, "recorded bid should be current highest bid")

    let recordBidderForArt2 = await acg20Inst.highestBidder.call(artwork2);
    let recordBidForArt2 = await acg20Inst.highestBid.call(artwork2);
    assert.equal(recordBidderForArt2, bidderForArt2, "recorded bidder should be user with highest bid");
    assert.equal(recordBidForArt2.toNumber(), bidForArt2, "recorded bid should be current highest bid")
  });
  it("Bidder's payment should match his bid, or an expection would be thrown out", async () => {
    let wrongPrice = bidForArt2+1;
    await expectThrow(acg20Inst.payForArtwork(artist, wrongPrice, artwork2, {from:bidderForArt2}), "Exception: transfer value is mismatching with auction price");
  });
  it("With expection, any change will be rewinded, so user's balance keep unchanged", async () => {
    let balance = await acg20Inst.balanceOf.call(bidderForArt2);
    assert.equal(balance.toNumber(), userBalance[bidderForArt2], "User's balance shall not change if an expection is throw from contract");
  });
  it("After user pay for auction, his balanced should be decreased", async () => {
    // end of the auction
    await acg20Inst.payForArtwork(artist, bidForArt2, artwork2, {from:bidderForArt2});
    userBalance[artist] += bidForArt2;

    let balance = await acg20Inst.balanceOf.call(bidderForArt2);
    assert.equal(balance.toNumber(), userBalance[bidderForArt2], "Payment should come from the frozen part");

    balance = await acg20Inst.balanceOf.call(artist);
    assert.equal(balance.toNumber(), userBalance[artist], "Balance of artist should increase after auction");
  });
  it("If auction is cancelled, then user's frozen token should be returned to his account", async() => {
    await acg20Inst.unfreeze(artwork1, {from:admin});
    userBalance[bidderForArt1] += bidForArt1;

    const balance = await acg20Inst.balanceOf.call(bidderForArt1);
    assert.equal(balance.toNumber(), userBalance[bidderForArt1], "Frozen tokens should be returned if the auction cancelled");
  });
});

contract('API Support: check_artwork()', function(accounts) {
  // need to nothing
});

contract('API Support: check_user()', function(accounts) {
  // need to nothing
});

contract('API Support: check_transaction()', function(accounts) {
  // need to nothing
});

contract('Code dev: burn() and burnFrom()', function(accounts) {
  let acg20Inst;
  let userInitBalance = 1e4;
  let userBalance = new Array;

  before ( async () => {
    acg20Inst = await ACG20TOKEN.deployed();
    accounts.forEach(async (user, index) => {
      await acg20Inst.mint(user, userInitBalance);
    });
    for (let index=0; index<accounts.length; index++) {
      userBalance[index] = userInitBalance;
    }
  });
  it("User should destroy any amount of tokens under his balance", async () => {
    let burnedAmount = 100;
    userBalance[0] = userBalance[0] - burnedAmount;
    await acg20Inst.burn(burnedAmount, {from:accounts[0]});
    let balance = await acg20Inst.balanceOf(accounts[0]);
    assert.equal(balance.toNumber(), userBalance[0], "Some tokesn are burned");
  });
  it("User should not destroy tokesn amount more than this balance", async () => {
    await expectThrow(acg20Inst.burn(userBalance[0]+1, {from: userBalance[0]}), "Burned amount exceeds account balance");
  });
  it("User can grants amout of tokens to a delegator", async () => {
    let owner = accounts[1];
    let expectedBalance = userBalance[1];
    let spender = accounts[2];
    let grantedToken = 2e3;
    
    await acg20Inst.approve(spender, grantedToken, {from:owner});
    let balance = await acg20Inst.balanceOf(owner);
    let allowToken = await acg20Inst.allowance(owner, spender);

    assert.equal(allowToken, grantedToken, "Allowed amount of token should be equal to the granted amount");
    assert.equal(balance, expectedBalance, "Approval action should have no effect to user's balance");
  });
  it("After user grants amount of tokens to a delegator, delegator could destroy the granted part", async () => {
    let grantedToken = 2e3;
    let owner = accounts[1];
    let ownerBalance = userBalance[1];

    let spender = accounts[2];
    await acg20Inst.burnFrom(owner, grantedToken, {from:spender});
    ownerBalance = ownerBalance - grantedToken;

    let balance = await acg20Inst.balanceOf.call(owner);
    assert.equal(balance, ownerBalance, "Owner's token shoud be burned by approver")
  });
});

contract('Code dev: transferOwnerShip', function(accounts) {
  let acg20Inst;
  let owner, newOwner;

  before ( async () => {
    acg20Inst = await ACG20TOKEN.deployed();
    owner = accounts[0];
    newOwner = accounts[1];
  });
  it("After contract deployement, the owner should be who created the contract", async () => {
    let ownerValue = await acg20Inst.owner.call();
    assert.equal(ownerValue, owner, "Expected owner address");
  });
  it("Ownership could not be transferred to an zero address", async () => {
    await expectThrow(acg20Inst.transferOwnership(0), "Transferring ownership to zero address will throw an exception");
  });
  it("Ownership could be transferred to a valid user", async () => {
    await acg20Inst.transferOwnership(newOwner, {from:owner});
    let ownerValue = await acg20Inst.owner.call();
    assert.equal(ownerValue, newOwner, "Expected new owner address");
  });
});
