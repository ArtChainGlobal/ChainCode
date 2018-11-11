Create private chain with geth
https://hackernoon.com/setup-your-own-private-proof-of-authority-ethereum-network-with-geth-9a0a3750cda8
//Thanks to the above link

Connect to private chain using web 3: https://ethereum.stackexchange.com/questions/28200/metamask-and-access-ethereum-private-chain-from-other-pc-in-the-same-network-fo?rq=1

BigNumber Library: https://github.com/MikeMcl/bignumber.js/

//Node js version if want to change
    curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
    sudo apt-get install -y nodejs

course: https://github.com/acloudfan/Blockchain-Course-Patterns


//network id: 0501, also known as chainID
1. Create node0, node1, node2, and so on
2. create account: geth --datadir node0/ account new
    //this will create a keystone folder that contains accounts. 
    //can check be going all the way to the end of the file to see the account
    //if you cannot see the accounts at the end of the file, you need to do it again.
    accounts:
        aae269dc6d6b137fe506104cd08e48e6cb6e282b
        0bf6ba570ba2cf60359c8e4115150be5c8f91c17
        ba9ef61841cdb838f6145b2e202576db001447bb
            

3. Create genesis.json file by using puppeth
    $puppeth
    //then following all the option
    //network name: art_chain
    //network id: 0501



5. Using bootnode
    - Step 1: Create a folder bootNode
    - Step 2: Setup the bootnode
        bootnode -genkey boot.key
    - Step 3: to launch bootnode using genkey:
        bootnode -nodekey boot.key -verbosity 9 -addr "127.0.0.0:30001"
        //port: 30303 //used for public ethereum network
    - Step 4: get the enode address from step 3, then, place that enode into static-node.json
    - step 5: lauch new nodes with option --bootnodes value = static-node.jason

7. initialize the nodes
    //to create a very first block, we need to run init command
    //the init command will generate a new data folder call "geth" in the node
    geth --datadir node0 init genesis.json

    geth --datadir node0 --port 30000 --nodiscover --unlock '0' --password ./node0/password.txt --rpc --rpcport 8000 --rpcaddr 127.0.0.1 --rpccorsdomain "*" --rpcapi "eth,net,web3,personal,miner" --mine console

    //the rpcaddr, rpcport 8543 will be used to connect to the chain network
    
    geth --datadir node1 init genesis.json
    geth --datadir node1 --port 30001 --nodiscover --unlock '0' --password ./node0/password.txt --rpc --rpcport 8001 --rpcaddr 127.0.0.1 --rpccorsdomain "*" --rpcapi "eth,net,web3,personal,miner" console
    

    geth --datadir node2 init genesis.json
    geth --datadir node2 --port 30002 --nodiscover --unlock '0' --password ./node0/password.txt --rpc --rpcport 8002 --rpcaddr 127.0.0.1 --rpccorsdomain "*" --rpcapi "eth,net,web3,personal,miner" console

    geth --datadir node4 init genesis.json
    geth --datadir node4 --port 30004 --nodiscover --unlock '0' --password ./node0/password.txt --rpc --rpcport 8004 --rpcaddr 127.0.0.1 --rpccorsdomain "*" --rpcapi "eth,net,web3,personal,miner" console
    
    geth --datadir node4 --port 30004 --nodiscover --unlock '0' --password ./node4/password.txt console

    geth --datadir node1/ --syncmode 'full' --port 30001 --rpc --rpcaddr 'localhost' --rpcport 8502 --rpcapi 'personal,db,eth,net,web3,txpool,miner' --bootnodes 'enode://5bf9e12077145338951297f854a1beba37048e86ab90011600e16c646d2d7f2da623160a55026bc6c6d1c8dd603322ae4be2c0de42d33c70730c65839951fb0@[::]:30001?discport=0' --networkid 1515 --gasprice '0' --unlock '0x08a58f09194e403d02a1928a7bf78646cfc260b0' --password node2/password.txt --mine


       
    - create static-node.json
        //to create this json file, you need information from running a node by following
            >geth --datadir node4 --port 30004 --nodiscover --unlock '0' --password ./node4/password.txt console
            //the, look at something like following for the data:
            INFO [10-29|07:27:24.469] RLPx listener up                         self="enode://5c02b1c85d3822249bafc537096671e8b33f1a04bb3a0da01204bf0b9c42c8431abfb3c0291b7b4e5dedc24cb1f2aaa95599020e14d263988734dfb192106e84@127.0.0.1:30000?discport=0"


        //purpose: to have static nodes which will automatically add peers from one node to another.
    [
        "enode://97d285369fbbff4896e4e64ebcc268bafa1de95012fe19c13e9ba4030a4bd1d957a1f110cdcae8516352d605c404b0ef3f58f2b4d6f2a29545d58c1b674b6d5a@127.0.0.1:30000?discport=0",
        "enode://6cf78e96a8253d8cb47ccb26bda49f6dcf8fe1e5b2149d90adc3c996b7c939894b1bf2238af5867f5b3f03fbe89e454f084b6a69970971eb5978bca571833e0f@127.0.0.1:30001?discport=0",
        "enode://bc502d387ad809f128493c3ad19130646202ffb472394572c93b6b89566501c80ad4f425ad033492347053ed88b171a536377e05b3a8856dea4a3a5f7c336ca1@127.0.0.1:30002?discport=0",
        "enode://fbebbd3cb5313ad7f01eab8a188bab03eb718f3d91d59f196fdfc65acf95ab4e70e6bef01436ce30fb30758cc44865289da3e89dfd067417f9693d014a2bfc15@127.0.0.1:30004?discport=0"
    ]

    // run on cloud
    - AWS:
        geth --datadir "./signer1/data" --networkid 55661 --port 2000 --rpc --rpcport 5566 --rpcaddr "ec2-13-114-49-66.ap-northeast-1.compute.amazonaws.com" --rpcapi "eth,personal,web3,net,db" --mine

    - remote:
        https://ethereum.stackexchange.com/questions/12436/how-to-communicate-with-a-remote-node
        ssh -i <your private SSL key filepath> user@remote_ip "geth attach ipc:///<path to datadir>/geth.ipc"
        ssh root@47.91.56.32 "geth attach http://127.0.0.1:8000"

