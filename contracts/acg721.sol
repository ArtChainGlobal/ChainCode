pragma solidity ^0.4.24;

import "./SafeMath.sol";

/**
 * @title StandardERC721
 *
 * A crude, simple single file implementation of ERC721 standard
 * @dev See https://github.com/ethereum/eips/issues/721
 *
 */
contract StandardERC721 {
    // SafeMath methods will be avaiable for the type "uint256"
    using SafeMath for uint256;

    mapping(uint => address) internal tokenIdToOwner;
    mapping(address => uint[]) public listOfOwnerTokens;
    mapping(uint => uint) internal tokenIndexInOwnerArray;
    // Approval mapping
    mapping(uint => address) internal approvedAddressToTransferTokenId;
    // Mapping from owner to operator approvals
    mapping (address => mapping (address => bool)) private operatorApprovals;

    event Transfer(address indexed _from, address indexed _to, uint256 _tokenId);
    event Approval(address indexed _owner, address indexed _approved, uint256 _tokenId);
    event ApprovalForAll(address indexed _owner, address indexed _to, bool _approved);

    modifier onlyExtantToken(uint _tokenId) {
        require(ownerOf(_tokenId) != address(0), "Token doesn't exist");
        _;
    }

    function balanceOf(address _owner) public view returns (uint _balance) {
        return listOfOwnerTokens[_owner].length;
    }
    // @dev Returns the address currently marked as the owner of _tokenID. 
    function ownerOf(uint256 _tokenId) public view returns (address _owner)
    {
        return tokenIdToOwner[_tokenId];
    }
    /// @notice Transfers the ownership of an NFT from one address to another address
    /// @dev Throws unless `msg.sender` is the current owner, an authorized
    ///  operator, or the approved address for this NFT. Throws if `_from` is
    ///  not the current owner. Throws if `_to` is the zero address. Throws if
    ///  `_tokenId` is not a valid NFT. 
    /// @param _from The current owner of the NFT
    /// @param _to The new owner
    /// @param _tokenId The NFT to transfer
    function transferFrom(address _from, address _to, uint256 _tokenId) public onlyExtantToken(_tokenId) {
        require(_isApprovedOrOwner(msg.sender, _tokenId), "Sender must be approved or authorized");
        require(ownerOf(_tokenId) == _from, "Must transfer the token from the owner address");
        require(_to != address(0), "Receiver address should not be zero");

        _clearApprovalAndTransfer(_from, _to, _tokenId);

        emit Approval(_from, 0, _tokenId);
        emit Transfer(_from, _to, _tokenId);
    }

    // @dev Grants approval for address _to to take possession of the NFT with ID _tokenId.
    function approve(address _to, uint _tokenId) public onlyExtantToken(_tokenId)
    {
        require(msg.sender == ownerOf(_tokenId) || isApprovedForAll(ownerOf(_tokenId), msg.sender), "Sender must be the owner or authorized account");
        require(msg.sender != _to, "Sender and receiver should be different");

        if (approvedAddressToTransferTokenId[_tokenId] != address(0) || _to != address(0)) {
            approvedAddressToTransferTokenId[_tokenId] = _to;
            emit Approval(msg.sender, _to, _tokenId);
        }
    }

    /// @notice Enable or disable approval for a third party ("operator") to manage
    ///  all of `msg.sender`'s assets
    /// @dev Emits the ApprovalForAll event. The contract MUST allow
    ///  multiple operators per owner.
    /// @param _to Address to add to the set of authorized operators
    /// @param _approved True if the operator is approved, false to revoke approval
    function setApprovalForAll(address _to, bool _approved) public {
        require(_to != msg.sender, "Sender need not approve himself");
        operatorApprovals[msg.sender][_to] = _approved;
        emit ApprovalForAll(msg.sender, _to, _approved);
    }

    /// @notice Get the approved address for a single NFT
    /// @dev Throws if `_tokenId` is not a valid NFT.
    /// @param _tokenId The NFT to find the approved address for
    /// @return The approved address for this NFT, or the zero address if there is none
    function getApproved(uint256 _tokenId) public view onlyExtantToken(_tokenId) returns (address) {
        return approvedAddressToTransferTokenId[_tokenId];
    }

    /// @notice Query if an address is an authorized operator for another address
    /// @param _owner The address that owns the NFTs
    /// @param _operator The address that acts on behalf of the owner
    /// @return True if `_operator` is an approved operator for `_owner`, false otherwise
    function isApprovedForAll(address _owner, address _operator) public view returns (bool) {
        return operatorApprovals[_owner][_operator];
    }

    function _isApprovedOrOwner(address _spender, uint256 _tokenId) internal view returns (bool) {
        address owner = ownerOf(_tokenId);
        return (_spender == owner || getApproved(_tokenId) == _spender || isApprovedForAll(owner, _spender));
    }

    function _clearApprovalAndTransfer(address _from, address _to, uint _tokenId) internal
    {
        _clearTokenApproval(_tokenId);
        _removeTokenFromOwnersList(_from, _tokenId);
        _setTokenOwner(_tokenId, _to);
        _addTokenToOwnersList(_to, _tokenId);
    }

    function _clearTokenApproval(uint _tokenId) internal
    {
        approvedAddressToTransferTokenId[_tokenId] = address(0);
    }

    function _removeTokenFromOwnersList(address _owner, uint _tokenId) internal
    {
        uint length = listOfOwnerTokens[_owner].length; // length of owner tokens
        uint index = tokenIndexInOwnerArray[_tokenId]; // index of token in owner array
        uint swapToken = listOfOwnerTokens[_owner][length - 1]; // last token in array

        listOfOwnerTokens[_owner][index] = swapToken; // last token pushed to the place of the one that was transfered
        tokenIndexInOwnerArray[swapToken] = index; // update the index of the token we moved

        delete listOfOwnerTokens[_owner][length - 1]; // remove the case we emptied
        listOfOwnerTokens[_owner].length--; // shorten the array's length
    }

    function _setTokenOwner(uint _tokenId, address _owner) internal
    {
        tokenIdToOwner[_tokenId] = _owner;
    }

    function _addTokenToOwnersList(address _owner, uint _tokenId) internal
    {
        listOfOwnerTokens[_owner].push(_tokenId);
        tokenIndexInOwnerArray[_tokenId] = listOfOwnerTokens[_owner].length - 1;
    }
}

