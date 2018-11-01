const AcgApi = require('../api/artChainGlobalAPI.js');

const acgApi = AcgApi();
let web3;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function prepare () {

    web3 = await acgApi.prepare();

    // ----------------------------------------------------------
    // Simple test
    // ----------------------------------------------------------
    await acgApi.simple_test_on_environment();
}

async function monitor_events () {
    // Get contract instances
    [contract20, contract721] = acgApi.get_contracts_instrance();

    contract20.events.allEvents({ fromBlock: 'latest' }, console.log);
    contract721.events.allEvents({ fromBlock: 'latest' }, console.log);
}

async function retrieve_past_events() {
    // Get contract instances
    [contract20, contract721] = acgApi.get_contracts_instrance();
    const events_array = await contract20.getPastEvents('allEvents', {
        fromBlock: 0,
        toBlock: 'latest'
    });
    return events_array;
}

function teardown() {
    web3.currentProvider.connection.close();
}

prepare().then( async () => {
    console.log("Start work from here ....");

    //const events_array = await retrieve_past_events();
    //console.log("Retrieve ", events_array.length, " events");
    //events_array.forEach((event) => { console.log(event) });

    monitor_events();
});