8. Bring the block chain network live
    geth --port 30000 --networkid 0501 --datadir=./blkchain --maxpeers=0  --rpc --rpcport 8543 --rpcaddr 127.0.0.1 --rpccorsdomain "*" --rpcapi "eth,net,web3,personal,miner"

8. Interact with private chain
    net
    eth.accounts    //return the account

9. Create new account:
    personal.newAccount('myAccount')

10. Attach to the private network using GETH
    geth attach http://127.0.0.1:8000   //node 0
    geth attach http://127.0.0.1:8001   //node 1
    geth attach http://127.0.0.1:8002   //node 2
    geth attach http://127.0.0.1:8004   //node 4

    ssh root@47.91.56.32 "geth attach http://127.0.0.1:8000"

11. Install truffle:
    npm install -g truffle
12. Install Sol
    npm install -g solc
12. Compile the solidity binary code
    - create a js file: compile.js which contain following codes
        // to compile solicity source code and export it as an ABI (interface) for accessing
        const path = require('path');   //get cross platform
        const fs = require('fs');
        const solc = require('solc');

        // create a path to the solidity file
        const testTokenPath = path.resolve(__dirname, 'contracts', 'ArtChainToken.sol');
        const source = fs.readFileSync(testTokenPath, 'utf8');

        // compile the solidity source code
        // console.log(solc.compile(source, 1).contracts[':Inbox']);
        module.exports = solc.compile(source, 1).contracts[':ArtChainToken'];


13. Deploy contract - on private network
    - Create js file: deploy.js which contains following information
            const HDWalletProvider = require('truffle-hdwallet-provider');
            const Web3 = require('web3');
            const { interface, bytecode } = require('./compile');

            const provider = new HDWalletProvider(
                // two arguements, account Mnemonic, and url - infura link
                // the following is the text used to create public and private key
                'another tray rapid bird wise firm renew private always write shrug inject',
                'https://rinkeby.infura.io/v3/66724f5b8e9c465d8625383690f03cac'
            );

            const web3 = new Web3(provider);

            //async await action
            const deploy = async () => {
                const accounts = await web3.eth.getAccounts();
                // get a list of account, then deploy the account
                console.log('attempt to deploy from accounts', accounts[0]);

                const result = await new web3.eth.Contract(JSON.parse(interface))
                    .deploy({ 
                        data: '0x' + bytecode,      //keep in mind to put '0x' as prefix of the bytecode
                        // arguments: ['initial-message-1'],
                    })
                    .send({
                        from: accounts[0],
                        gas: '2000000',
                    })
                console.log('contract deployed to ', result.options.address);
                console.log(interface);
            }

            deploy();

14. Generate ssh rsa key
    - ssh-copy-id

