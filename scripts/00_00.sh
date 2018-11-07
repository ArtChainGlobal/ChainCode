#!/bin/bash


#!/bin/bash


# creat the 100 prefund accounts and collect their address on local PC
. ~/gopath/testsh/01_deploy.sh


# send the acctSvr.sh file to each sever
. ~/gopath/testsh/02_toAcctSvr.sh


# [on sever] creat the supernode accounts on each server
. ~/03_acctSvr.sh


# write the 6 supernode and 100 prefund addresses into the genesis file
. ~/gopath/testsh/04_setgen.sh


# send the console.sh and genesis.json files to each sever
. ~/gopath/testsh/05_toConSvr.sh


# [on sever] execute the console.sh
# create supernode account | get IP | get address | get enode | connect them
./06_console.sh


# automatically creat the static-nodes.json in local
. ~/gopath/testsh/07_setEnode.sh


# send the static-nodes to each sever
. ~/gopath/testsh/08_toSvr.sh


# [on sever]start the mine process in nohup way
. ~/09_nohup.sh