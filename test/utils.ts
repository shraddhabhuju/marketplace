// deploy erc721 token

import { getContractFactory } from "@nomicfoundation/hardhat-ethers/types";
import { Signer } from "ethers";
import hre, { upgrades } from "hardhat";
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
async function deployMarketplace(
  owner: Signer,
  ownerAddress: string,
  platformFeeRecipient: string,
  SoulBoundNftTokenAddress:string
) {
  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const MarketplaceDeploy = await upgrades.deployProxy(
    Marketplace,
    [ownerAddress, platformFeeRecipient, 500, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",SoulBoundNftTokenAddress],
    { initializer: "initialize" }
  );
  await MarketplaceDeploy.waitForDeployment()

  return MarketplaceDeploy;
}

async function whitelistTokens(
  Marketplace: Marketplace,
  signer: Signer,
  tokens: string[],
  status: boolean[]
) {
  console.log("🚀 ~ signer:", signer)

  const whitelistTokenTx = await Marketplace.connect(signer).updateWhitelistedCurrency(
    tokens,
    status
  );
  await whitelistTokenTx.wait();
  return whitelistTokenTx;
}

async function grantWhitelisterRole(
  Marketplace: Marketplace,
  owner: Signer,
  whitelister: string
) {
  const grantRole = await Marketplace.connect(owner).setCurrencyWhitelister(
    whitelister
  );
  await grantRole.wait();
}

export {
  deployErc20Token,
  deployErc721Token,
  deployErc1155Token,
  whitelistTokens,
  deployMarketplace,
  grantWhitelisterRole,
};
