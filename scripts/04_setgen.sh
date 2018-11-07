#!/bin/bash

#scp ubuntu@13.238.184.2:/home/ubuntu/address.13.238.184.2 ~/gopath/testsh/
#scp ubuntu@54.252.240.251:/home/ubuntu/address.54.252.240.251 ~/gopath/testsh/
#scp ubuntu@13.239.27.233:/home/ubuntu/address.13.239.27.233 ~/gopath/testsh/
#scp root@47.74.69.177:/root/address.47.74.69.177 ~/gopath/testsh/
#scp root@47.74.70.159:/root/address.47.74.70.159 ~/gopath/testsh/
#scp root@47.91.56.32:/root/address.47.91.56.32 ~/gopath/testsh/ 

#ip[0]=47.74.69.177
#ip[1]=47.74.70.159
#ip[2]=47.91.56.32
#ip[3]=13.238.184.2
#ip[4]=54.252.240.251
#ip[5]=13.239.27.233


scp ubuntu@52.65.76.142:/home/ubuntu/address.52.65.76.142 ~/gopath/testsh/
scp ubuntu@13.210.167.55:/home/ubuntu/address.13.210.167.55 ~/gopath/testsh/
scp ubuntu@13.236.44.25:/home/ubuntu/address.13.236.44.25 ~/gopath/testsh/
scp root@47.91.40.55:/root/address.47.91.40.55 ~/gopath/testsh/
scp root@47.74.70.195:/root/address.47.74.70.195 ~/gopath/testsh/
scp root@47.91.47.9:/root/address.47.91.47.9 ~/gopath/testsh/ 

ip[0]=47.91.40.55
ip[1]=47.74.70.195
ip[2]=47.91.47.9
ip[3]=52.65.76.142
ip[4]=13.210.167.55
ip[5]=13.236.44.25


cd ~/gopath/testsh


# write the 6 supernode addresses into the array[]
for ((i=0; i < 6; i++)); do
v[$i]=$(cat address.${ip[i]})
done


# write the 100 prefund addresses into the array[]
x=$(cat address)
echo $x

for ((i=0; i < 100; i++)); do
z=0+${i}*41
y[$i]=${x:$z:${z+40}}
echo ${y[$i]}
done


# create genesis.json with inputs like follow
puppeth --network testnet << EOF
2
3
2
2
5
${v[0]}
${v[1]}
${v[2]}
${v[3]}
${v[4]}
${v[5]}

${v[0]}
${v[1]}
${v[2]}
${v[3]}
${v[4]}
${v[5]}
${y[0]}
${y[1]}
${y[2]}
${y[3]}
${y[4]}
${y[5]}
${y[6]}
${y[7]}
${y[8]}
${y[9]}
${y[10]}
${y[11]}
${y[12]}
${y[13]}
${y[14]}
${y[15]}
${y[16]}
${y[17]}
${y[18]}
${y[19]}
${y[20]}
${y[21]}
${y[22]}
${y[23]}
${y[24]}
${y[25]}
${y[26]}
${y[27]}
${y[28]}
${y[20]}
${y[30]}
${y[31]}
${y[32]}
${y[33]}
${y[34]}
${y[35]}
${y[36]}
${y[37]}
${y[38]}
${y[39]}
${y[40]}
${y[40]}
${y[41]}
${y[42]}
${y[43]}
${y[44]}
${y[45]}
${y[46]}
${y[47]}
${y[48]}
${y[49]}
${y[50]}
${y[51]}
${y[52]}
${y[53]}
${y[54]}
${y[55]}
${y[56]}
${y[57]}
${y[58]}
${y[59]}
${y[60]}
${y[61]}
${y[62]}
${y[63]}
${y[64]}
${y[65]}
${y[66]}
${y[67]}
${y[68]}
${y[69]}
${y[70]}
${y[71]}
${y[72]}
${y[73]}
${y[74]}
${y[75]}
${y[76]}
${y[77]}
${y[78]}
${y[79]}
${y[80]}
${y[81]}
${y[82]}
${y[83]}
${y[84]}
${y[85]}
${y[86]}
${y[87]}
${y[88]}
${y[89]}
${y[90]}
${y[91]}
${y[92]}
${y[93]}
${y[94]}
${y[95]}
${y[96]}
${y[97]}
${y[98]}
${y[99]}

7777
2
2
genesis.json

EOF


