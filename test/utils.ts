// deploy erc721 token

import { getContractFactory } from "@nomicfoundation/hardhat-ethers/types";
import { Signer } from "ethers";
import hre from "hardhat";
import { Marketplace } from "../typechain-types";

// create listing
// update listing
// cancel listing
// buy from listing

// deploy erc20 token
async function deployErc20Token(owner: Signer, ownerAddress: string) {
  const Token = await hre.ethers.getContractFactory("MyToken");
  const TokenDeploy = await Token.connect(owner).deploy(ownerAddress);
  return TokenDeploy;
}
// deploy erc721 token
async function deployErc721Token(owner: Signer, ownerAddress: string) {
  const Token = await hre.ethers.getContractFactory("MyTokenNFT");
  const TokenDeploy = await Token.connect(owner).deploy(ownerAddress);
  return TokenDeploy;
}
//deploy erc 1155 token
async function deployErc1155Token(owner: Signer, ownerAddress: string) {
  const Token = await hre.ethers.getContractFactory("SemiFungible");
  const TokenDeploy = await Token.connect(owner).deploy(ownerAddress);
  return TokenDeploy;
}

//deploy markteplace contract
async function deployMarketplace(owner: Signer, ownerAddress: string) {
  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const MarketplaceDeploy = await Marketplace.connect(owner).deploy(
    ownerAddress
  );
  return MarketplaceDeploy;
}

async function whitelistTokens(
  Marketplace: Marketplace,
  signer: Signer,
  tokens: string[],
  status: boolean[]
) {
  const whitelistTokenTx = await Marketplace.updateWhitelistedTokens(
    tokens,
    status
  );
  await whitelistTokenTx.wait();
  return whitelistTokenTx;
}

export {
  deployErc20Token,
  deployErc721Token,
  deployErc1155Token,
  whitelistTokens,
  deployMarketplace,
};
