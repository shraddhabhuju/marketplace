// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyTokenNFT is ERC721, Ownable {
    uint256 tokenId=0;
    constructor(
        address initialOwner
    ) ERC721("MyTokenNFT", "MTK") Ownable(initialOwner) {
        tokenId++;
        _safeMint(initialOwner,tokenId);
        tokenId++;
        _safeMint(initialOwner, 2);
    }

    function safeMint(address to) public onlyOwner {
        _safeMint(to, tokenId);
    }
}
