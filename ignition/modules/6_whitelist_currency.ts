import { ethers } from "hardhat";
import {
  grantWhitelisterRole,
  whitelistCurrencyTokens,
} from "../../test/utils";
var contractJson = require("../../contract.json");

async function main() {
  const [deployer] = await ethers.getSigners();
  const marketplaceContract = contractJson.marketplaceContract;
  const tokenAddresses = ["0x9ADAE808846746223BE9f1cf27E80bF20D2672DB"];
  const status = [true];
  console.log("Interacting contract with the account:", deployer.address);

  const marketplaceContractInstance = await ethers.getContractAt(
    "Marketplace",
    marketplaceContract
  );
  const grantRoleTx = await grantWhitelisterRole(
    marketplaceContractInstance,
    deployer,
    deployer.address
  );

  const whitelistTokenTx = await whitelistCurrencyTokens(
    marketplaceContractInstance,
    deployer,
    tokenAddresses,
    status
  );
  console.log("Token Whitelisted");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
