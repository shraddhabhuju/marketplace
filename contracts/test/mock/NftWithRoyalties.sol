// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/common/ERC2981.sol";

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

contract RoyaltyNFT is ERC721URIStorage, ERC2981, Ownable {
    uint256 private _tokenIds;

    constructor(
        string memory _name,
        string memory _symbol,
        address owner
    ) ERC721(_name, _symbol) Ownable(owner) {
        _setDefaultRoyalty(msg.sender, 100);
    }

    function _burn(uint256 tokenId) internal virtual override {
        super._burn(tokenId);

        _resetTokenRoyalty(tokenId);
    }

    function burn(uint256 tokenId) public onlyOwner {
        _burn(tokenId);
    }

    function mint(
        address recipient,
        string memory tokenURI
    ) public onlyOwner returns (uint256) {
        _tokenIds++;

        uint256 newItemId = _tokenIds;

        _safeMint(recipient, newItemId);

        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }

    function mintWithRoyalty(
        address recipient,
        string memory tokenURI,
        address royaltyReceiver,
        uint96 roayltyFee
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = mint(recipient, tokenURI);

        _setTokenRoyalty(tokenId, royaltyReceiver, roayltyFee);

        return tokenId;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC2981, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
