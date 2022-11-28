import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig, task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import deployERC20TokenGoerli from "./scripts/deploy-erc20-goerli";
import "hardhat-gas-reporter";

import * as dotenv from "dotenv";
import deployEthereumBridgeGoerli from "./scripts/deploy-ethbridge-goerli";
import deployPolygonBridgeMumbai from "./scripts/deploy-polygonbridge-mumbai";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.17",
      }],
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    }
  },
  networks: {
    goerli: {
      url: process.env.ETHEREUM_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : []
    },
    matic: {
      url: process.env.MUMBAI_RPC_URL,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    }
  },
  etherscan: {
    apiKey: {
      //ethereum
      goerli: process.env.ETHERSCAN_KEY || "",
      //polygon
      polygonMumbai: process.env.POLYGONSCAN_KEY || "",
    }
  },
  gasReporter: {
    enabled: true,
    currency: 'ETH',
  }
};

export default config;

task("deploy-erc20-goerli", "Deploys EthereumToken, EthereumBrdige and PolygonBridge")
  .addParam("name", "Name of the token we want to deploy")
  .addParam("symbol", "Symbol up to 11 characters of the token")
  .addParam("amount", "Amount of the token in ethers")
  .setAction(async (args: any, hre: HardhatRuntimeEnvironment) => {
    await deployERC20TokenGoerli(args, hre);
  });

task("deploy-ethbridge-goerli", "Deploys and verifies EthereumBrdige")
  .setAction(async (args: any, hre: HardhatRuntimeEnvironment) => {
    await deployEthereumBridgeGoerli(args, hre);
  });

task("deploy-polygonbridge-mumbai", "Deploys and verifies PolygonBridge")
  .setAction(async (args: any, hre: HardhatRuntimeEnvironment) => {
    await deployPolygonBridgeMumbai(args, hre);
  });