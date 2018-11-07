#!/bin/bash

rm ethnode0.log
# launch the geth in hang up
nohup geth --datadir ~/node0 --port 3000 --rpc --rpcaddr '0.0.0.0' --rpcport 8545 --rpcapi 'personal,db,eth,net,web3,txpool,miner' --gcmode archive --networkid 7777 --unlock '0' --password ~/node0/password --mine &> ethnode0.log 2>&1 &

sleep 3

# geth attach ~/node0/geth.ipc
# eth.blockNumber

