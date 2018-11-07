#!/bin/bash


rm enode* tmp*


ip=$(cat IP.txt)


# initialize genesis.json to node
geth --datadir ~/node0 init genesis.json


# 启动console获取enode信息
geth --datadir ~/node0 --networkid 7777 --port 3000 console > tmp1 <<EOF
admin.nodeInfo.enode
EOF


# 打印输出的info信息 | 将信息由空格处替换为回车进行行化处理 | 找到enode所在行 
sed 's/ /\n/g' tmp1 | grep "enode:"  >tmp2 


# 删除ALI服务器的多余打印(第二行以后)
sed '2,$d' tmp2 > tmp3 


# 以字符串形式进行剪切(128位)| 输出至指定文件
cat tmp3 | cut -c 10-138 > enode


# 连接两者 去除newline的‘\n’
cat enode IP.txt | tr -d '\n' > tmp.${ip}


# print the info
cat tmp.${ip}


# 删除中间过程文件
rm tmp1 tmp2 tmp3 enode





