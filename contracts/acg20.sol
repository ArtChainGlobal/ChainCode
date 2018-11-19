pragma solidity ^0.4.24;

import "./SafeMath.sol";

contract ACG721Interface {
    function receiveApproval(address _from, address _to, uint256 _price, uint256 _commission, uint256 _tokenId) public returns (bool)
    {}
}

/**
 * @title StandardERC20
 * @dev A one file ERC20 token for the 4th part of the Ethereum Development Walkthrough tutorial series
 * 
 * @notice check https://github.com/OpenZeppelin/zeppelin-solidity for a better, modular code
 */
contract StandardERC20 {

    // SafeMath methods will be available for the type "unit256"
    using SafeMath for uint256; 

    string public name = "Standard ERC20";
    string public symbol = "ERC20";
    uint8 public decimals = 8;
    uint256 public totalSupply = 0;
    
    mapping(address => uint256) balances;
    mapping (address => mapping (address => uint256)) internal allowed;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

	/**
	* @dev Gets the total supply of the token.
	* @return An uint256 representing the total amount of the token.
	*/
    function totalSupply() public view returns (uint256 _totalSupply) {
        return totalSupply;
    }

	/**
	* @dev Gets the balance of the specified address.
	* @param tokenOwner The address to query the the balance of.
	* @return An uint256 representing the amount owned by the passed address.
	*/
    function balanceOf(address tokenOwner) public view returns (uint256 balance) {
        return balances[tokenOwner];
    }

	/**
	* @dev transfer token for a specified address
	* @param _to The address to transfer to.
	* @param _value The amount to be transferred.
	*/
    function transfer(address _to, uint256 _value) public returns (bool) {
        require(_to != address(0), "Receiver must have a non-zero address");
        require(_value <= balances[msg.sender], "Sender's balance must be larger than transferred amount");

        // SafeMath.sub will throw if there is not enough balance.
        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

	/**
	* @dev Transfer tokens from one address to another
	* @param _from address The address which you want to send tokens from
	* @param _to address The address which you want to transfer to
	* @param _value uint256 the amount of tokens to be transferred
	*/
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        require(_to != address(0), "Receiver must have a non-sero address");
        require(_value <= balances[_from], "Sender's balance must be larger than transferred amount");
        require(_value <= allowed[_from][msg.sender], "Sender must have approved larger amount to the delegator");

        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
        emit Transfer(_from, _to, _value);
        return true;
    }

	/**
	   * @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
	   *
	   * Beware that changing an allowance with this method brings the risk that someone may use both the old
	   * and the new allowance by unfortunate transaction ordering. One possible solution to mitigate this
	   * race condition is to first reduce the spender's allowance to 0 and set the desired value afterwards:
	   * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
	   * @param _spender The address which will spend the funds.
	   * @param _value The amount of tokens to be spent.
	   */
    function approve(address _spender, uint256 _value) public returns (bool) {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

	/**
	* @dev Function to check the amount of tokens that an owner allowed to a spender.
	* @param _owner address The address which owns the funds.
	* @param _spender address The address which will spend the funds.
	* @return A uint256 specifying the amount of tokens still available for the spender.
	*/
    function allowance(address _owner, address _spender) public view returns (uint256) {
        return allowed[_owner][_spender];
    }
}

/**
 * @title ACG 20 Token
 * @dev inherited from standard ERC20 token, while provides specific functions to support artChainGlobal system
 * 
 */
contract ACG20 is StandardERC20 {
    string public name = "ArtChain Global Token 20";
    string public symbol = "ACG20";
    uint8 public decimals = 2;

    address public owner;
    address public acg721Contract;

    // artwork ID => highest bidder address
    mapping(uint256 => address) public highestBidder;
    // artwork ID => highest bid
    mapping(uint256 => uint256) public highestBid;
  
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed to, uint256 amount);
    event Freeze(address indexed from, uint256 amount, uint256 artwork);
    event Unfreeze(address indexed from, uint256 amount, uint256 artwork);
    event RegisterACG721Contract(address indexed to);

    /**
     * @dev Constructor. sets the original `owner` of the contract to the sender account.
     */
    constructor() public {
        owner = msg.sender;
    }

   	/**
	* @dev Throws if called by any account other than the contract owner.
	*/
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner is permitted for the operation");
        _;
    }

    /**
	* @dev Used with methods PayForArtwork() and PayForArtworkFrom(). Throws if:
    * - _from matches the record of bidder for the specific _artworkId, but
    * - _value mismatches the record of bid for the specific _artworkId.
    * If requirement is satisfied, the payment is considered to be for an ongoing auction, and then:
    * - Withdraw the previously frozen tokens back to account of _from, and
    * - Reset records of bid and bidder for the specific _artworkId
    * @param _from The address which you want to send tokens from
    * @param _value The amount of tokens to be transferred
    * @param _artworkId The NFT id which the transfer is for
	*/
    modifier isForAuction(address _from, uint256 _value, uint256 _artworkId) {
        if (_from == highestBidder[_artworkId]) {
            require (_value == highestBid[_artworkId], "Payment for the auction is different from the final bid");

            // Withdraw the frozen tokens to bidder's account
            balances[_from] = balances[_from].add(highestBid[_artworkId]);

            emit Unfreeze(_from, _value, _artworkId);
            // Reset bid and bidder
            delete highestBidder[_artworkId];
            delete highestBid[_artworkId];
        }
        _;
    }

    /**
	* @dev Register the address of contract ACG721. This method should be called once the contract is deployed.
	* @param _contract address of the deployed ACG721 contract
    */
    function registerACG721Contract(address _contract) public onlyOwner {
        require(_contract != address(0), "Must register a valid contract address");
        emit RegisterACG721Contract(_contract);
        acg721Contract = _contract;
    }

	/**
	* @dev Allows the current contract owner to transfer control of the contract to a new Owner.
	* @param newOwner The address to transfer ownership to.
	*/
    function transferOwnership(address newOwner) public {
        if (owner != address(0)) {
            require(msg.sender == owner);
        }
        require(newOwner != address(0), "New owmer must have a non-zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /**
	* @dev Allows the user's balance as well as the total supply to be increated. Only contract owner is capable to call this method.
    * @param _to The address which you want to increase the balance
	* @param _amount the amount of tokens to be increased
	*/
    function mint(address _to, uint256 _amount) public onlyOwner {
        totalSupply = totalSupply.add(_amount);
        balances[_to] = balances[_to].add(_amount);
        emit Mint(_to, _amount);
        emit Transfer(address(0), _to, _amount);
    }

    /**
	* @dev Destroy user's tokens with given amount, and decrease the total supply as well. Anyone can burn tokens from his own account. Throws if amount to be destroyed exceeds account's balance.
    *
	* @param _amount the amount of tokens to be destroyed
	*/
    function burn(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Burned amount exceeds user balance");
        totalSupply = totalSupply.sub(_amount);
        balances[msg.sender] = balances[msg.sender].sub(_amount);
        emit Burn(msg.sender, _amount);
    }

    /**
	* @dev Destroy delegated user's tokens with given amount, and decrease the total supply as well. Throws if:
    * - amount to be destroyed exceeds account's balance, or
    * - amount to be destroyed exceeds allowed amount to the spender
    *
    * @param _from the address from which you want to destroy tokens
	* @param _amount the amount of tokens to be destroyed
	*/
    function burnFrom(address _from, uint256 _amount) public {
        require(balances[_from] >= _amount, "Burned amount exceeds user balance");
        require(allowed[_from][msg.sender] >= _amount, "Burned amount exceeds granted value");

        totalSupply = totalSupply.sub(_amount);
        balances[_from] = balances[_from].sub(_amount);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_amount);
        emit Burn(_from, _amount);
    }

    /**
	* @dev Freeze given amount of tokens from an account on purpose of auction. When a user proposes a valid bid during the acution period, tokens regarding to the bid will be moved out of his account, and so decrease his balance. The frozen tokens would be stored in a map with the key value of `_artworkId`. 
    *
    * Throws if:
    * - `msg.sender` is not the contract owner, or
    * - amount to be frozen is lower than previously frozen amount, that means current bid is even lower than previous one, or
    * - the account's balance is lower than the amount to be frozen
    *
    * @param _from  address from which to freeze tokens
    * @param _amount the amount of tokens to be frozen
    * @param _artworkId NFT id for which the tokens are frozen, also used as key value of the map storing the frozen tokens
	*/
    function freeze(address _from, uint256 _amount, uint256 _artworkId) public onlyOwner {
        require(highestBid[_artworkId] < _amount, "Invalid operation: new bid should be greater than previous");

        // First unfreeze tokens for current bidder (might be same with _from)
        unfreeze(_artworkId);
        
        // The balance of new bidder should be greater than the bid
        // If the statement failed here, unfreeze operation will be reverted
        require(balances[_from] >= _amount, "User's bid amount exceeds his balance");

        // require the _from approve for freezing his amount of token to the owner
        require(_amount <= allowed[_from][owner], "Sender must have approved larger amount to the delegator");
        // Freeze tokens from the account of the new bidder
        balances[_from] = balances[_from].sub(_amount);
        allowed[_from][owner] = allowed[_from][owner].sub(_amount);
        // Update bid and bidder
        highestBidder[_artworkId] = _from;
        highestBid[_artworkId] = _amount;

        emit Freeze(_from, _amount, _artworkId);
    }

    /**
	* @dev Withdraw the frozen tokens for NFT `_artworkId` back to the account who is holding the valid bid for `_artworkId`. This methods could be called if:
    * - a higher bid is proposed for given NFT id, then the frozen tokens of previous bid owner would be unfrozen before freezing the tokens from new bidder's account, or
    * - called explicited to cancel the auction for the specific NFT
    * 
    * Throws if `msg.sender` is not the contract owner.
    *
	* @param _artworkId NFT id for which the frozen tokens are withdrawn
	*/
    function unfreeze(uint256 _artworkId) public onlyOwner {
        address bidder = highestBidder[_artworkId];
        uint256 bid = highestBid[_artworkId];

        if (bidder != address(0)) {
            // Withdraw the frozen tokens to bidder's account
            balances[bidder] = balances[bidder].add(bid);

            // Reset bid and bidder
            delete highestBidder[_artworkId];
            delete highestBid[_artworkId];

            emit Unfreeze(bidder, bid, _artworkId);
        }
    }

    /**
	* @dev transfer tokens to another acccount to establish the purchase of specific NFT. Supports both normal sales and auctions. Also triggers the previously frozen tokens for `_artworkId` to be withdrawn firstly. The method is less likely to be used in consideration of security, without guarantee that account `_to` will successfully transfer NFT to `msg.sender`. Instead, `payForArtworkFrom()` is preferred as part of a safe transaction procedure. See `approveAndCall()` for more info.
    * Throws if:
    * - Currently recorded bid for `_artworkId` mismatchs (`_value`)
    *
	* @param _to The address to which the tokens are transfer.
	* @param _value The amount of tokens to be transferred.
    * @param _artworkId The NFT id for which the tokens are transferred.
	*/
    function payForArtwork(address _to, uint256 _value, uint256 _artworkId) public isForAuction(msg.sender, _value, _artworkId) returns (bool) {
        return super.transfer(_to, _value);
    }

    /**
	* @dev transfer delegated user's tokens to establish the purchase of NFT `_artworkId`. Supports both normal sales and auctions. Also triggers the tokens previously frozen tokens for `_artworkId` to be wighdrawn firstly, which is supposed to happen at the end of an auction. This method, as part of `approveAndCall()` procedure, is preferred than `payForArtwork()` in consideration of security. See `approveAndCall()` for more info.
    * Throws if:
    * - Currently recorded bid for `_artworkId` mismatchs (`_commission`+`_price`)
    *
	* @param _from The address which the tokens are transferred from
	* @param _to The address which the tokens are transferred to
	* @param _price the amount of tokens to be transferred
	* @param _commission the amount of tokens to be transferred to contract owner as commission
    * @param _artworkId The NFT id for which the tokens are transferred
	*/
    function payForArtworkFrom(address _from, address _to, uint256 _price, uint256 _commission, uint256 _artworkId) public isForAuction(_from, _price.add(_commission), _artworkId) returns (bool) {
        require(super.transferFrom(_from, _to, _price), "Must transfer price to seller");
        require(super.transferFrom(_from, owner, _commission), "Must transfer commission to agent");
        return true;
    }

    /**
	* @dev Establish a safe payment for a NFT with tokens, inspired by : https://medium.com/@jgm.orinoco/ethereum-smart-service-payment-with-tokens-60894a79f75c. 
    * Guarantees:
    * - token owner transfers tokens to NFT owner, and
    * - NFT owner transfer NFT to token owner.
    *
    * Throws if:
    * - A NFT contract has not been registered yet, or
    * - call to `approve()` failed, or
    * - call to `receiveApproval()` of the registered NFT contract failed.
    *
    * The method introduces both this and the NFT contract accounts in the transaction as the intermediator, and establishes:
    * Step 1: `msg.sender` approves amount (`_price`+`_commission`) of his token to be transferred by the registered NFT contract;
    * Step 2: `msg.sender` calls method `receiveApproval()` of the registered NFT contract;
    * Step 3: NFT contract, while be called on `receiveApproval()`, will:
    *   Step 3.1: transfer tokens from `msg.sender` to `seller` with amount of `_price`, and to the contract owner with amount of `_commission` , and then:
    *   Step 3.2: change owner of the NFT with id `_artworkId` to `msg.sender`
    *
    * Note that before calling `approveAndCall()`, `_seller` is required to approve his NFT with id `_artworkId` to be transferred by this contract.
    *
    * @param _seller address which the tokens are transferred to
    * @param _price the amount of tokens transerred to _seller address
    * @param _commission the amount of tokens transferred to contract owner as commission
    * @param _artworkId the NFT id which the tokens are transferred for
	*/
    function approveAndCall(address _seller, uint256 _price, uint256 _commission, uint256 _artworkId) public {
        require(acg721Contract != address(0), "Must register a valid contract before calling approveAndCall() method");
        approve(acg721Contract, _price.add(_commission));

        require(ACG721Interface(acg721Contract).receiveApproval(msg.sender, _seller, _price, _commission, _artworkId), "approveAndCall() must ensure calling receiveApproval() succeed");
    }
}
