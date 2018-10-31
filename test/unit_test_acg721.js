const expectThrow = require("../scripts/expectThrow.js")

var ACG721TOKEN = artifacts.require("ACG721");

contract('API Support: add_new_user()', function(accounts) {

  let acg721Inst;
  before ( async () => {
    acg721Inst = await ACG721TOKEN.deployed();
  });
  it("At the beginning, no extant artworks", async function() {
    let totalBalance = await acg721Inst.totalSupply.call();
    assert.equal(totalBalance.toNumber(), 0, "Total supply should be zero at beginning");
  });
  it("At the beginning, user's balance is zero", async function() {
    let userBalance = await acg721Inst.balanceOf.call(accounts[0]);
    assert.equal(userBalance.toNumber(), 0, "User's balance should be zero at beginning");
  });
});

contract('API Support: post_new_artwork()', function(accounts) {
    
  let acg721Inst;
  let artwork1, artwork2;
  let admin = accounts[0];

  before(async() => {
    acg721Inst = await ACG721TOKEN.deployed();
    artwork1 = {
      "type":"paint",
      "artist":"Qin Wang",
      "loyalty":"0.1",
      "status":"normal",
      "prize":"10000"
    };
    artwork2 = {
      "type":"sculpture",
      "artist":"Quong Bui Van",
      "loyalty":"0.3",
      "status":"normal",
      "prize":"50000"
    };
  });
  it("User add artwork", async function() {
    await acg721Inst.mintWithMetadata(accounts[1], 1, JSON.stringify(artwork1));
    let userBalance = await acg721Inst.balanceOf.call(accounts[1]);
    assert.equal(userBalance.toNumber(), 1, "User should have 1 artwork token");

    await acg721Inst.mintWithMetadata(accounts[2], 2, JSON.stringify(artwork2));
    userBalance = await acg721Inst.balanceOf.call(accounts[2]);
    assert.equal(userBalance.toNumber(), 1, "User should have 1 artwork token");
  });
  it("User is not permitted to add artwork with existent token ID", async function() {
    await expectThrow(acg721Inst.mintWithMetadata(accounts[3], 1, JSON.stringify(artwork1), "Exception: artwork with existent ID is added"));
    let userBalance = await acg721Inst.balanceOf.call(accounts[3]);
    assert.equal(userBalance.toNumber(), 0, "User should fail to add artwork with existent ID");
  });
  it("User is permitted to add artwork without any information", async function() {
    await acg721Inst.mint(accounts[3], 3);
    let userBalance = await acg721Inst.balanceOf.call(accounts[3]);
    assert.equal(userBalance.toNumber(), 1, "User should have 1 artwork token");
  });
  it("Only contract owner is able to change token's metadata", async function() {
    const updated_artwork2 = {
      "type":"sculpture",
      "artist":"Quong Bui Van",
      "loyalty":"0.3",
      "status":"normal",
      "prize":"10000"       // change prize of the artwork
    };
    // Update token's medata - only contract owner is able to do it.
    await acg721Inst.updateMetadata(2, JSON.stringify(updated_artwork2), {from: admin});
    const artwork2_metadata = await acg721Inst.referencedMetadata.call(2);
    const updated_artwork2_from_contract = JSON.parse(artwork2_metadata);
    assert.equal(updated_artwork2.prize, updated_artwork2_from_contract.prize, "Token's metadata should be changed");
  });
});
contract('API Support: buy_artwork()', function(accounts) {
  let acg721Inst;
  let artwork1, artwork2;

  before(async() => {
    acg721Inst = await ACG721TOKEN.deployed();
    artwork1 = {
      "type":"paint",
      "artist":"Qin Wang",
      "loyalty":"0.1",
      "status":"normal",
      "prize":"10000"
    };
    artwork2 = {
      "type":"sculpture",
      "artist":"Quong Bui Van",
      "loyalty":"0.3",
      "status":"normal",
      "prize":"50000"
    };
    await acg721Inst.mintWithMetadata(accounts[1], 1, JSON.stringify(artwork1));
    await acg721Inst.mintWithMetadata(accounts[2], 2, JSON.stringify(artwork2));
    await acg721Inst.mint(accounts[3], 3);
  });
  it("user buy an artwork from another user", async () => {
    await acg721Inst.transfer(accounts[4], 1, {from:accounts[1]});
    let sellerBalance = await acg721Inst.balanceOf.call(accounts[1]);
    let buyerBalance = await acg721Inst.balanceOf.call(accounts[4]);
    assert.equal(sellerBalance.toNumber(), 0, "seller's balance decreased");
    assert.equal(buyerBalance.toNumber(), 1, "buyer's balance increased");
  });
  it("Selling artwork to an invalid address is not permitted", async () => {
    await expectThrow(acg721Inst.transfer(0, 3, {from:accounts[3]}), "Selling to empty address should fail");
  });
  it("User should not sell artwork not belonging him", async () => {
    await expectThrow(acg721Inst.transfer(accounts[0], 3, {from:accounts[1]}), "Selling an artworing belonging others should fail");
  });
  it("User should not sell an non-existent artwork", async () => {
    await expectThrow(acg721Inst.transfer(accounts[0], 0, {from:accounts[1]}), "Selling an non-existent artworing should fail");
  });
});
contract('API Support: buy_token()', function(accounts) {
  // do nothing
});

