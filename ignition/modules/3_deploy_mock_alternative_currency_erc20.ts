import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const alternativeCurrencyModule = buildModule("alternativeCurrencyModule", (m) => {
    const signer =  "0xf6ff4c6028dfea5836eaa89377d6ad4622e3ab5d"

  const  alternativeCurrency = m.contract("MyToken", [signer], );

  return { alternativeCurrency };
});

export default alternativeCurrencyModule;
