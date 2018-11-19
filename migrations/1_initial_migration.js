var Migrations = artifacts.require("./Migrations.sol");
//var ArtChainToken = artifacts.require("ArtChainToken");
var ACG20TOKEN = artifacts.require("ACG20");
var ACG721TOKEN = artifacts.require("ACG721");
var ACG20PROXY = artifacts.require("OwnedUpgradeabilityProxy");
var ACG721PROXY = artifacts.require("OwnedUpgradeabilityProxy");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
//  deployer.deploy(ArtChainToken);
  deployer.deploy(ACG20TOKEN).then(function() {
    return deployer.deploy(ACG20PROXY, ACG20TOKEN.address);
  });

  deployer.deploy(ACG721TOKEN).then(function() {
    return deployer.deploy(ACG721PROXY, ACG721TOKEN.address)
  });
};
