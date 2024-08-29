# Marketplace Smart Contract

This repository contains the Solidity smart contract code for a decentralized NFT marketplace. The marketplace allows users to list, buy, and sell NFTs (ERC721 and ERC1155) with additional features such as whitelisted tokens, platform fees, and SoulBound NFTs for access control.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Smart Contract Details](#smart-contract-details)
  - [Initialization](#initialization)
  - [Listing NFTs](#listing-nfts)
  - [Buying NFTs](#buying-nfts)
  - [Access Control](#access-control)
- [Security Considerations](#security-considerations)
- [License](#license)

## Introduction

The Marketplace contract is designed to enable the buying and selling of NFTs on a decentralized platform. It supports various token standards like ERC20, ERC721, and ERC1155, with added functionality such as platform fees, whitelisted currencies, and SoulBound NFTs for gating user access.

## Features

- **Multiple Token Standards:** Supports ERC20, ERC721, and ERC1155 tokens.
- **Platform Fees:** Allows the collection of platform fees from sales.
- **Whitelisted Tokens:** Restricts listings and purchases to whitelisted tokens.
- **SoulBound NFTs:** Access to certain marketplace functionalities is gated by SoulBound NFTs.
- **Bulk Operations:** Supports bulk listing and buying operations.
- **Flexible Initialization:** Configurable platform fees, admin roles, and native token wrappers.

## Prerequisites

- **Solidity 0.8.x**
- **Node.js v14+**
- **Hardhat**
- **OpenZeppelin Contracts**

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/marketplace-contract.git
   cd marketplace-contract
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Compile the contracts:**

   ```bash
   npx hardhat compile
   ```

4. **Run tests:**

   ```bash
   npx hardhat test
   ```

## Usage

### Deployment

1. **Setup environment variables** for deployment (e.g., private keys, Infura API keys) in a `.env` file.

2. **Deploy the contract:**

   ```bash
   npx hardhat ignition deploy ./ignition/modules/filename.ts --network <your-network>
   ```

3. **Initialize the contract:**

   Call the `initialize` function with appropriate parameters after deployment.

### Interacting with the Contract

- **Create Listing:**

  To list an NFT for sale:

  ```solidity
  function createListing(ListingParameters memory _params) external;
  ```

- **Buy NFTs:**

  To purchase an NFT:

  ```solidity
  function buy(uint256 _listingId, address _buyFor, uint256 _quantityToBuy, address _currency, uint256 _totalPrice) external payable;
  ```

- **Bulk Operations:**

  List or buy multiple NFTs in one transaction:

  ```solidity
  function createMultipleListing(BulkListingParameters memory _params) external;
  function bulkBuy(uint256[] memory _listingIds, address _buyFor, uint256[] memory _quantityToBuy, address _currency, uint256[] memory _totalPrice) external payable;
  ```

## Smart Contract Details

### Initialization

The `initialize` function configures the contract with the admin role, platform fees, and SoulBound NFT address.

```solidity
function initialize(address _defaultAdmin, address _platformFeeRecipient, uint256 _platformFeeBps, address _nativeTokenWrapper, address _soulBoundNftAddress) external;
```

### Listing NFTs

- **Single Listing:**

  Use `createListing` to list a single NFT for sale.

- **Bulk Listing:**

  Use `createMultipleListing` for listing multiple NFTs at once.

### Buying NFTs

- **Single Purchase:**

  Use `buy` to purchase a listed NFT.

- **Bulk Purchase:**

  Use `bulkBuy` to buy multiple NFTs in one transaction.

### Access Control

The contract uses `AccessControlEnumerableUpgradeable` for role-based access control. The admin can whitelist tokens and set platform fees.

## Security Considerations

- **Reentrancy Protection:** The contract uses `ReentrancyGuardUpgradeable` to protect against reentrancy attacks.
- **Access Control:** Only authorized users with the appropriate roles can whitelist tokens and set platform fees.
- **SoulBound NFTs:** Certain functions are gated by the possession of SoulBound NFTs, ensuring that only eligible users can perform these operations.

## License

This project is licensed under the MIT License.
