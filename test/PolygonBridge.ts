import { expect } from "chai";
import { ethers } from "hardhat";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import BaseTokenABI from "./../artifacts/contracts/BaseToken.sol/BaseToken.json";
import { BaseToken, PolygonBridge } from "../typechain-types";
import getPermitSignature from "./utils";

const signAndClaim = async (owner: SignerWithAddress, amount: string, signMessage: string) => {
    const tokenAmount = ethers.utils.parseUnits(amount, 18);
    const messageHash = ethers.utils.solidityKeccak256(['string'], [signMessage]);
    const arrayfiedHash = ethers.utils.arrayify(messageHash);
    const signature = await owner.signMessage(arrayfiedHash);

    const sig = ethers.utils.splitSignature(signature);
    const [v, r, s] = [sig.v, sig.r, sig.s];
    return { tokenAmount, messageHash, v, r, s };
}

describe("PolygonBridge", function () {

    let token: BaseToken;

    let bridgeFactory: any;
    let bridge: PolygonBridge;

    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;

    beforeEach(async () => {
        [owner, addr1] = await ethers.getSigners();

        const ERC20Contract = await ethers.getContractFactory("BaseToken");
        token = await ERC20Contract.deploy("Gosho", "GOTKN", ethers.utils.parseUnits("10000", 18));
        await token.deployed();

        bridgeFactory = await ethers.getContractFactory("PolygonBridge");
        bridge = await bridgeFactory.deploy();
        await bridge.deployed();
    });
    
    it("Should throw when trying to claim tokens with an unsigned/wrong message", async function () {
        const { tokenAmount, messageHash, v, r, s} = await signAndClaim(owner, "5000", "signed message to claim tokens");
        
        await expect(bridge.connect(addr1).
            claimTokens(token.address, await token.name(), await token.symbol(), tokenAmount, messageHash, v, r, s))
            .to.be.revertedWith("The message was not signed by the caller");
    });

    it("Should deploy new token on Claim when one is not existing", async function () {
        const {tokenAmount, messageHash, v, r, s} = await signAndClaim(owner, "5000", "signed message to claim tokens");

        const claimTx = await bridge.claimTokens(token.address, await token.name(), await token.symbol(), tokenAmount, messageHash, v, r, s);
        claimTx.wait();

        // check new token with W (wrapped)
        const wrappedTokenAddress = await bridge.getTargetTokenFromSource(token.address);
        const wrappedToken = new ethers.Contract(wrappedTokenAddress, BaseTokenABI.abi, owner);
        expect(await wrappedToken.name()).to.be.equal("WGosho");
        expect(await wrappedToken.symbol()).to.be.equal("WGOTKN");
        
        // check token transfer 
        expect(await wrappedToken.balanceOf(owner.address)).to.be.equal(tokenAmount);

        // check is token on network
        expect(await bridge.isTokenOnNetwork(token.address)).to.be.equal(true);

        // should get source token address from target token address
        expect(await bridge.getSourceTokenFromTarget(wrappedToken.address)).to.be.equal(token.address);

        // check event emitted
        await expect(claimTx).to.emit(bridge, 'DeployedNewToken').withArgs("WGosho", "WGOTKN", tokenAmount);
    });

    it("Should mint new tokens on Claim when there's already deployed one", async function () {
        const {tokenAmount, messageHash, v, r, s} = await signAndClaim(owner, "5000", "signed message to claim tokens");
        const claimDeployTx = await bridge.claimTokens(token.address, await token.name(), await token.symbol(), tokenAmount, messageHash, v, r, s);

        // check new token with W (wrapped)
        const wrappedTokenAddress = await bridge.getTargetTokenFromSource(token.address);
        const wrappedToken = new ethers.Contract(wrappedTokenAddress, BaseTokenABI.abi, owner);
        
        // check mint
        const claimMintTx = await bridge.claimTokens(token.address, await token.name(), await token.symbol(), tokenAmount, messageHash, v, r, s);
        claimMintTx.wait();

        const EXPECTED_TOTAL_AMOUNT = ethers.utils.parseUnits("10000", 18);
        expect(await wrappedToken.totalSupply()).to.be.equal(EXPECTED_TOTAL_AMOUNT);

        // check transfer 
        const EXPECTED_ACCOUNT_AMOUNT = ethers.utils.parseUnits("10000", 18);
        expect(await wrappedToken.balanceOf(owner.address)).to.be.equal(EXPECTED_ACCOUNT_AMOUNT);

        // emit event 
        await expect(claimMintTx).to.emit(bridge, 'MintTokens').withArgs("WGosho", "WGOTKN", tokenAmount);
    });

    it("Should destroy tokens", async function () {
        const {tokenAmount, messageHash, v, r, s} = await signAndClaim(owner, "5000", "signed message to claim tokens");
        const claimDeployTx = await bridge.claimTokens(token.address, await token.name(), await token.symbol(), tokenAmount, messageHash, v, r, s);
        claimDeployTx.wait();

        const wrappedTokenAddress = await bridge.getTargetTokenFromSource(token.address);
        const wrappedToken = new ethers.Contract(wrappedTokenAddress, BaseTokenABI.abi, owner);

        // check burn
        const AMOUNT_TO_BE_DESTROYED = ethers.utils.parseUnits("3000", 18);
        const deadline = ethers.constants.MaxUint256;
        const {v: vD, r: rD, s: sD} = await getPermitSignature(owner, wrappedToken, bridge.address, AMOUNT_TO_BE_DESTROYED, deadline);
        const destroyTokensTx = await bridge.destroyTokens(wrappedToken.address, AMOUNT_TO_BE_DESTROYED, deadline, vD, rD, sD);

        const AMOUNT_TO_BE_LEFT = ethers.utils.parseUnits("2000", 18);
        expect(await wrappedToken.balanceOf(owner.address)).to.be.equal(AMOUNT_TO_BE_LEFT);

        // check emit event
        await expect(destroyTokensTx).to.emit(bridge, 'BurntTokens').withArgs("WGosho", "WGOTKN", AMOUNT_TO_BE_DESTROYED);
    });

    it("Should throw when trying to burn more tokens than total supply", async function () {
        const {tokenAmount, messageHash, v, r, s} = await signAndClaim(owner, "5000", "signed message to claim tokens");
        const claimDeployTx = await bridge.claimTokens(token.address, await token.name(), await token.symbol(), tokenAmount, messageHash, v, r, s);
        claimDeployTx.wait();

        const wrappedTokenAddress = await bridge.getTargetTokenFromSource(token.address);
        const wrappedToken = new ethers.Contract(wrappedTokenAddress, BaseTokenABI.abi, owner);

        // should throw when trying to burn more tokens than total supply
        const AMOUNT_TO_BE_DELETED = ethers.utils.parseUnits("5001", 18);
        const deadline = ethers.constants.MaxUint256;
        const {v: vD, r: rD, s: sD} = await getPermitSignature(owner, wrappedToken, bridge.address, AMOUNT_TO_BE_DELETED, deadline);
        
        await expect(bridge.destroyTokens(wrappedToken.address, AMOUNT_TO_BE_DELETED, deadline, vD, rD, sD))
            .to.be.revertedWith("Can't destroy more tokens than the total supply");
    });

    it("Should throw if user doesn't have enough tokens to burn", async function () {
        const {tokenAmount, messageHash, v, r, s} = await signAndClaim(owner, "5000", "signed message to claim tokens");
        const claimDeployTx = await bridge.claimTokens(token.address, await token.name(), await token.symbol(), tokenAmount, messageHash, v, r, s);
        claimDeployTx.wait();

        const wrappedTokenAddress = await bridge.getTargetTokenFromSource(token.address);
        const wrappedToken = new ethers.Contract(wrappedTokenAddress, BaseTokenABI.abi, owner);

        const AMOUNT_TO_BE_DELETED = ethers.utils.parseUnits("500", 18);
        const deadline = ethers.constants.MaxUint256;
        const {v: vD, r: rD, s: sD} = await getPermitSignature(owner, wrappedToken, bridge.address, AMOUNT_TO_BE_DELETED, deadline);
        
        await expect(bridge.connect(addr1).destroyTokens(wrappedToken.address, AMOUNT_TO_BE_DELETED, deadline, vD, rD, sD))
            .to.be.revertedWith("Owner doesn't have enough tokens to destroy");
    });

});
