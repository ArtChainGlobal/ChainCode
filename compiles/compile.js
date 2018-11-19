// to compile solicity source code and export it as an ABI (interface) for accessing
const path = require('path');   //get cross platform
const fs = require('fs');
const solc = require('solc');

function compile_contract_from_source(contract_folder) {

    // create a path to the solidity file
    const CONTRACT_ACG20_PATH = path.resolve(contract_folder, 'acg20.sol');
    const CONTRACT_ACG721_PATH = path.resolve(contract_folder, 'acg721.sol');
    const LIB_SAFEMATH_PATH = path.resolve(contract_folder, 'SafeMath.sol');
    const input = {
        'acg20.sol': fs.readFileSync(CONTRACT_ACG20_PATH, 'utf8'),
        'acg721.sol': fs.readFileSync(CONTRACT_ACG721_PATH, 'utf8'),
        'SafeMath.sol': fs.readFileSync(LIB_SAFEMATH_PATH, 'utf8'),
        'Proxy.sol': fs.readFileSync(path.resolve(contract_folder, 'Proxy.sol'), 'utf8'),
        'UpgradeabilityProxy.sol': fs.readFileSync(path.resolve(contract_folder, 'UpgradeabilityProxy.sol'), 'utf8'),
        'OwnedUpgradeabilityProxy.sol': fs.readFileSync(path.resolve(contract_folder, 'OwnedUpgradeabilityProxy.sol'), 'utf8')
    };
    compilingResult = solc.compile({sources: input}, 1, (path) => {
        // Solc doesn't support importing from other folders
        // so resolve the missing files here
        if (path == "helpers/SafeMath.sol") {
            return {contents: fs.readFileSync('./helpers/SafeMath.sol', 'utf8') };
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
    compiledAcg20 = compilingResult.contracts['acg20.sol:ACG20'];
    compiledAcg721 = compilingResult.contracts['acg721.sol:ACG721'];
    compiledProxy = compilingResult.contracts['OwnedUpgradeabilityProxy.sol:OwnedUpgradeabilityProxy'];
    if (!compiledAcg20 || !compiledAcg721 || !compiledProxy) {
        console.log("Compiling contract failed, exit ...");
        return;
    }

    const acg20 = {
        abiString: compiledAcg20.interface,
        bytecode: '0x' + compiledAcg20.bytecode
    };
    const acg721 = {
        abiString: compiledAcg721.interface,
        bytecode: '0x' + compiledAcg721.bytecode
    };
    const upgradableProxy = {
        abiString: compiledProxy.interface,
        bytecode: '0x' + compiledProxy.bytecode
    };

    const acg20String = JSON.stringify(acg20);
    const acg721String = JSON.stringify(acg721);
    const proxyString = JSON.stringify(upgradableProxy);

    fs.writeFileSync("./static/ACG20.json", acg20String);
    fs.writeFileSync("./static/ACG721.json", acg721String);
    fs.writeFileSync("./static/Proxy.json", proxyString);

    return [acg20, acg721, upgradableProxy];
}

module.exports = compile_contract_from_source;