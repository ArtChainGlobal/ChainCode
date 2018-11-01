# ACG721

Contract of ACG721 token, inherited from standard ERC721 token.

The standard interface of ERC721 token could be found at [ERC-721 Token Standard](https://eips.ethereum.org/EIPS/eip-721), and will not be described here again. This document only lists the specific interfaces to support artChainGlobal system.

## Methods

### `constructor`

Constructor, sets the original `owner` of the contract to the sender account.

---

### `registerACG20Contract`

```js
function registerACG20Contract(address _contract)
```

**Parameters:**

- `_contract` - `address`: The address of ACG20 contract

Register ACG20 contract. Throws if:

- `msg.sender` is not the contract owner, or
- `_contract` is a zero address.

---

### `owner`

```js
function owner() returns (address)
```

**Returns:**

- `address`: the address of the contract owner

Returns the address of current contract owner.

---

### `listOfOwnerTokens`

```js
function listOfOwnerTokens(address _owner, uint256 _index) return (uint256)
```

**Parameters:**

- `_owner` - `address`: the address of the token owner
- `_index` - `uint`: the index of owner's token

**Returns:**

- `uint256`

Returns the token id for given owner and the index of token.

---

### `totalSupply`

```js
function totalSupply() returns (uint256)
```

**Returns:**

- `uint256`

Returns the total supply of tokens.

---

### `referencedMetadata`

```js
function referencedMetadata(uint256 _tokenId) return (string)
```

**Parameters:**

- `_tokenId` - `uint256`: token's id

**Returns:**

- `string`

Returns meta data of the token with given id.

---

### `mint`

```js
function mint(address _owner, uint256 _tokenId)
```

**Parameters:**

- `_owner` - `address`: the address of the NFT owner
- `_tokenId` - `uint256`: the id of the NFT

Create a NFT with given id. Anybody can create a token and give it to an owner. Throws if:

- `_tokenId` is already an extant NFT.

---

### `mintWithMetadata`

```js
function mintWithMetadata(address _owner, uint256 _tokenId, string _metadata)
```

**Parameters:**

- `_owner` - `address`: the address of the NFT owner
- `_tokenId` - `uint256`: the id of the NFT
- `_metadata` - `string`: the meta data of the NFT containing additional information of the NFT

Create a NFT with given id and metadata. Anybody can create a token and give it to an owner. Note only one of these functions (`Mint`, `MintWithMetadata`) should be used depending on the use case. Throws if:

- `_tokenId` is already an extant NFT

---

### `updateMetadata`

```js
function updateMetadata(uint256 _tokenId, string _metadata)
```

**Parameters:**

- `_tokenId` - `uint256`: the id of the NFT
- `_metadata` - `string`: the updated meta data of the NFT

Update the meta data of an extant NFT. Throws if:

- `msg.sender` is not the contract owner, or
- `_tokenId` is not an extant NFT.

---

### `transfer`

```js
function transfer(address _to, uint _tokenId)
```

**Parameters:**

- `_to` - `address`: the address of the new owner
- `_tokenId` - `uint256`: the id of the NFT to transfer

Assigns the ownership of the NFT with ID `_tokenId` to `_to`. Throws if:

- `msg.sender` is not the NFT owner, or
- `_to` is the zero address, or
- `_tokenId` is not an extant NFT.

---

### `receiveApproval`

```js
function receiveApproval(address _buyer, address _seller, uint256 _price, uint256 _commission, uint256 _tokenId) returns (bool)
```

**Parameters:**

- `_buyer` - `address`: the address which the ACG20 tokens are transferred from
- `_seller` - `address`: the address of NFT owner
- `_price` - `uint256`: the amount of ACG20 tokens to be transferred to `_seller`
- `_commission` - `uint256`: the amount of ACG20 tokens to be transferred to contract owner
- `_tokenId` - `uint256`: the NFT id which the ACG20 tokens are transferred for

**Returns:**

- `bool`

Called as part of method `approveAndCall()` of ACG20 contract, for a safe payment of the NFT. See `approveAndCall()` for more information. 

Throws if:

- `_tokenId` is not extant, or
- `msg.sender` is not the registered ACG20 contract address, or
- call to method `payForArtworkFrom()` of ACG20 contract failed

The method establishes:

- Step 1: transfer tokens of `_buyer` to `_seller` and the contract owner;
- Step 2: change the owner of the NFT with id `_tokenId` to `_buyer`.

## Events

Events could be considered as the 'output' of the smart contract, and are usually triggered on specific methods. These events could be collected from any node connected to the network. 

ACG721 contract supports standard ERC721 events, and following specific events as well.

### `Minted`

MUST trigger whenever new tokens are created.

```js
event Minted(address indexed _to, uint256 indexed _tokenId)
```

### `RegisterACG20Contract`

MUST trigger when a contract is registered.

```js
event RegisterACG20Contract(address indexed _contract)
```