# ACG20

Contract of ACG20 token, inherited from standard ERC20 token.

The standard interface of ERC20 token could be found at [ERC-20 Token Standard](https://eips.ethereum.org/EIPS/eip-20), and will not be described here again. This document only lists the specific interfaces to support artChainGlobal system.

## Methods

### `constructor`

sets the original `owner` of the contract to the sender account.

---

### `owner`

```js
function owner() returns (address)
```

**Returns:**

- `address`: the address of the contract owner

Returns the address of current contract owner.

---

### `highestBidder`

```js
function highestBidder(uint256 _artworkId) returns (address)
```

**Parameters:**

- `_artworkId` - `uint256`: the NFT id in the auction

**Returns:**

- `address`: address of the account which is holding a valid bid for NFT `_artworkId`

Returns address of the account which is holding a valid bid for NFT `_artworkId`.

---

### `highestBid`

```js
function highestBid(uint256 _artworkId) returns (uint256)
```

**Parameters:**

- `_artworkId` - `uint256`: the NFT id in the auction

**Returns:**

- `uint256`: current bid for NFT `_artworkId`

Returns current bid for NFT `_artworkId`.

---

### `registerACG721Contract`

```js
function registerACG721Contract(address _contract)`
```

**Parameters:**

- `_contract` - `address`: address of the deployed ACG721 contract

Register the address of contract ACG721. This method should be called once the contract is deployed.

---

### `transferOwnership`

```js
function transferOwnership(address newOwner)
```

**Parameters:**

- `newOwner` - `address`: The address to transfer ownership to.

Allows the current contract owner to transfer control of the contract to a new Owner.

---

### `mint`

```js
function mint(address _to, uint256 _amount)
```

**Parameters:**

- `_to` - `address`: The address which you want to increase the balance
- `_amount` - `uint256`: the amount of tokens to be increased

Allows the user's balance as well as the total supply to be increated. Only contract owner is capable to call this method.

---

### `burn`

```js
function burn(uint256 _amount)
```

**Parameters:**

- `_amount` - `uint256`: the amount of tokens to be destroyed

Destroy user's tokens with given amount, and decrease the total supply as well. Anyone can burn tokens from his own account. Throws if amount to be destroyed exceeds account's balance.

---

### `burnFrom`

```js
function burnFrom(address _from, uint256 _amount)
```

**Parameters:**

- `_from` - `address`: the address from which you want to destroy tokens
- `_amount` - `uint256`: the amount of tokens to be destroyed

Destroy delegated user's tokens with given amount, and decrease the total supply as well. Throws if:

- amount to be destroyed exceeds account's balance, or
- amount to be destroyed exceeds allowed amount to the spender

---

### `freeze`

```js
function freeze(address _from, uint256 _amount, uint256 _artworkId)
```

**Parameters:**

- `_from` - `address`: address from which to freeze tokens
- `_amount` - `uint256`: the amount of tokens to be frozen
- `_artworkId` - `uint256`: the NFT id for which the tokens are frozen, also used as key value of the map storing the frozen tokens

Freeze given amount of tokens from an account on purpose of auction. When a user proposes a valid bid during the acution period, tokens regarding to the bid will be moved out of his account, and so decrease the account's balance. The frozen tokens would be stored in a map with the key value of `_artworkId`.

Throws if:
- `msg.sender` is not the contract owner, or
- amount to be frozen is lower than previously frozen amount, that means current bid is even lower than previous one, or
- the account's balance is lower than the amount to be frozen

---

### `unfreeze`

```js
function unfreeze(uint256 _artworkId)
```

**Parameters:**

- `_artworkId` - `uint256`: NFT id for which the frozen tokens are withdrawn

Withdraw the frozen tokens for NFT `_artworkId` back to the account who is holding the valid bid for `_artworkId`. This methods could be called if:
- a higher bid is proposed for given NFT id, then the frozen tokens of previous bid owner would be unfrozen before freezing the tokens from new bidder's account, or
- called explicited to cancel the auction for the specific NFT

Throws if `msg.sender` is not the contract owner.

---

### `payForArtwork`

```js
function payForArtwork(address _to, uint256 _value, uint256 _artworkId) returns (bool)
```

**Parameters:**

- `_to` - `address`: The address to which the tokens are transfer
- `_value` - `uint256`: The amount of tokens to be transferred
- `_artworkId` - `uint256`: The NFT id for which the tokens are transferred

**Returns:**

- `bool`

Transfer tokens to another acccount to establish the purchase of specific NFT. Supports both normal sales and auctions. Also triggers the previously frozen tokens for `_artworkId` to be withdrawn firstly. The method is less likely to be used in consideration of security, without guarantee that account `_to` will successfully transfer NFT to `msg.sender`. Instead, `payForArtworkFrom()` is preferred as part of a safe transaction procedure. See `approveAndCall()` for more info.

Throws if currently recorded bid for `_artworkId` mismatchs (`_value`)

---

### `payForArtworkFrom`

```js
function payForArtworkFrom(address _from, address _to, uint256 _price, uint256 _commission, uint256 _artworkId) returns (bool)
```

**Parameters:**

- `_from` - `address`: The address which the tokens are transferred from
- `_to` - `address`: The address which the tokens are transferred to
- `_price` - `uint256`: the amount of tokens to be transferred
- `_commission` - `uint256`: the amount of tokens to be transferred to contract owner as commission
- `_artworkId` - `uint256`: The NFT id for which the tokens are transferred

**Returns:**

- `bool`

Transfer delegated user's tokens to establish the purchase of NFT `_artworkId`. Supports both normal sales and auctions. Also triggers the tokens previously frozen tokens for `_artworkId` to be wighdrawn firstly, which is supposed to happen at the end of an auction. This method, as part of `approveAndCall()` procedure, is preferred than `payForArtwork()` in consideration of security. See `approveAndCall()` for more info.

Throws if currently recorded bid for `_artworkId` mismatchs (`_commission`+`_price`).

---

### `approveAndCall`

```js
function approveAndCall(address _seller, uint256 _price, uint256 _commission, uint256 _artworkId)
```

**Parameters:**

- `_seller` - `address`: address which the tokens are transferred to
- `_price` - `uint256`: the amount of tokens transerred to _seller address
- `_commission` - `uint256`: the amount of tokens transferred to contract owner as commission
- `_artworkId` - `uint256`: the NFT id which the tokens are transferred for

Establish a safe payment for a NFT with tokens, inspired by [Ethereum smart service payment with tokens](https://medium.com/@jgm.orinoco/ethereum-smart-service-payment-with-tokens-60894a79f75c). 

Guarantees:

- token owner transfers tokens to NFT owner, and
- NFT owner transfer NFT to token owner.

Throws if:
- A NFT contract has not been registered yet, or
- call to `approve()` failed, or
- call to `receiveApproval()` of the registered NFT contract failed.

The method introduces both this and the NFT contract accounts in the transaction as the intermediator, and establishes:

- Step 1: `msg.sender` approves amount (`_price`+`_commission`) of his token to be transferred by the registered NFT contract;
- Step 2: `msg.sender` calls method `receiveApproval()` of the registered NFT contract;
- Step 3: NFT contract, while be called on `receiveApproval()`, will:
    - Step 3.1: transfer tokens from `msg.sender` to `seller` with amount of `_price`, and to the contract owner with amount of `_commission` , and then:
    - Step 3.2: change owner of the NFT with id `_artworkId` to `msg.sender`

Note that before calling `approveAndCall()`, `_seller` is required to approve his NFT with id `_artworkId` to be transferred by this contract.

The overall procedure is illustrated below.

![approveAndCall() procedure](./approveAndCall_flowchart.png "approveAndCall() procedure")

## Events

Events could be considered as the 'output' of the smart contract, and are usually triggered on specific methods. These events could be collected from any node connected to the network.

ACG20 contract supports standard ERC20 events, and following specific events as well.

### `OwnershipTransferred`

MUST trigger when contract ownership is moved to another account.

```js
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```

### `Mint`

MUST trigger whenever new tokens are created.

```js
event Mint(address indexed to, uint256 amount)
```

### `Burn`

MUST trigger whenever tokens are destroyed.

```js
event Burn(address indexed to, uint256 amount)
```

### `Freeze`

MUST trigger on any successful call to method `freeze()`.

```js
event Freeze(address indexed from, uint256 amount, uint256 artwork)
```

### `Unfreeze`

MUST trigger on any successful call to method `unfreeze()`

```js
event Unfreeze(address indexed from, uint256 amount, uint256 artwork)
```

### `RegisterACG721Contract`

MUST trigger when a NFT contract is registered.

```js
event RegisterACG721Contract(address indexed to)
```
