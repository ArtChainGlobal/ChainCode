#!/bin/bash

# set IP array
#aliIP[0]=root@47.74.69.177
#aliIP[1]=root@47.74.70.159
#aliIP[2]=root@47.91.56.32
#awsIP[0]=ubuntu@13.238.184.2
#awsIP[1]=ubuntu@54.252.240.251
#awsIP[2]=ubuntu@13.239.27.233

# set IP array updated 
aliIP[0]=root@47.91.40.55
aliIP[1]=root@47.74.70.195
aliIP[2]=root@47.91.47.9
awsIP[0]=ubuntu@52.65.76.142
awsIP[1]=ubuntu@13.210.167.55
awsIP[2]=ubuntu@13.236.44.25

# send to Ali
for i in "${aliIP[@]}"; do
scp ~/gopath/testsh/06_console.sh genesis.json $i:/root/
done

# send to AWS
for i in "${awsIP[@]}"; do
scp ~/gopath/testsh/06_console.sh genesis.json $i:/home/ubuntu/
done
