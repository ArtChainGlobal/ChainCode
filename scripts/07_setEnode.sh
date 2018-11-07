#!/bin/bash

#scp ubuntu@13.238.184.2:/home/ubuntu/tmp.13.238.184.2 ~/gopath/testsh/
#scp ubuntu@54.252.240.251:/home/ubuntu/tmp.54.252.240.251 ~/gopath/testsh/
#scp ubuntu@13.239.27.233:/home/ubuntu/tmp.13.239.27.233 ~/gopath/testsh/
#scp root@47.74.69.177:/root/tmp.47.74.69.177 ~/gopath/testsh/
#scp root@47.74.70.159:/root/tmp.47.74.70.159 ~/gopath/testsh/
#scp root@47.91.56.32:/root/tmp.47.91.56.32 ~/gopath/testsh/ 

scp ubuntu@52.65.76.142:/home/ubuntu/address.52.65.76.142 ~/gopath/testsh/
scp ubuntu@13.210.167.55:/home/ubuntu/address.13.210.167.55 ~/gopath/testsh/
scp ubuntu@13.236.44.25:/home/ubuntu/address.13.236.44.25 ~/gopath/testsh/
scp root@47.91.40.55:/root/address.47.91.40.55 ~/gopath/testsh/
scp root@47.74.70.195:/root/address.47.74.70.195 ~/gopath/testsh/
scp root@47.91.47.9:/root/address.47.91.47.9 ~/gopath/testsh/ 


v[0]=$(cat tmp.52.65.76.142)
v[1]=$(cat tmp.13.210.167.55)
v[2]=$(cat tmp.13.236.44.25)
v[3]=$(cat tmp.47.91.40.55)
v[4]=$(cat tmp.47.74.70.195)
v[5]=$(cat tmp.47.91.47.9)

# create static-nodes.json
echo  "[" >> static1.json
for ((i=0; i < 6; i++));do 
echo  "\"enode://${v[i]}:30001\"," >> static1.json
done
echo  "]" >> static1.json

#"${v[*]}"
# 反向输出文本 所以倒数第二行变为正数第二行 | 将第二行的逗号去掉
tac static1.json | sed '2s/,//'> static2.json  


# 再次反向输出后即为符合的json
tac static2.json > static-nodes.json


# 删除中间过程文件
rm static1.json static2.json


#sed $[$(wc -l < file)-2]'s/,//' static-nodes.json > fi.txt
#echo 'Gk$xZZ' > /tmp/$$ && vim -s /tmp/$$ static-nodes.json
#sed "$((`cat 1.txt|wc|awk '{print $1}'`-1))"s/', *$'// fi.txt
#gsed -n 'x;1d;$!p;${s#, *$##;p;x;p}'

