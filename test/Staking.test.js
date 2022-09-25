const { expect } = require("chai");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

describe("Staking", () => {
    async function deployStakingFixture() {
        const seedEther = ethers.utils.parseEther("90");
        const ethUsdPrice = 132856;
        const [owner, otherAccount] = await ethers.getSigners(); //ethers is availble in global scope in hardhat

        const Staking = await ethers.getContractFactory("Staking"); //By default contracts uses first account to depoly
        const staking = await Staking.deploy(ethUsdPrice, { value: seedEther });
        await staking.deployed();

        const Chainlink = await ethers.getContractFactory("Chainlink", otherAccount);
        const chainlink = await Chainlink.deploy();
        await chainlink.deployed();

        await staking.connect(owner).addToken("Chainlink", "LINK", chainlink.address, 765, 1500);
        await chainlink
            .connect(otherAccount)
            .approve(staking.address, ethers.utils.parseEther("100"));
        await staking.connect(otherAccount).stakeToken("LINK", ethers.utils.parseEther("100"));

        return { staking, chainlink, owner, otherAccount };
    }

    describe("addToken", () => {
        it("should add a token symbol", async () => {
            const { staking } = await loadFixture(deployStakingFixture);
            const tokenSymbols = await staking.getTokenSymbols();
            expect(tokenSymbols).to.eql(["LINK"]);
        });

        it("should add token information", async () => {
            const { staking, chainlink } = await loadFixture(deployStakingFixture);
            const token = await staking.getToken("LINK");

            expect(token.tokenId).to.equal(1);
            expect(token.name).to.equal("Chainlink");
            expect(token.symbol).to.equal("LINK");
            expect(token.contractAddress).to.equal(chainlink.address);
            expect(token.usdPrice).to.equal(765);
            expect(token.ethPrice).to.equal(0);
            expect(token.apy).to.equal(1500);
        });

        it("should increments currentTokenId", async () => {
            const { staking } = await loadFixture(deployStakingFixture);
            expect(await staking.currentTokenId()).to.equal(2);
        });
    });

    describe("stakeToken", () => {
        it("should transfers tokens", async () => {
            const { staking, chainlink, otherAccount } = await loadFixture(deployStakingFixture);
            const signerBalance = await chainlink.balanceOf(otherAccount.address);
            expect(signerBalance).to.equal(ethers.utils.parseEther("4900"));
            const contractBalance = await chainlink.balanceOf(staking.address);
            expect(contractBalance).to.equal(ethers.utils.parseEther("100"));
        });

        it("should creates a position", async () => {
            const { staking, otherAccount } = await loadFixture(deployStakingFixture);
            const positionIds = await staking.connect(otherAccount).getPositionIdsForAddress();
            expect(positionIds.length).to.equal(1);

            const position = await staking.connect(otherAccount).getPositionById(positionIds[0]);

            expect(position.positionId).to.equal(1);
            expect(position.walletAddress).to.equal(otherAccount.address);
            expect(position.name).to.equal("Chainlink");
            expect(position.symbol).to.equal("LINK");
            expect(position.apy).to.equal(1500);
            expect(position.tokenQuantity).to.equal(ethers.utils.parseEther("100"));
            expect(position.open).to.equal(true);
        });

        it("should increments positionId", async () => {
            const { staking } = await loadFixture(deployStakingFixture);
            expect(await staking.currentPositionId()).to.equal(2);
        });
        it("should increases total amount of staked token", async () => {
            const { staking } = await loadFixture(deployStakingFixture);
            expect(await staking.stakedTokens("LINK")).to.equal(ethers.utils.parseEther("100"));
        });
    });

    describe("calculateInterest", () => {
        it("should returns interest accrued to a position", async () => {
            const { staking } = await loadFixture(deployStakingFixture);
            const apy = 1500;
            const value = ethers.utils.parseEther("100");
            const days = 365;

            const interestRate = await staking.calculateInterest(apy, value, days);
            expect(String(interestRate)).to.equal(String(ethers.utils.parseEther("15")));
        });
    });

    describe("closePosition", () => {
        it("should returns tokens to wallet", async () => {
            const { staking, chainlink, otherAccount } = await loadFixture(deployStakingFixture);
            const block = await ethers.provider.getBlock();
            const newCreatedDate = block.timestamp + 86400 * 365;
            await time.increaseTo(newCreatedDate);
            await staking.connect(otherAccount).closePosition(1);
            const signerBalance = await chainlink.balanceOf(otherAccount.address);
            expect(signerBalance).to.equal(ethers.utils.parseEther("5000"));
            const contractBalance = await chainlink.balanceOf(staking.address);
            expect(contractBalance).to.equal(ethers.utils.parseEther("0"));
        });

        it("should sends ether interest to wallet", async () => {
            const { staking, otherAccount } = await loadFixture(deployStakingFixture);
            const contractEthbalanceBefore = await ethers.provider.getBalance(staking.address);
            const signerEthBalanceBefore = await ethers.provider.getBalance(otherAccount.address);

            const block = await ethers.provider.getBlock();
            const newCreatedDate = block.timestamp + 86400 * 365;
            await time.increaseTo(newCreatedDate);

            //const position = await staking.connect(otherAccount).getPositionById(1);
            //const diffdate = await staking.calculateNumberDays(position.createdDate);
            //console.log(position.ethValue);

            await staking.connect(otherAccount).closePosition(1);

            const contractEthBalanceAfter = await ethers.provider.getBalance(staking.address);
            const signerEthBalanceAfter = await ethers.provider.getBalance(otherAccount.address);
            expect(contractEthBalanceAfter).to.be.below(contractEthbalanceBefore);
            expect(signerEthBalanceAfter).to.be.above(signerEthBalanceBefore);
        });

        it("should closes position", async () => {
            const { staking, otherAccount } = await loadFixture(deployStakingFixture);

            const block = await ethers.provider.getBlock();
            const newCreatedDate = block.timestamp + 86400 * 365;
            await time.increaseTo(newCreatedDate);
            await staking.connect(otherAccount).closePosition(1);

            const position = await staking.connect(otherAccount).getPositionById(1);
            expect(position.open).to.equal(false);
        });
    });
});
