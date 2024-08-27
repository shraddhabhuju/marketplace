// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract MyToken is ERC20, Ownable, ERC20Permit {
    constructor(
        address initialOwner
    ) ERC20("MyToken", "MTK") Ownable(initialOwner) ERC20Permit("MyToken") {
        _mint(initialOwner, 100000000000000000000000000000000000000000000000000000);
    }
}
