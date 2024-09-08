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
        tokenId++;//1
        _safeMint(initialOwner,tokenId);
        tokenId++;//2
        _safeMint(initialOwner, tokenId);
        tokenId++;//3
        _safeMint(initialOwner, tokenId);
        tokenId++;//4
        _safeMint(initialOwner, tokenId);
         tokenId++;//5
        _safeMint(initialOwner, tokenId);
         tokenId++;//6
        _safeMint(initialOwner, tokenId);
         tokenId++;//7
        _safeMint(initialOwner, tokenId);
         tokenId++;//8
        _safeMint(initialOwner, tokenId);
         tokenId++;//9
        _safeMint(initialOwner, tokenId);
        tokenId++;//10
        _safeMint(initialOwner, tokenId);
        
    }

    function safeMint(address to) public onlyOwner {
        _safeMint(to, tokenId);
    }
}
