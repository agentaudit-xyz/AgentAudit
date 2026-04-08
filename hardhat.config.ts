import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY ?? "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    mantleSepolia: {
      url: "https://rpc.sepolia.mantle.xyz",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 5003,
    },
    mantle: {
      url: "https://rpc.mantle.xyz",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 5000,
    },
    arbitrumSepolia: {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 421614,
    },
    arbitrumOne: {
      url: "https://arb1.arbitrum.io/rpc",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 42161,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
