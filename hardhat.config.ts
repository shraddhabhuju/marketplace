import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
require("dotenv").config("/.env");

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    bsc_test: {
      url: `https://data-seed-prebsc-1-s1.binance.org:8545/`,
      accounts: [
        process.env.PRIVATE_KEY_ONE ?? "",
        process.env.PRIVATE_KEY_TWO ?? "",
        process.env.PRIVATE_KEY_THREE ?? "",
      ],
    },

    sepolia: {
      url: `https://sepolia.infura.io/v3/47bc237b4e71471fb95b29282edefc4f`,
      accounts: [
        process.env.PRIVATE_KEY_ONE ?? "",
        process.env.PRIVATE_KEY_TWO ?? "",
        process.env.PRIVATE_KEY_THREE ?? "",
      ],
    },
  },
};

export default config;
