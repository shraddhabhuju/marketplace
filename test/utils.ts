// deploy erc721 token

import { getContractFactory } from "@nomicfoundation/hardhat-ethers/types";
import { Signer, ZeroAddress } from "ethers";
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

async function deployErc1400Token(owner: Signer, ownerAddress: string) {
  const partitionFlag =
    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"; // Flag to indicate a partition change
  const otherFlag =
    "0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd"; // Other flag
  const partition1_short =
    "7265736572766564000000000000000000000000000000000000000000000000"; // reserved in hex
  const partition2_short =
    "6973737565640000000000000000000000000000000000000000000000000000"; // issued in hex
  const partition3_short =
    "6c6f636b65640000000000000000000000000000000000000000000000000000"; // locked in hex
  const changeToPartition1 = partitionFlag.concat(partition1_short);
  const changeToPartition2 = partitionFlag.concat(partition2_short);
  const changeToPartition3 = partitionFlag.concat(partition3_short);
  const doNotChangePartition = otherFlag.concat(partition2_short);
  const partition1 = "0x".concat(partition1_short);
  const partition2 = "0x".concat(partition2_short);
  const partition3 = "0x".concat(partition3_short);
  const ZERO_BYTES32 =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  const partitions = [partition1, partition2, partition3];
  const reversedPartitions = [partition3, partition1, partition2];

  const documentName =
    "0x446f63756d656e74204e616d6500000000000000000000000000000000000000";

  const issuanceAmount = BigInt(
    "100000000000000000000000000000000000000000000000000000"
  );
  const ERC1830 = await hre.ethers.getContractFactory("ERC1820Registry");
  const ERC1830Deploy = await ERC1830.deploy();
  const ERC1830DeployAddres = await ERC1830Deploy.getAddress();
  const Token = await hre.ethers.getContractFactory("ERC1400");
  console.log("🚀 ~ deployErc1400Token ~ Token:", Token);
  const TokenDeploy = await Token.connect(owner).deploy(
    "Fourteen",
    "FOUR",
    1,
    [ownerAddress],
    partitions,
    ERC1830DeployAddres
  );

  const issueTx = await TokenDeploy.connect(owner).issueByPartition(
    partition1,
    ownerAddress,
    issuanceAmount,
    ZERO_BYTES32
  );
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
  kycSoulBoundNftTokenAddress: string,
  kybSoulBoundNftTokenAddress: string
) {
  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  console.log("🚀 ~ kybSoulBoundNftTokenAddress:", kybSoulBoundNftTokenAddress);

  const MarketplaceDeploy = await upgrades.deployProxy(
    Marketplace,
    [
      ownerAddress,
      platformFeeRecipient,
      500,
      ZeroAddress,
      kycSoulBoundNftTokenAddress,
      kybSoulBoundNftTokenAddress,
    ],
    { initializer: "initialize" }
  );
  await MarketplaceDeploy.waitForDeployment();

  return MarketplaceDeploy;
}

async function whitelistCurrencyTokens(
  Marketplace: Marketplace,
  signer: Signer,
  tokens: string[],
  status: boolean[]
) {
  console.log("🚀 ~ signer:", signer);

  const whitelistTokenTx = await Marketplace.connect(
    signer
  ).updateWhitelistedCurrency(tokens, status);
  await whitelistTokenTx.wait();
  return whitelistTokenTx;
}

async function whitelistListingTokens(
  Marketplace: Marketplace,
  signer: Signer,
  tokens: string[],
  status: boolean[]
) {
  console.log("🚀 ~ signer:", signer);

  const whitelistTokenTx = await Marketplace.connect(
    signer
  ).updateWhitelistedTokens(tokens, status);
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
  deployErc1400Token,
  deployErc1155Token,
  whitelistCurrencyTokens,
  deployMarketplace,
  grantWhitelisterRole,
  whitelistListingTokens,
};
