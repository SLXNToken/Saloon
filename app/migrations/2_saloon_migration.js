var Saloon = artifacts.require("./Saloon.sol");
var SLXN = artifacts.require("./SLXN.sol");

module.exports = function(deployer) {
  deployer.deploy(SLXN).then(function(i){
  	deployer.deploy(Saloon, i.address);
  });
  
};
