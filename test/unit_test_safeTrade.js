const expectThrow = require("../scripts/expectThrow.js")

var ACG721TOKEN = artifacts.require("ACG721");
var ACG20TOKEN = artifacts.require("ACG20");
var ACG20PROXY = artifacts.require("OwnedUpgradeabilityProxy");
var ACG721PROXY = artifacts.require("OwnedUpgradeabilityProxy");

contract('approveAndCall()', function(accounts) {
    let acg20Inst;
    let acg721Inst;
    let userInitBalance = 2e4;
    let totalSupply = userInitBalance * accounts.length;
    let userBalance = [];
    let admin;
    let artist;
    let buyer;
    let artwork1 = {
        "type":"paint",
        "artist":"Qin Wang",
        "loyalty":"0.1",
        "status":"normal",
        "prize":"10000"
      };
    let artwork2 = {
        "type":"sculpture",
        "artist":"Quong Bui Van",
        "loyalty":"0.3",
        "status":"normal",
        "prize":"50000"
      };

    before(async() => {
        admin = accounts[0];
        artist = accounts[1];
        curator = accounts[2];
        collector = accounts[3];
        buyer = accounts[4];

        acg20 = await ACG20TOKEN.new();
        acg721 = await ACG721TOKEN.new();

        acg20Proxy = await ACG20PROXY.new(acg20.address);
        acg721Proxy = await ACG721PROXY.new(acg721.address);

        acg20Inst = await ACG20TOKEN.at(acg20Proxy.address);
        acg721Inst = await ACG721TOKEN.at(acg721Proxy.address);

        await acg20Inst.initializer({from: admin});
        await acg721Inst.initializer({from: admin});

        // initialize user's ACG20 balance
        accounts.forEach(async (user) => {
            await acg20Inst.mint(user, userInitBalance, {from: admin});
        });
        accounts.forEach( (user) => {
            userBalance[user] = userInitBalance;
        });

        // initialize user's ACG721 balance
        await acg721Inst.mintWithMetadata(collector, 1, JSON.stringify(artwork1));
        await acg721Inst.mintWithMetadata(collector, 2, JSON.stringify(artwork2));
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
        let artworkId = 1;
        let artworkPrice = Number(artwork1.prize);

        const recepients = [collector];
        const tokens = [artworkPrice];

        await expectThrow(acg20Inst.safeTokenTrade(artworkPrice, artworkId, recepients, tokens, {from: buyer}), "Seller need to approve ACG721 contract to transfer the token");
    });
    it("If transaction failed, then there should be no change to the contracts", async () => {
        let buyerBalance = await acg20Inst.balanceOf.call(buyer);
        let sellerBalance = await acg20Inst.balanceOf.call(collector);
        assert.equal(buyerBalance.toNumber(), userBalance[buyer], "Buyer's balance should keep unchanged");
        assert.equal(sellerBalance.toNumber(), userBalance[collector], "Seller's balance should keep unchanged");
    });
    it("Call approveAndCall() to establish the purchase", async() => {
        const artworkId = 1;
        
        await acg721Inst.approve(acg20Inst.address, artworkId, {from: collector});

        const artwork_price = Number(artwork1.prize);
        const recepients = [collector];
        const tokens = [artwork_price];

        curator_share = 1e3;
        recepients.push(curator);
        tokens.push(curator_share);
        tokens[0] -= curator_share;

        copyright_share = 1e3;
        recepients.push(artist);
        tokens.push(copyright_share);
        tokens[0] -= copyright_share;

        witness_share = 2e3;
        recepients.push(admin);
        tokens.push(witness_share);
        tokens[0] -= witness_share;

        await acg20Inst.safeTokenTrade(artwork_price, artworkId, recepients, tokens, {from: buyer});

        userBalance[collector] += tokens[0];
        userBalance[admin] += witness_share;
        userBalance[curator] += curator_share;
        userBalance[artist] += copyright_share;
        userBalance[buyer] -= artwork_price;

        let artistBalance = await acg20Inst.balanceOf.call(artist);
        let buyerBalance = await acg20Inst.balanceOf.call(buyer);
        let curatorBalance = await acg20Inst.balanceOf.call(curator);
        let sellerBalance = await acg20Inst.balanceOf.call(collector);
        let witnessBalance = await acg20Inst.balanceOf.call(admin);
        
        let ownerOfArtwork = await acg721Inst.ownerOf.call(artworkId);

        assert.equal(buyerBalance.toNumber(), userBalance[buyer], "Buyer should pay for the artwork");
        assert.equal(artistBalance.toNumber(), userBalance[artist], "Artist should receive the payment");
        assert.equal(curatorBalance.toNumber(), userBalance[curator], "Buyer should pay for the artwork");
        assert.equal(sellerBalance.toNumber(), userBalance[collector], "Artist should receive the payment");
        assert.equal(witnessBalance.toNumber(), userBalance[admin], "Buyer should pay for the artwork");

        assert.equal(ownerOfArtwork, buyer, "Artwork should be transferred to buyer");
    });
    it("Call approveAndCall() will fail if buyer's price exceeds his balance", async () => {
        let artworkId = 2;
        let artworkPrice = Number(artwork2.prize);

        await acg721Inst.approve(acg20Inst.address, artworkId, {from: collector});

        const recepients = [collector];
        const tokens = [artworkPrice];

        await expectThrow(acg20Inst.safeTokenTrade(artworkPrice, artworkId, recepients, tokens, {from: buyer}), "Expection is thrown out if price exceeds buyer's balance");
    
        let buyerBalance = await acg20Inst.balanceOf.call(buyer);
        let sellerBalance = await acg20Inst.balanceOf.call(artist);
        let ownerOfArtwork = await acg721Inst.ownerOf.call(artworkId);

        assert.equal(buyerBalance.toNumber(), userBalance[buyer], "Buyer's balance should keep unchanged");
        assert.equal(sellerBalance.toNumber(), userBalance[artist], "Seller's balance should keep unchanged");
        assert.equal(ownerOfArtwork, collector, "Owner of the artwork should keep unchanged");
    });
});