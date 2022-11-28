import { expect } from "chai";
import { ethers } from "hardhat";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BaseToken } from "../typechain-types";
import { EthereumBridge } from "../typechain-types/contracts/EthereumBridge.sol";

describe("BaseToken", function () {

    let token: BaseToken;

    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;

    beforeEach(async () => {
        [owner, addr1] = await ethers.getSigners();

        const ERC20Contract = await ethers.getContractFactory("BaseToken");
        token = await ERC20Contract.deploy("Gosho", "GOTKN", ethers.utils.parseUnits("10000", 18));
        await token.deployed();
    });
    
    it("Should mint tokens in constructor", async function () {
        const TOKEN_AMOUNT = ethers.utils.parseUnits("10000", 18);
        expect(await token.balanceOf(owner.address)).to.equal(TOKEN_AMOUNT);
    });

    it("Should mint additional tokens", async function () {
        const MINT_TOKEN_AMOUNT = ethers.utils.parseUnits("10000", 18);
        const EXPECTED_TOKEN_AMOUNT = ethers.utils.parseUnits("20000", 18);
        token.mint(MINT_TOKEN_AMOUNT);
        expect(await token.balanceOf(owner.address)).to.equal(EXPECTED_TOKEN_AMOUNT);
    });


});
