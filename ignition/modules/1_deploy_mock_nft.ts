import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const NFTModule = buildModule("NFTModule", (m) => {
  const signer = "0xf6ff4c6028dfea5836eaa89377d6ad4622e3ab5d";
  const nft = m.contract("MyTokenNFT", [signer]);

  return { nft };
});

export default NFTModule;
