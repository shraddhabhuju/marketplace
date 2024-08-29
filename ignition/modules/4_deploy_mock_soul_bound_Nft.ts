import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SoulBoundModule = buildModule("SoulBoundModule", (m) => {

    const signer =  "0xf6ff4c6028dfea5836eaa89377d6ad4622e3ab5d"

  const  soulboundNft = m.contract("MyTokenNFT", [signer]);

  return { soulboundNft };
});

export default SoulBoundModule;
