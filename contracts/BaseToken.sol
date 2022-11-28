// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "hardhat/console.sol";

contract BaseToken is ERC20, ERC20Burnable, ERC20Permit {

    constructor(string memory _name, string memory _symbol, uint _amount) ERC20(_name, _symbol) ERC20Permit(_name) {
        _mint(msg.sender, _amount);
    }

    function mint(uint _amount) external {
        _mint(msg.sender, _amount);
    }

}