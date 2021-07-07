const Prediction = artifacts.require("Prediction");
const PRE = artifacts.require("PRE");

Prediction.synchronization_timeout = 42;
module.exports = function (deployer) {
  // deployer.deploy(Prediction)
  deployer.deploy(PRE)
};
