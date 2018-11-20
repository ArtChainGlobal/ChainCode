const assert = require('assert');
const acgApi = require('../api/artChainGlobalAPI.js');
const SIMPLE_TEST_ON_ENVIRONMENT = false;

describe('API basic test framework', async function () {

    let users = [];
    const user_number = 4;
    let acg20Inst;
    let acg721Inst;
    const transaction_to_be_checked = [];
    const artwork_id_list = [];
    let artist;
    let artwork_id_sold;
    let collector;
    let web3;
    const universal_password = "password";
    
    before ("Setup test environment step by step", async function () {
        // Set timeout
        //this.timeout(30000);
        console.log("Setup environment start ...");

        // ----------------------------------------------------------
        // Setup environment
        // ----------------------------------------------------------
        web3 = acgApi.prepare();
        // ----------------------------------------------------------
        // Run a simple test to ensure the contracts instances available
        // ----------------------------------------------------------
        if (SIMPLE_TEST_ON_ENVIRONMENT) {
            acgApi.simple_test_on_environment();
        }
        // ----------------------------------------------------------
        // Environment ready to use
        // ----------------------------------------------------------
        console.log("Setup environment finish ...");
        [acg20Inst, acg721Inst] = acgApi.get_contracts_instrance();
    });

    it('New feature: Only supported in new version of contract ACG20', async () => {

        const new_string = await acg20Inst.methods.stringInNewVersion().call();
        const new_method = await acg20Inst.methods.methodInNewVersion().call();

        console.log("New string in contract is: " + new_string);
        console.log("New method in contract is: " + new_method + "(return doubled total supply)");
    });

    it('New feature: Only supported in new version of contract ACG721', async () => {

        const new_string = await acg721Inst.methods.stringInNewVersion().call();
        const new_method = await acg721Inst.methods.methodInNewVersion().call();

        console.log("New string in contract is: " + new_string);
        console.log("New method in contract is: " + new_method + "(return doubled total supply)");
    });

});
