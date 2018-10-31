const expectThrow = require("../scripts/expectThrow.js")

var ACG721TOKEN = artifacts.require("ACG721");
var ACG20TOKEN = artifacts.require("ACG20");

contract('approveAndCall()', function(accounts) {
    let acg20Inst;
    let acg721Inst;
    let userInitBalance = 2e4;
    let totalSupply = userInitBalance * accounts.length;
    let userBalance = [];
    let admin;
    let artist;
    let buyer;
    let artwork1;
    let artwork2;

    before(async() => {
        admin = accounts[0];
        artist = accounts[1];

        acg20Inst = await ACG20TOKEN.deployed();
        acg721Inst = await ACG721TOKEN.deployed();

        // initialize user's ACG20 balance
        accounts.forEach(async (user) => {
            await acg20Inst.mint(user, userInitBalance);
        });
        accounts.forEach( (user) => {
            userBalance[user] = userInitBalance;
        });

        // initialize user's ACG721 balance
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
          await acg721Inst.mintWithMetadata(artist, 1, JSON.stringify(artwork1));
          await acg721Inst.mintWithMetadata(artist, 2, JSON.stringify(artwork2));
    });
    it("Before calling approveAndCall(), register contracts to each other", async() => {
        await acg20Inst.registerACG721Contract(acg721Inst.address, {from: admin});
        await acg721Inst.registerACG20Contract(acg20Inst.address, {from: admin});

        let registered20 = await acg721Inst.acg20Contract.call();
        let registered721 = await acg20Inst.acg721Contract.call();
        
        assert.equal(acg20Inst.address, registered20, "Correct contract ACG20 is registered");
        assert.equal(acg721Inst.address, registered721, "Correct contract ACG721 is registered");
    });
    it("Before call approveAndCall(), seller need approve ACG721 contract to transfer his token with specific ID", async () => {
        buyer = accounts[2];
        let artworkId = 1;
        let artworkPrice = Number(artwork1.prize);

        await expectThrow(acg20Inst.approveAndCall(artist, artworkPrice, artworkId, {from: buyer}), "Seller need to approve ACG721 contract to transfer the token");
    });
    it("If transaction failed, then there should be no change to the contracts", async () => {
        let buyerBalance = await acg20Inst.balanceOf.call(buyer);
        let sellerBalance = await acg20Inst.balanceOf.call(artist);
        assert.equal(buyerBalance.toNumber(), userBalance[buyer], "Buyer's balance should keep unchanged");
        assert.equal(sellerBalance.toNumber(), userBalance[artist], "Seller's balance should keep unchanged");
    });
    it("Call approveAndCall() to establish the purchase", async() => {
        let artworkId = 1;
        let artworkPrice = Number(artwork1.prize);
        
        await acg721Inst.approve(acg20Inst.address, artworkId, {from: artist});
        await acg20Inst.approveAndCall(artist, artworkPrice, artworkId, {from: buyer});
        userBalance[artist] += artworkPrice;
        userBalance[buyer] -= artworkPrice;

        let artistBalance = await acg20Inst.balanceOf.call(artist);
        let buyerBalance = await acg20Inst.balanceOf.call(buyer);
        let ownerOfArtwork = await acg721Inst.ownerOf.call(artworkId);

        assert.equal(artistBalance.toNumber(), userBalance[artist], "Artist should receive the payment");
        assert.equal(buyerBalance.toNumber(), userBalance[buyer], "Buyer should pay for the artwork");
        assert.equal(ownerOfArtwork, buyer, "Artwork should be transferred to buyer");
    });
    it("Call approveAndCall() will fail if buyer's price exceeds his balance", async () => {
        let artworkId = 2;
        let artworkPrice = Number(artwork2.prize);

        await acg721Inst.approve(acg20Inst.address, artworkId, {from: artist});
        await expectThrow(acg20Inst.approveAndCall(artist, artworkPrice, artworkId, {from: buyer}), "Expection is thrown out if price exceeds buyer's balance");
    
        let buyerBalance = await acg20Inst.balanceOf.call(buyer);
        let sellerBalance = await acg20Inst.balanceOf.call(artist);
        let ownerOfArtwork = await acg721Inst.ownerOf.call(artworkId);

        assert.equal(buyerBalance.toNumber(), userBalance[buyer], "Buyer's balance should keep unchanged");
        assert.equal(sellerBalance.toNumber(), userBalance[artist], "Seller's balance should keep unchanged");
        assert.equal(ownerOfArtwork, artist, "Owner of the artwork should keep unchanged");
    });
});