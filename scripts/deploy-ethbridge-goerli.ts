import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployEthereumBridgeGoerli = async(args: any, hre: HardhatRuntimeEnvironment) => {
  const [deployer] = await ethers.getSigners();
  console.log("Depoying with address: " + deployer.address + "\n" + "Balance: " + (await deployer.getBalance()).toString());

  const EthereumBrdige = await ethers.getContractFactory("EthereumBridge");
  const ethBridge = await EthereumBrdige.deploy();
  await ethBridge.deployed();

  console.log("EthereumBrdige deployed to: " + ethBridge.address);

  console.log("Wait 60 seconds for verification");
  await new Promise(f => setTimeout(f, 60000));

  await hre.run("verify:verify", {
    address: ethBridge.address,
    constructorArguments: [],
  });
}

export default deployEthereumBridgeGoerli;