15. Web3 with httpprovider
    https://github.com/ethereum/wiki/wiki/JavaScript-API#example-using-http-basic-authentication
    var Web3 = require('web3');
    var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545", 0, BasicAuthUsername, BasicAuthPassword));
    //Note: HttpProvider takes 4 arguments (host, timeout, user, password)

    enode://4bdd1b2bfe07c05f221cb5b652d5e1992c4bba876add2a93a6aa719177e30fdb9f47bacbcf208b4414b9c32afb8258707c0dff390921d80751a20174422fec30@127.0.0.1:30002

16. Run the test
    - Create new folder "test"
    - Create new js test file, ArtChainToken.js, for example
        const assert = require('assert');
        const ganache = require('ganache-cli');
        const Web3 = require('web3');
        var provider = new Web3.providers.HttpProvider('http://127.0.0.1:8000')
        const web3 = new Web3(provider);

        const { interface, bytecode } = require('../compile');

        let ercToken;
        let accounts;

        /**
        * it('passes after 3000ms', function (done) {
        setTimeout(done, 3000)
        })
        */
        beforeEach(async () => {
            
            accounts = await web3.eth.getAccounts();
            ercToken = await new web3.eth.Contract(JSON.parse(interface))
            .deploy({
                data: "0x" + bytecode,
            })
            .send({
                from: accounts[0],
                gas: '2000000'
            });
        })

        describe('ERC token smart contract', () => {

            it('deplys a ERC Token contract', async () => {
                
                console.log("testing the adress of deployment", ercToken.options.address);        
                assert.ok(ercToken.options.address);
                // this.timeout(15000);
                // setTimeout(done, 10000);
            });
        })

17. Auction
    https://programtheblockchain.com/posts/2018/03/20/writing-a-token-auction-contract/

    https://medium.com/@bryn.bellomy/solidity-tutorial-building-a-simple-auction-contract-fcc918b0878a

        https://github.com/brynbellomy/solidity-auction

18. AGC721 Token contract
    https://eips.ethereum.org/EIPS/eip-721
    https://github.com/nastassiasachs/ERC721ExampleDeed
    
    
19. Memory (storage):
    - from EVM
    - calldata:
        + temporary
        + EVM execution
        + non-modifiable
        + max size: 1024, Word 256 bits
        + use for managing the function call()
    
    - memory:
        + temporary
        + Arrays & structs
        + addressable at bute level
        + use for contract execution, therefore, data will be lost after the execution
        + function(args): with return value (value will be store on memory)
            - if you want to force using storage:
                function forceStorage (uint[] storage args) internal returns (uint[] storage dat) {

                }
        + example:
            contract arrayVariable {
                function localVariable() {
                    uint memmory memoryArray;
                }
            }
    - storage:
        + persistent,
        + it is database
        + read and write are costly
        + store as "key-value" pair (256 bits)
        + state variable will use storage by default
        + local variable will use sotrage by default
        + example:
            contract stateVariable {
                int count;
                uint[] allMember;
            }
20. Exception
    - using revert() to revert all previous step up to the call
    - require(condition);
        -> will use revert() style exception -> no gas used if exception throwed
        - example:
            asert(num < 10>;)
            for (uint8 i =0; i < numArray.length; i++) {
                if (numArray[i] == num) {
                    winnerCount++;
                    require(winnerCount > 0);
                    return true
                }
            } 

    - assert(condition);
        -> use for testing to detect bugs
        - example
        int someVariable = 100;
        function someFunction(int num) public {
            someVariable = someVariable - num;
            //test to make sure someVariable > 0
            assert(someVariable > 0);
        }
21. Cryptographic function
    - message -> hash algorithm -> hash_value or digest
    - keccak256()
    - sha3()
    - sha256()
    - example:
        str = "some string";
        bytes32 hashValue1 = keccak256(str);
        bytes32 hashValue2 = sha3(str);
        bytes32 hashvalue3 = sha256(str);

22. Mapping:
    - work like hash table with value and key
    - key - value pair
    - only for state variable (storage)
    - hash is stored instead of key
    - by default, not iterable
    - no concept of length
    - example:
        contract mappingContract
        //state variable mapping
        mapping(string => string) capitals;
        function addCapital(string country, string newCapital) {
            capitals[country] = capital;
        }
        function getCapital(string country) return (string) {
            return capitals[country];
        }
        function removeCapital(string country) {
            delete(capitals[country]);
        }
