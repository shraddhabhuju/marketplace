import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ZeroAddress } from "ethers";
import { deployMarketplace } from "../../test/utils";
import { ethers } from "hardhat";

// const MarketplaceModule = buildModule("MarketplaceModule", (m) => {
//   const _defaultAdmin = "0xf6ff4c6028dfea5836eaa89377d6ad4622e3ab5d";
//   const _platformFeeRecipient = "0xf6ff4c6028dfea5836eaa89377d6ad4622e3ab5d";
//   const _platformFeeBps = 500;
//   const _nativeTokenWrapper = ZeroAddress;
//   const _soulBoundNftAddress = "0x0fBa28bEEDaF796d48B905BD8CEE897A358EE15E";
//   const proxyAdminOwner = m.getAccount(0);
//   const marketplace = m.contract("Marketplace", [
//     _defaultAdmin,
//     _platformFeeRecipient,
//     _platformFeeBps,
//     _nativeTokenWrapper,
//     _soulBoundNftAddress,
//   ]);

//   const proxy = m.contract("TransparentUpgradeableProxy", [
//     marketplace,
//     proxyAdminOwner,
//     "0x"

//   ]);

//   return { proxy };
// });

// export default MarketplaceModule;

async function main() {
  const [deployer] = await ethers.getSigners();

  const _defaultAdmin = "0xf6ff4c6028dfea5836eaa89377d6ad4622e3ab5d";
  const _platformFeeRecipient = "0xf6ff4c6028dfea5836eaa89377d6ad4622e3ab5d";
  const _platformFeeBps = 500;
  const _nativeTokenWrapper = ZeroAddress;
  const _soulBoundNftAddress = "0x0fBa28bEEDaF796d48B905BD8CEE897A358EE15E";

  const MarketplaceDeploy = await deployMarketplace(
    deployer,
    _defaultAdmin,
    _platformFeeRecipient,
    _soulBoundNftAddress
  );

  console.log("Marketplace  Deployed to address:", MarketplaceDeploy);

}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
