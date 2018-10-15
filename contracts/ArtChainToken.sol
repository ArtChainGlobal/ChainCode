pragma solidity ^0.4.22;

/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 * @notice source: https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/math/SafeMath.sol
 */

library SafeMath {
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }
        uint256 c = a * b;
        assert(c / a == b);
        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // assert(b > 0); // Solidity automatically throws when dividing by 0
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold
        return c;
    }  

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        assert(b <= a);
        return a - b;
    }

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        assert(c >= a);
        return c;
    }
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
        //require(_to != address(0), "Receiver must have a non-sero address");
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
        //require(_to != address(0), "Receiver must have a non-sero address");
        require(_value <= balances[_from], "Sender's balance must be larger than transferred amount");
        //require(_value <= allowed[_from][msg.sender], "Sender must have approved larger amount to the delegator");

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
 * @dev ERC721 to support ArtChainGlobal system
 * 
 */
contract ACG20 is StandardERC20 {

    string public name = "ArtChain Global Token 20";
    string public symbol = "ACG20";
    uint8 public decimals = 2;

    address public owner;

    // artwork ID => highest bidder address
    mapping(uint256 => address) highestBidder;
    // artwork ID => highest bid
    mapping(uint256 => uint256) highestBid;
  
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed to, uint256 amount);
    event NewBid(address indexed from, uint256 amount, uint256 artwork);

	/**
	* @dev Throws if called by any account other than the owner.
	*/
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner is permitted for the operation");
        _;
    }

    /**
	* @dev Check if the transfer is the payment of an auction. Throws if:
    * - sdfds
    * - sdfsd
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
	* @dev The artchain_acg20 constructor sets the original `owner` of the contract to the sender
	* account.
	*/
    constructor() public {
        owner = msg.sender;
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
    function burn(uint256 _amount) public onlyOwner returns (bool) {
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
    function burnFrom(address _from, uint256 _amount) public onlyOwner returns (bool) {
        require(balances[_from] >= _amount, "Burned amount exceeds user balance");
        // require(allowed[_from][msg.sender] >= _amount, "Burned amount exceeds delegated value");

        totalSupply = totalSupply.sub(_amount);
        balances[_from] = balances[_from].sub(_amount);
        //allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_amount);
        emit Burn(_from, _amount);
        return true;
    }

    /**
	* @dev Freeze given amount of tokens for the auction.
	* @param _amount uint256 the amount of tokens to be destroyed
    * @param _amount uint256 the amount of tokens to be destroyed
	*/
    function freeze(address _from, uint256 _amount, uint256 _artworkId) public onlyOwner returns (bool) {
        require(highestBid[_artworkId] < _amount, "Invalid operation: new bid should be greater than previous");

        address prevBidder = highestBidder[_artworkId];
        uint256 prevBid = highestBid[_artworkId];

        // First withdraw the frozen tokens to previous bidder's account
        balances[prevBidder] = balances[prevBidder].add(prevBid);

        // The balance of new bidder should be greater than the bid
        require(balances[_from] >= _amount, "User's bid amount exceeds his balance");

        // Freeze tokens from the account of the new bidder
        balances[_from] = balances[_from].sub(_amount);

        // Update bid and bidder
        highestBidder[_artworkId] = _from;
        highestBid[_artworkId] = _amount;

        emit NewBid(_from, _amount, _artworkId);
    }

    /**
	* @dev transfer token for a specified address (support auction)
	* @param _to The address to transfer to.
	* @param _value The amount to be transferred.
	*/
    function transfer(address _to, uint256 _value) public returns (bool) {
        return super.transfer(_to, _value);
    }

    /**
	* @dev Transfer tokens from one address to another (support auction)
	* @param _from address The address which you want to send tokens from
	* @param _to address The address which you want to transfer to
	* @param _value uint256 the amount of tokens to be transferred
	*/
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        require(super.approve(_from, _value));
        return super.transferFrom(_from, _to, _value);
        //the sender(msg.sender) need to be the one who execute this transaction deu to security
        //for example, double spending which is disussing on StackExachange.
    }

    /**
    *
     */
    function approve(address _spender, uint256 _value) public returns (bool) {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
}