contract('API Support: freeze_token()', function(accounts) {
  // need to nothing
});

contract('API Support: check_artwork()', function(accounts) {
  let acg721Inst;
  let artwork1;

  before(async() => {
    acg721Inst = await ACG721TOKEN.deployed();
    artwork1 = {
      "type":"paint",
      "artist":"Qin Wang",
      "loyalty":"0.1",
      "status":"In auction",
      "prize":"10000"
    };
    await acg721Inst.mintWithMetadata(accounts[1], 1, JSON.stringify(artwork1));
  });
  it("Check artwork's owner]", async () => {
    let owner = await acg721Inst.ownerOf(1);
    assert.equal(owner, accounts[1], "Artwork's owner is expected account");
  });
  it("Usser address should be empty for an non-existent artwork]", async () => {
    let owner = await acg721Inst.ownerOf(2);
    assert.equal(owner, 0, "Artwork's owner is expected to be empty");
  });
  it("Check artwork status", async () => {
    let artworkMeta = await acg721Inst.referencedMetadata(1);
    let artworkInfo = JSON.parse(artworkMeta);
    assert.equal(artworkInfo.type, "paint", "Artwork's status is expected to be 'In auction'");
    assert.equal(artworkInfo.artist, "Qin Wang", "Artwork's status is expected to be 'In auction'");    
    assert.equal(artworkInfo.loyalty, "0.1", "Artwork's status is expected to be 'In auction'");
    assert.equal(artworkInfo.status, "In auction", "Artwork's status is expected to be 'In auction'");
    assert.equal(artworkInfo.prize, "10000", "Artwork's status is expected to be 'In auction'");
  });
});

contract('API Support: check_user()', function(accounts) {
  // need to nothing
});

contract('API Support: check_transaction()', function(accounts) {
  // need to nothing
});

contract('API Support: check_transaction()', function(accounts) {
  // need to nothing
});

contract('Code dev: approve() and transferFrom()', function(accounts) {
  let acg721Inst;
  let artwork1, artwork2;

  before(async() => {
    acg721Inst = await ACG721TOKEN.deployed();
    artwork1 = {
      "type":"paint",
      "artist":"Qin Wang",
      "loyalty":"0.1",
      "status":"normal",
      "prize":"10000"
    };
    artwork2 = {
      "type":"sculpture",
      "artist":"Quong Bui Van",
      "loyalty":"0.3",
      "status":"normal",
      "prize":"50000"
    };
    await acg721Inst.mintWithMetadata(accounts[1], 1, JSON.stringify(artwork1));
    await acg721Inst.mintWithMetadata(accounts[2], 2, JSON.stringify(artwork2));
  });
  it("User grants other user to take possession of his artwork", async function() {
    await acg721Inst.approve(accounts[0], 1, {from: accounts[1]});
    await acg721Inst.approve(accounts[0], 2, {from: accounts[2]});
  });
  it("User should not grants an artwork not belonging to him", async function() {
    await expectThrow(acg721Inst.approve(accounts[3], 2, {from: accounts[1]}));
  });
  it("Granted user should be able to sell the artwork to others", async function() {
    await acg721Inst.transferFrom(accounts[1], accounts[3], 1, {from: accounts[0]});
    await acg721Inst.transferFrom(accounts[2], accounts[3], 2, {from: accounts[0]});

    let owner = await acg721Inst.ownerOf(1);
    assert.equal(owner, accounts[3], "Artwork is sold by approved user");
    owner = await acg721Inst.ownerOf(2);
    assert.equal(owner, accounts[3], "Artwork is sold by approved user");
  });
});


