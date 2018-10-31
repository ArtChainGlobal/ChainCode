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
 * @dev ERC20 to support ArtChainGlobal system
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

    // @dev The artchain_acg20 constructor sets the original `owner` of the contract to the sender account.
    constructor() public {
        owner = msg.sender;
    }

   	/**
	* @dev Throws if called by any account other than the owner.
	*/
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner is permitted for the operation");
        _;
    }

    /**
	* @dev Check if the transfer is the payment of an auction.
    * - If it is, then
    *    - transfer the ACG20 token from the frozen part
    *    - reset the frozen record
    * - If not, then transfer the ACG20 token from buyer's account
	*/
    modifier isForAuction(address _from, uint256 _value, uint256 _artworkId) {
        if (_from == highestBidder[_artworkId]) {
            require (_value == highestBid[_artworkId], "Payment for the auction is different from the final bid");
            // Withdraw the frozen tokesn to bidder's account
            balances[_from] = balances[_from].add(highestBid[_artworkId]);
            // Reset bid and bidder
            highestBidder[_artworkId] = address(0);
            highestBid[_artworkId] = 0;
        }
        _;
    }

	/**
	* @dev Allows the current owner to transfer control of the contract to a newOwner.
	* @param newOwner The address to transfer ownership to.
	*/
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owmer must have a non-zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /**
	* @dev Allows the user's balance as well as the total supply to be increated.
    * @param _to address The address which you want to increase the balance
	* @param _amount uint256 the amount of tokens to be increased
	*/
    function mint(address _to, uint256 _amount) public onlyOwner returns (bool) {
        totalSupply = totalSupply.add(_amount);
        balances[_to] = balances[_to].add(_amount);
        emit Mint(_to, _amount);
        emit Transfer(address(0), _to, _amount);
        return true;
    }

    /**
	* @dev Destroy user's token and decrease the total supply as well.
	* @param _amount uint256 the amount of tokens to be destroyed
	*/
    function burn(uint256 _amount) public returns (bool) {
        require(balances[msg.sender] >= _amount, "Burned amount exceeds user balance");
        totalSupply = totalSupply.sub(_amount);
        balances[msg.sender] = balances[msg.sender].sub(_amount);
        emit Burn(msg.sender, _amount);
        return true;
    }

    /**
	* @dev Destroy delegated user's token and decrease the total supply as well.
	* @param _amount uint256 the amount of tokens to be destroyed
	*/
    function burnFrom(address _from, uint256 _amount) public returns (bool) {
        require(balances[_from] >= _amount, "Burned amount exceeds user balance");
        require(allowed[_from][msg.sender] >= _amount, "Burned amount exceeds granted value");

        totalSupply = totalSupply.sub(_amount);
        balances[_from] = balances[_from].sub(_amount);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_amount);
        emit Burn(_from, _amount);
        return true;
    }

    /**
	* @dev Freeze given amount of tokens for the auction.
	* @param _from uint256 address to freeze tokens from
    * @param _amount uint256 the amount of tokens to be frozen
    * @param _artworkId uint256 ID of the artwork in auction
	*/
    function freeze(address _from, uint256 _amount, uint256 _artworkId) public onlyOwner returns (bool) {
        require(highestBid[_artworkId] < _amount, "Invalid operation: new bid should be greater than previous");

        // First unfreeze tokens for current bidder (might be same with _from)
        unfreeze(_artworkId);

        // The balance of new bidder should be greater than the bid
        // If the statement failed here, unfreeze operation will be reverted
        require(balances[_from] >= _amount, "User's bid amount exceeds his balance");

        // Freeze tokens from the account of the new bidder
        balances[_from] = balances[_from].sub(_amount);

        // Update bid and bidder
        highestBidder[_artworkId] = _from;
        highestBid[_artworkId] = _amount;

        emit Freeze(_from, _amount, _artworkId);
    }

    /*
    *bring the allowance function here to help us to bring it to the ACG20 interface.
    */
    function allowance(address _owner, address _spender) public view returns (uint256) {
        return super.allowance(_owner, _spender);
    }

    /**
	* @dev Unfreeze tokens for the auction.
	* @param _artworkId artwork uint256 ID of the artwork in auction
	*/
    function unfreeze(uint256 _artworkId) public onlyOwner returns (bool) {
        address bidder = highestBidder[_artworkId];
        uint256 bid = highestBid[_artworkId];

        if (bidder != address(0)) {
            // Withdraw the frozen tokens to bidder's account
            balances[bidder] = balances[bidder].add(bid);

            // Reset bid and bidder
            highestBidder[_artworkId] = address(0);
            highestBid[_artworkId] = 0;

            emit Unfreeze(bidder, bid, _artworkId);
        }
        return true;
    }

    /**
	* @dev transfer token for a specified address for artwork purchase (support auction)
	* @param _to The address to transfer to.
	* @param _value The amount to be transferred.
    * @param _artworkId The ID of artwork which the transfer is for
	*/
    function payForArtwork(address _to, uint256 _value, uint256 _artworkId) public isForAuction(msg.sender, _value, _artworkId) returns (bool) {
        return super.transfer(_to, _value);
    }

    /**
	* @dev Transfer tokens from one address to another for artwork purchase(support auction)
	* @param _from address The address which you want to send tokens from
	* @param _to address The address which you want to transfer to
	* @param _price uint256 the amount of tokens to be transferred to seller
	* @param _commission uint256 the amount of tokens to be transferred to contract owner
    * @param _artworkId The ID of artwork which the transfer is for
    *   All issues from this function left
	*/
    function payForArtworkFrom(address _from, address _to, uint256 _price, uint256 _commission, uint256 _artworkId) public isForAuction(_from, _price.add(_commission), _artworkId) returns (bool) {
        require(super.transferFrom(_from, _to, _price), "Must transfer price to seller");
        require(super.transferFrom(_from, owner, _commission), "Must transfer commission to agent");
        return true;
    }

    /**
	* @dev Register ACG721 contract
	* @param _contract address The address of ACG721 contract
    */
    function registerACG721Contract(address _contract) public onlyOwner {
        require(_contract != address(0), "Must register a valid contract address");
        emit RegisterACG721Contract(_contract);
        acg721Contract = _contract;
    }

    /**
	* @dev Establish a safe transaction of buying a ACG721 token using ACG20 token.
    *      Buyer first approves ACG721 contract to transfer the specific amount of 
    *      ACG20 tokens under his account, and then call method  
    *      receiveApproval() of ACG721 contract to accomplish the transaction.
    *      Before calling this method, seller must approve this ACG20 contract to
    *      transfer his ACG721 token with specific ID beforehead.
    * @param _seller address The address of ACG721 token owner
    * @param _price uint256 amount of ACG20 tokens transferred to ACG721 token owner
    * @param _commission uint256 amount of ACG20 tokens transferred to contract owner
    * @param _artworkId The ID of ACG721 which the transfer is for
	*/
    function approveAndCall(address _seller, uint256 _price, uint256 _commission, uint256 _artworkId) public returns (bool) {
        require(acg721Contract != address(0), "Must register a valid contract before calling approveAndCall() method");
        approve(acg721Contract, _price.add(_commission));

        require(ACG721Interface(acg721Contract).receiveApproval(msg.sender, _seller, _price, _commission, _artworkId), "approveAndCall() must ensure calling receiveApproval() succeed");
    }
}
