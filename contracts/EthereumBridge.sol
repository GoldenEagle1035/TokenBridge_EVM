// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";

import "hardhat/console.sol";
import "./BaseToken.sol";

contract EthereumBridge {

    mapping(address => mapping(address => uint256)) private accountBalances; // account -> token -> amount 

    event LockTokens(address _sourceToken, address _spender, uint256 _amount);
    event UnlockTokens(address _address, string name, string symbol, uint256 _amount);

    function lock(address _sourceToken, uint256 _amount, uint256 _deadline, uint8 _v, bytes32 _r, bytes32 _s) external {
        BaseToken token = BaseToken(_sourceToken);
        require(token.balanceOf(msg.sender) >= _amount, "Insufficient amount of tokens");
        accountBalances[msg.sender][_sourceToken] += _amount;
        token.permit(msg.sender, address(this), _amount, _deadline, _v, _r, _s);
        token.transferFrom(msg.sender, address(this), _amount);
        emit LockTokens(_sourceToken, msg.sender, _amount);
    }

    function unlock(address _targetToken, uint256 _amount) external {
        require(accountBalances[msg.sender][_targetToken] >= _amount, "Insufficient amount of locked tokens");
        accountBalances[msg.sender][_targetToken] -= _amount;
        BaseToken token = BaseToken(_targetToken);
        token.transfer(msg.sender, _amount);
        emit UnlockTokens(_targetToken, token.name(), token.symbol(), _amount);
    }

}