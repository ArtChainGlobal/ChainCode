#!/bin/bash
cd ~/gopath/testsh
rm -rf node*
rm address


for ((i=0; i < 100; i++)); do

# setup 100 pre-fund new accounts and input an interactive password '123'
cd ~/gopath/testsh/
geth --datadir ./node${i} account new << EOF
123
123
EOF

# print the addresses into addr file with prefix '0x'
cd ~/gopath/testsh/node${i}/keystore
addr=$(ls)
echo ${addr:37:40} >> ~/gopath/testsh/address


# print password into files for further convience
echo 123 > ~/gopath/testsh/node$i/password

done
