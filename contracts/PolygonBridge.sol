// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";

import "hardhat/console.sol";
import "./BaseToken.sol";

contract PolygonBridge {

    mapping(address => bool) private mapTokenDeployedOnNetwork;
    mapping(address => address) private mapSourceToTagetTokens;
    mapping(address => address) private mapTargetToSourceTokens;

    event DeployedNewToken(string _name, string _symbol, uint _amount);
    event MintTokens(string _name, string _symbol, uint _amount);
    event BurntTokens(string _name, string _symbol, uint256 _amount);

    function claimTokens(
        address _sourceToken, 
        string calldata _name, 
        string calldata _symbol, 
        uint256 _amount,
        bytes32 _hashedMessage, 
        uint8 _v, 
        bytes32 _r, 
        bytes32 _s
        ) external {
        require(verifyMessage(_hashedMessage, _v, _r, _s) == msg.sender, "The message was not signed by the caller");
        if (mapTokenDeployedOnNetwork[_sourceToken]) {
            mintExistingToken(_sourceToken, _amount);
        } else {
            deployNewToken(_sourceToken, _name, _symbol, _amount);
        }
    }

    function destroyTokens(address _targetAddress, uint256 _amount, uint256 _deadline, uint8 _v, bytes32 _r, bytes32 _s) external {
        BaseToken token = BaseToken(_targetAddress);
        require(token.totalSupply() >= _amount, "Can't destroy more tokens than the total supply");
        require(token.balanceOf(msg.sender) >= _amount, "Owner doesn't have enough tokens to destroy");
        token.permit(msg.sender, address(this), _amount, _deadline, _v, _r, _s);
        token.burnFrom(msg.sender, _amount);
        emit BurntTokens(token.name(), token.symbol(), _amount);
    }

    function mintExistingToken(address _sourceToken, uint256 _amount) private {
        BaseToken token = BaseToken(mapSourceToTagetTokens[_sourceToken]);
        token.mint(_amount);
        token.transfer(msg.sender, _amount);
        emit MintTokens(token.name(), token.symbol(), _amount);
    }

    function deployNewToken(address _sourceToken, string calldata _name, string calldata _symbol, uint _amount) private {
        string memory wrappedName = string.concat("W", _name);
        string memory wrappedSymbol = string.concat("W", _symbol);
        BaseToken token = new BaseToken(wrappedName, wrappedSymbol, _amount);
        token.transfer(msg.sender, _amount);
        setTokenOnNetwork(_sourceToken, address(token));
        emit DeployedNewToken(wrappedName, wrappedSymbol, _amount);
    }
    
    function setTokenOnNetwork(address _sourceToken, address _targetToken) private {
        mapTokenDeployedOnNetwork[_sourceToken] = true;
        mapSourceToTagetTokens[_sourceToken] = _targetToken;
        mapTargetToSourceTokens[_targetToken] = _sourceToken;
    }

    function isTokenOnNetwork(address _tokenAddress) external view returns(bool) {
        return mapTokenDeployedOnNetwork[_tokenAddress];
    }

    function getTargetTokenFromSource(address _sourceAddress) external view returns(address) {
        return mapSourceToTagetTokens[_sourceAddress];
    }

    function getSourceTokenFromTarget(address _targetAddress) external view returns(address) {
        return mapTargetToSourceTokens[_targetAddress];
    }

    function verifyMessage(bytes32 _hashedMessage, uint8 _v, bytes32 _r, bytes32 _s) private pure returns (address) {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 prefixedHashMessage = keccak256(abi.encodePacked(prefix, _hashedMessage));
        address signer = ecrecover(prefixedHashMessage, _v, _r, _s);
        return signer;
    }
}