23. constant variable
    - initialize at compile time
    - no storage allocated by compiler
    - allow for value and string type only
23. Fallback function
    - only one fallback function for each contract
    - no arguments
    - cannot return anything
    - Maximum gas: 2300 gas
23. Modifier function
    - use as require to execute another function
    - exmaple:
        modifier ownerOnly {
            if (onwner == msg.sender) {
                _;
                return;
            } else {
                throw;
            }
        }
23. Event
    - if the event imit, then, the data relating the the event will be logged.
    - if the App is watching for the event, then the app will receive the event
    - events:
        + are part of the abi definition
        + event argumants are stored in the logs file
        + Logs can be read using topic filters:
            - only indexed can be used as a condition for filter
            - maximum 3 indexed arguments allowed
    - need to be declare on the contract before it is being emitted or called.
        + example of declare an event
            event NewHighBid(address indexed who, string name, uint howmuch);
            event BidFailed(address indexed who, string name, uint howmuch);
    - invoke:
        - like a function
        - example:
            function bid(string name) payable timed {
                if (msg.value > (highBidder.bid + 10)) {
                    //receive new high bid
                    //then emit the event
                    NewHighBid(msg.sender, name, msg.value);
                } else {
                    BidFailed(msg.sender, name, msg.value);
                }
            }
23. Self desstruct
    - why:
        + timed contracts: lottery, auction, loan contract and so on.
    - pattern of the contract
        fucntion killContract() ownerOnly {
            suicide(owner);
        }
    - if you send fund to destroyed contract, it will be lost
        + prevention:
            - remove all references to dead contracts
            - call get before send 
23. contract factory pattern
    - use to create a number of instance of the contract
    - the factory contract will manage these constance as collectio of contracts
    - external persistent storage not needed
    - gas used owuld be higher
    - example: 
        - banking using blockchain
            + account contracts would be:
                - savingAccount 
                    + standard
                - SilverAccount
                    + balance > 1,000$
                    + interest reate = 1%
                - GoldAccount
                    + balance > 10,000$
                    + interest reate: 2%
                - PlatinumAccount
                    + balance > 100,000$
                    + interest reate: 3%
        - the bank will manage accounts as collection of accounts contracts
        - Name register:
            + to easily manage name of the contract, instead of the address of the contract
            + benefit: the Dapp will need to make changes when there is new deployment of one of the contracts
            + example:
                nameRegistry.registerName("contractA_inFactoryContract", A_Address, 1)
                nameRegistry.registerName("contractB_inFactoryContract", B_Address, 1)
            + to get the address:
                getContractInfo("contractA_inFactoryContract");
            + contract:
                contract NameRegistry {
                    struct CONTRACT_INFO {
                        address owner;
                        address contractInstance;
                        uint16 version;
                    }
                    //mapping name and address
                    mapping(bytes32 => CONTRACT_INFO) nameInfo;
                }
23. mapping iterator:
    - no key to iterate 
    - need an array to manage the key: address[] key_addresses;

23. WithdrawalPattern
    - send pattern
    - withdrawalPattern
    - send ether: the function must be payable
    - send and tranfer:
        + can fail: run out of gas, exception and so on
    - send():
        - very risky since when it fail, it does not halt the execution of the function
    - transer():
        throws exception on failure, also halt the execution of the function
    - this pattern is used to fix the error when one send multiple ether to a number of reciver.
24. Empty string and zero
    - 0x0 or 0