/**
 * @title ACG 721 Token
 * @dev inherited from standard ERC721 token, while provides specific functions to support artChainGlobal system
 */
contract ACG721 is StandardERC721 {
    uint256 public totalSupply;

    address public owner;
    address public acg20Contract;
    
    // Metadata infos
    mapping(uint => string) public referencedMetadata;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Minted(address indexed _to, uint256 indexed _tokenId);
    event RegisterACG20Contract(address indexed _contract);

	/**
    * @dev Throws if called by any account other than the owner.
    */
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner is permitted for the operation");
        _;
    }

   	/**
	* @dev Throws if specific id is not existent.
	*/
    modifier onlyNonexistentToken(uint _tokenId) {
        require(tokenIdToOwner[_tokenId] == address(0), "Token must be not extant");
        _;
    }

    function version() public pure returns (string) {
        return "v1.0_5DEC2018_U";
    }

    /**
	* @dev The initializer function is used instead of constructor just because the contract
    * is expected to be deployed in unstructured upgradable proxy pattern, so it only plays 
    * a implemenation of the logic. The proxy whereby all data is stored proactically has no 
    * chance to call up a constructor for initializing work.
    * A more sophisticated solution is by using an `initializer contract`, as introduced in 
    * https://github.com/zeppelinos/labs/tree/master/initializer_contracts
    */
    function initializer() public {
        require(owner == address(0), "Initializer function is only called before contract has no owner");
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function _insertTokenMetadata(uint _tokenId, string _metadata) internal
    {
        referencedMetadata[_tokenId] = _metadata;
    }

    /**
	* @dev Register ACG20 contract. Throws if:
    * - `msg.sender` is not the contract owner, or
    * - `_contract` is a zero address.
    * 
	* @param _contract address The address of ACG20 contract
    */
    function registerACG20Contract(address _contract) public onlyOwner {
        require(_contract != address(0), "Must register a valid contract address");
        emit RegisterACG20Contract(_contract);
        acg20Contract = _contract;
    }

    /**
	* @dev Allows the current contract owner to transfer control of the contract to a new Owner.
	* @param newOwner The address to transfer ownership to.
	*/
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owmer must have a non-zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /**
    * @dev Create a NFT with given id. Anybody can create a token and give it to an owner. Throws if:
    * - `_tokenId` is already an extant NFT
    *
    * @param _owner the address of the NFT owner
    * @param _tokenId the id of the NFT
    */
    function mint(address _owner, uint256 _tokenId) public onlyNonexistentToken (_tokenId)
    {
        _setTokenOwner(_tokenId, _owner);
        _addTokenToOwnersList(_owner, _tokenId);

        totalSupply = totalSupply.add(1);
        emit Minted(_owner, _tokenId);
    }

    /**
    * @dev Create a NFT with given id and metadata. Anybody can create a token and give it to an owner. Note only one of these functions (Mint, MintWithMetadata) should be used depending on the use case. Throws if:
    * - '_tokenId' is already an extant NFT
    *
    * @param _owner the address of the NFT owner
    * @param _tokenId the id of the NFT
    * @param _metadata the meta data of the NFT containing additional information of the NFT.
    */
    function mintWithMetadata(address _owner, uint256 _tokenId, string _metadata) public onlyNonexistentToken (_tokenId)
    {
        _setTokenOwner(_tokenId, _owner);
        _addTokenToOwnersList(_owner, _tokenId);

        totalSupply = totalSupply.add(1);

        _insertTokenMetadata(_tokenId, _metadata);
        emit Minted(_owner, _tokenId);
    }

    /**
    * @dev Update the meta data of an extant NFT. Throws if:
    * - `msg.sender` is not the contract owner, or
    * - `_tokenId` is not an extant NFT.
    *
    * @param _tokenId the id of the NFT
    * @param _metadata the updated meta data of the NFT
    */
    function updateMetadata(uint256 _tokenId, string _metadata) public onlyOwner() onlyExtantToken(_tokenId) {
        _insertTokenMetadata(_tokenId, _metadata);
    }

	/** 
    * @dev Assigns the ownership of the NFT with ID `_tokenId` to `_to`. Throws if:
    * - `msg.sender` is not the NFT owner, or
    * - `_to` is the zero address, or
    * - `_tokenId` is not an extant NFT.
    *
    * @param _to the address of the new owner
    * @param _tokenId the id of the NFT to transfer
    */
    function transfer(address _to, uint _tokenId) public onlyExtantToken (_tokenId)
    {
        require(ownerOf(_tokenId) == msg.sender, "Sender should be the owner of the token");

        require(_to != address(0), "Receiver address should not be zero"); 

        _clearApprovalAndTransfer(msg.sender, _to, _tokenId);

        emit Transfer(msg.sender, _to, _tokenId);
    }

    /**
	* @dev Called as part of method `safeTokenTrade()` of ACG20 contract, for a safe payment of the NFT. See `safeTokenTrade()` for more information. Throws if:
    * - `_tokenId` is not extant, or
    * - `msg.sender` is not the registered ACG20 contract address.
    *
    * The method establishes:
    * Step 1: change the owner of the NFT with id `_tokenId` to `_to`.
    *
    * @param _to buyer of NFT
    * @param _from seller of NFT
    * @param _tokenId the NFT id which the ACG20 tokens are transferred for
	*/
    function receiveApproval(address _from, address _to, uint256 _tokenId) public onlyExtantToken(_tokenId) returns (bool) {
        require(msg.sender == acg20Contract, "Contract address must match the registered ACG20 contract");

        transferFrom(_from, _to, _tokenId);
        return true;
    }
}
