import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployPolygonBridgeMumbai = async(args: any, hre: HardhatRuntimeEnvironment) => {
  const [deployer] = await ethers.getSigners();
  console.log("Depoying with address: " + deployer.address + "\n" + "Balance: " + (await deployer.getBalance()).toString());

  const PolygonBrdige = await ethers.getContractFactory("PolygonBridge");
  const polygonBridge = await PolygonBrdige.deploy();
  await polygonBridge.deployed();

  console.log("PolygonBrdige deployed to: " + polygonBridge.address);

  console.log("Wait 60 seconds for verification");
  await new Promise(f => setTimeout(f, 60000));

  await hre.run("verify:verify", {
    address: polygonBridge.address,
    constructorArguments: [],
  });
}

export default deployPolygonBridgeMumbai;