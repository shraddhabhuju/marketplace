import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ERC1155Module = buildModule("ERC1155Module", (m) => {

    const signer =  "0xf6ff4c6028dfea5836eaa89377d6ad4622e3ab5d"

  const  erc1155 = m.contract("SemiFungible", [signer], );

  return { erc1155 };
});

export default ERC1155Module;
