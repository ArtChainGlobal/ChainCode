const AcgApi = require('../api/artChainGlobalAPI.js');
const assert = require('assert');

const acgApi = AcgApi();
let web3;

const RESOURCE_MONITOR = false;
const RESOURCE_MONITOR_ADDR = "127.0.0.1";
const RESOURCE_MONITOR_PORT = 6969;

const CONCURRENT_SERVICE_MAX_NUM = 2;
const CONCURRENT_SERVICE_BREAK = 800; // ms

const MAX_USER_NUMBER = 64;
const MAX_ARTWORK_NUMBER = 0;

const TransType = {
    ADD_NEW_USER: 0,
    BUY_TOKENS: 1,
    POST_NEW_ARTWORK: 2,
    UNDEFINED: -1
}
const IntervalPolicy = {
    NO_INTERVAL: 0,
    FIXED_INTERVAL_ON_PENDING: 1,
    RANDOM_INTERVAL_ON_PENDING: 2
}

const TransManager = {
    _trans_list: [],
    _interval_policy: IntervalPolicy.NO_INTERVAL,

    set_interval_policy: function(interval_policy) {
        this._interval_policy = interval_policy;
    },

    push: async function(transaction, type, data) {
        this._trans_list.push({
            _trans: transaction,
            _type: type,
            _data: data
        });
        this._dump();
        await this._interval();
    },

    shift: function() {
        let ret = undefined;
        if (this._trans_list.length) {
            switch (arguments.length) {
                case 0:
                ret = this._trans_list.shift();
                break;
                case 1:
                for (let i=0; i<this._trans_list.length; i++) {
                    if (this._trans_list[i]._type == arguments[0]) {
                        ret = this._trans_list[i];
                        this._trans_list.splice(i, 1);
                        break;
                    }
                }
                break;
                default:
                throw "Incorrect argument number for TransManager:shift()";
            }
            if (ret) {
                this._dump();
                return [ret._trans, ret._data];
            }
        }
    },

    count: function() {
        if (0 == arguments.length) {
            return this._trans_list.length;
        } else if (1 == arguments.length) {
            return this._trans_list.filter((element) => {
                return arguments[0] == element._type;
            }).length;
        }
    },

    _interval: async function () {
        if (this._interval_policy == IntervalPolicy.NO_INTERVAL) {
            // do nothing
        } else if (this._interval_policy == IntervalPolicy.FIXED_INTERVAL_ON_PENDING) {
            if (this._trans_list.length > CONCURRENT_SERVICE_MAX_NUM) {
                await sleep(CONCURRENT_SERVICE_BREAK);
            }
        } else if (this._interval_policy == IntervalPolicy.RANDOM_INTERVAL_ON_PENDING) {
            await sleep(Math.floor(Math.random() * this._trans_list.length) * 1e3);
        }
    },

    _dump: function() {
/*        
        console.log(
            this._timeStamp() + " " +
            "Pending transactions = " + this._trans_list.length
        );
*/
    },

    _timeStamp: function() {
        const now = new Date();
        return (
            now.getHours() + ":" +
            now.getMinutes() + ":" +
            now.getSeconds() + ":" +
            now.getMilliseconds());
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe('API load test', async function () {

    const users = [];
    const users_balance = [];
    const artwork_owner_list = [];

    let acg20Inst;
    let acg721Inst;

    function create_artwork(value) {
        if (value <0 || value >1) console.error("Illegal artwork value ...");

        const type = "paint";
        const artist_list = ['Qin Wang', 'Cuong Bui Van', 'Lin Yang'];
        const artist = artist_list[Math.floor(Math.random() * artist_list.length)];
        const loyalty = 1 - value;
        const status = "normal";
        const prize = Math.floor((value*value + 0.1*Math.sin(4*3.1415926*value)) * Math.random() * 1e7);

        return {
            "type": type, 
            "artist": artist_list, 
            "loyalty":loyalty,
            "status": status,
            "prize": prize
        }
    }

    before ("Setup test environment step by step", async function () {
        if (RESOURCE_MONITOR) {
            // Tell resource monitor its process id
            const net = require('net');
            const client = new net.Socket();
            client.connect(RESOURCE_MONITOR_PORT, RESOURCE_MONITOR_ADDR, function() {
                console.log("Send process PID ", process.pid, "to resource monitor ...");
                client.write(String(process.pid));
                client.destroy();
            });
        }
        // Connect to chain and reteieve deployed contract instances
        web3 = await acgApi.prepare();
        [acg20Inst, acg721Inst] = acgApi.get_contracts_instrance();

        // Configure TransManager
        TransManager.set_interval_policy(IntervalPolicy.FIXED_INTERVAL_ON_PENDING);
    });

    it('Add a batch of users in the same time, check how many concurrent transactions could be supported on the private chain', async function () {
        this.timeout(60 * 60 * 1000); // 60 minutes
        const user_number = MAX_USER_NUMBER;

        // Add new users
        for (let i=0; i<user_number; i++) {
            await TransManager.push(
                acgApi.add_new_user("password"),
                TransType.ADD_NEW_USER
            );
        }
    });

    it('Buy tokens for users', async function () {
        this.timeout(60 * 60 * 1000); // 60 minutes
        //  Wait for results of add_new_user
        const trans_num = TransManager.count(TransType.ADD_NEW_USER);
        for(let i=0; i<trans_num; i++) {
            try {
                // Fetch a pending add_new_user and wait for the result
                [trans, data] = TransManager.shift(TransType.ADD_NEW_USER);
                const new_user = await trans;
                users.push(new_user);

                // Buy tokens for the new created user
                const token_amount = 1e8 + Math.floor(Math.random()*1e12);
                await TransManager.push(
                    acgApi.buy_token(new_user, token_amount),
                    TransType.BUY_TOKENS,
                    [new_user, token_amount]);
            } catch (err) {
                console.log("Get error when adding user ", i, ": ", err);
            }
        }
        // Make sure all transactions of adding user succeeded
        assert.equal(users.length, trans_num, "Failing to add all users");
    });
    it('Post new artworks', async function () {
        this.timeout(60 * 60 * 1000); // 60 minutes
        const artist = users[0];
        for (let i=0; i<MAX_ARTWORK_NUMBER; i++) {
            // Post new artwork
            const artwork = create_artwork(Math.random());

            // Transaction: post new artworks
            await TransManager.push(
                acgApi.post_new_artwork(artist, artwork),
                TransType.POST_NEW_ARTWORK,
                artist
            );
        }
    });
    it('Prepare for auction', async function () {
        this.timeout(60 * 60 * 1000); // 60 minutes
        // Wait for result of buy tokens
        let trans_num = TransManager.count(TransType.BUY_TOKENS);
        let confirmed_trans_num = 0;
        for (let i=0; i<trans_num; i++) {
            try {
                // Fetch a buy_token transaction and wait for result
                [trans, [user_address, token_amount]] = TransManager.shift(TransType.BUY_TOKENS);
                transaction_id = await trans;
                users_balance[user_address] = token_amount;
                confirmed_trans_num += 1;
            } catch (err) {
                console.log("Get error on " + i + "th buy_token transaction: " + err);
            }
        }
        // Make sure all transactions of buying tokens succeeded
        assert.equal(confirmed_trans_num, trans_num, "Failing to buy tokens for all users");

        // Wait for result of post new artwork
        trans_num = TransManager.count(TransType.POST_NEW_ARTWORK);
        confirmed_trans_num = 0;
        for (let i=0; i<trans_num; i++) {
            try {
                [trans, owner] = TransManager.shift(TransType.POST_NEW_ARTWORK);
                artwork_id = await trans;
                artwork_owner_list[artwork_id] = owner;
                confirmed_trans_num += 1;
            } catch (err) {
                console.log("Get error on " + i + "th post_new_artwork transaction: " + err);
            }
        }
        // Make sure all transactions of posting artwork succeeded
        assert.equal(confirmed_trans_num, trans_num, "Failing to post all artworks");
    });
    it('Sumbitted trans exceeds limit of pending/queuing per account', async function () {});
    it('Sending too many transactions with incomplete nonce; with be queued in local node, not sent to other node, and cause local node crash finally', async function() {});
});