import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployERC20TokenGoerli = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [deployer] = await ethers.getSigners();
  console.log("Depoying with address: " + deployer.address + "\n" + "Balance: " + (await deployer.getBalance()).toString());

  await deployERC20Token(args.name, args.symbol, args.amount, hre);

}

const deployERC20Token = async (name: string, symbol: string, amount: string, hre: HardhatRuntimeEnvironment) => {
  const formatAmount = ethers.utils.parseUnits(amount, 18).toString();
  const ERC20Contract = await ethers.getContractFactory("BaseToken");
  const contract = await ERC20Contract.deploy(name, symbol, formatAmount);
  await contract.deployed();
  console.log("BaseToken", "deployed to:", contract.address);

  console.log("Wait 60 seconds for verification");
  await new Promise(f => setTimeout(f, 60000));


  await hre.run("verify:verify", {
    address: contract.address,
    constructorArguments: [
      name,
      symbol,
      formatAmount
    ],
  });
}

export default deployERC20TokenGoerli;