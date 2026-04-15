require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    arbitrumSepolia: {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: ["0x5fd660240ea63acd32a3fbeb1d1216b32f4d868157bb279f483822bc02485bd2"],
      chainId: 421614,
    },
  },
};