25. Truffle
    - download a box call metacoin to practice
        truffle unbox metacoin
    - Run the test:
        + step 1: run ganache
        + step 2: provide configuration for the client (ganache)
            - filename: truffle.js
                // See <http://truffleframework.com/docs/advanced/configuration>
                // to customize your Truffle configuration!
                module.exports = {
                networks: {
                    development: {
                    host: "127.0.0.1",
                    port: 8000,
                    network_id: "*" // Match any network id
                    //you can specify account:
                    from: 'ACOUNT_ADDRESS'
                    }
                }
                };
        + step 3: execute truffle migrate
            >truffle migrate
        + step 4: execute truffle test
            >truffle test
    - Create new contract and test
        + to create a new empty contract
            >truffle create contract YOURCONTRACTNAME
            
        + compile
            >truffle compile
            or :
            >truffle compile CONTRACT_NAME
        + deployment:
            - step 1: add the file to migration to /2_deploy_contract.js
                - example of the file:
                    //#1: get an instance of the contract to be deployed
                    var Calculator = artifacts.require('./Calculator.sol');
                    // keep in mind that the relative path above does not include the folder "contracts"

                    module.exports = (deployer) => {
                        deployer.deploy(Calculator);
                    };
            - step 2: deploy contract to Ethereum Client (Ganache)
                >truffle migrate
        + Testing:
            - Quickly create a test file for a contract CONTRACT_NAME
                >truffle create test CONTRACT_NAME
            - Edit the testing file as you want
            - Run the test uing truffle
                >truffle test path-to-the-test-file
            - example of the test file
                var Calculator = artifacts.require('./Calculator.sol');
                contract('Calculator', function(accounts) {
                // it("should assert true", async () => {
                //   var calculator = await Calculator.deployed();
                //   console.log("instance of calculator", calculator);
                //   assert.isTrue(true);
                // });
                // it('it should give the initial value = 10', async () => {
                //   var calculator = await Calculator.deployed();
                //   var initialNumber = await calculator.getResult.call();
                //   console.log("initial number is: ", initialNumber);
                //   assert.equal(10, initialNumber);
                // });
                it('it should add new number', async () => {
                    var calculator = await Calculator.deployed();
                    const newNumber = 20;
                    var result = await calculator.addNumber.call(newNumber);
                    console.log("result is: ", result);
                    assert.equal(10 + 20, result);
                });
                });
26. Web3
    - object:
        + eth,
        + net,
        + personal,
        + db,
        + ssh,
27. Compile solidity files
    const path = require('path');
    const fs = require('fs');
    const solc = require('solc');

    const MyToken= path.resolve(__dirname, 'contracts', 'MyToken.sol');
    const StandardToken = path.resolve(__dirname, 'contracts', 'StandardToken.sol');
    const StandardBurnableToken = path.resolve(__dirname, 'contracts', 'StandardBurnableToken.sol');
    const SafeMath = path.resolve(__dirname, 'contracts', 'SafeMath.sol');
    const ERC20Basic = path.resolve(__dirname, 'contracts', 'ERC20Basic.sol');
    const ERC20 = path.resolve(__dirname, 'contracts', 'ERC20.sol');
    const BurnableToken = path.resolve(__dirname, 'contracts', 'BurnableToken.sol');
    const BasicToken = path.resolve(__dirname, 'contracts', 'BasicToken.sol');

    var input = {
    'MyToken.sol': fs.readFileSync(MyToken, 'utf8'),
    'StandardToken.sol': fs.readFileSync(StandardToken, 'utf8'),
    'StandardBurnableToken.sol': fs.readFileSync(StandardBurnableToken, 'utf8'),
    'SafeMath.sol': fs.readFileSync(SafeMath, 'utf8'),
    'ERC20Basic.sol': fs.readFileSync(ERC20Basic, 'utf8'),
    'ERC20.sol': fs.readFileSync(ERC20, 'utf8'),
    'BurnableToken.sol': fs.readFileSync(BurnableToken, 'utf8'),
    'BasicToken.sol': fs.readFileSync(BasicToken, 'utf8'),
    };

    console.log(solc.compile({sources: input}, 1));

27. Contract Interface:
    - link: https://solidity.readthedocs.io/en/v0.2.2/contracts.html#abstract-contracts
    - use as abstract contract without compiling or implementing
    - example of using

        // These abstract contracts are only provided to make the
        // interface known to the compiler. Note the function
        // without body. If a contract does not implement all
        // functions it can only be used as an interface.
        contract Config {
            function lookup(uint id) returns (address adr);
        }
        contract NameReg {
            function register(bytes32 name);
            function unregister();
        }

        // Multiple inheritance is possible. Note that "owned" is
        // also a base class of "mortal", yet there is only a single
        // instance of "owned" (as for virtual inheritance in C++).
        contract named is owned, mortal {
            function named(bytes32 name) {
                Config config = Config(0xd5f9d8d94886e70b06e474c3fb14fd43e2f23970);
                NameReg(config.lookup(1)).register(name);
            }

            // Functions can be overridden, both local and
            // message-based function calls take these overrides
            // into account.
            function kill() {
                if (msg.sender == owner) {
                    Config config = Config(0xd5f9d8d94886e70b06e474c3fb14fd43e2f23970);
                    NameReg(config.lookup(1)).unregister();
                    // It is still possible to call a specific
                    // overridden function.
                    mortal.kill();
                }
            }
        }




Appendixes:
    - Get gaslimit
        eth.getBlock("latest").gasLimit
    - get transaction ID or transaction hash
        result.transactionHash
