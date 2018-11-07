#!/bin/bash

rm address* nohup.sh genesis.json enode* ethnode0.log IP.txt 06_console.sh 09_nohup.sh tmp*
rm IP.txt address* 
rm -rf node0

# 获取服务器公网IP，用作后续文件变量名
curl ifconfig.me &> IP.txt
# 删除IP.txt的1-3行,留存纯IP 
sed -i '1,3d' IP.txt


# creat supernode account
geth --datadir node0 --port 3000 account new << EOF
123
123
EOF


# print password into files for further convience
echo 123 > ~/node0/password


# print created address into the files for further convience
cd ~/node0/keystore
addr=$(ls)
cd ~
ip=$(cat IP.txt)
echo ${addr:37:40} > ~/address.${ip}