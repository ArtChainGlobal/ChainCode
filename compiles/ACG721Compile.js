// to compile solicity source code and export it as an ABI (interface) for accessing
const path = require('path');   //get cross platform
const fs = require('fs');
const solc = require('solc');

// create a path to the solidity file
const testTokenPath = path.resolve(__dirname, '..', 'contracts', 'acg721.sol');
const testLibPath = path.resolve(__dirname, '..', 'contracts', 'SafeMath.sol');
const testACG20Path = path.resolve(__dirname, '..', 'contracts', 'acg20.sol');
const input = {
    'acg721.sol': fs.readFileSync(testTokenPath, 'utf8'),
    'acg20.sol': fs.readFileSync(testTokenPath, 'utf8'),
    'SafeMath.sol': fs.readFileSync(testLibPath, 'utf8')
};

compilingResult = solc.compile({sources: input}, 1, (path) => {
    // Solc doesn't support importing from other folders
    // so resolve the missing files here
    if (path == "helpers/SafeMath.sol") {
        return {contents: fs.readFileSync('../contracts/SafeMath.sol', 'utf8') };
    } else {
        return {error: 'File not found'};
    }
});
// Output compiling error and warnings.
if (compilingResult.errors) {
    compilingResult.errors.forEach((errInfo) => {
        console.log(errInfo);
    });
}
// Check if both contracts compiled successfully
compiled_acg721 = compilingResult.contracts['acg721.sol:ACG721'];
if (!compiled_acg721) {
    console.log("Compiling contract failed, exit ...");
    return;
}

module.exports = compiled_acg721;   //name of the contract defined inside the sol file
