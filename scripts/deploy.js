// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
    const seedEther = hre.ethers.utils.parseEther("90");
    const ethUsdPrice = 132856;
    const Staking = await hre.ethers.getContractFactory("Staking");
    const staking = await Staking.deploy(ethUsdPrice, { value: seedEther });
    await staking.deployed();

    // creating some demo data to test on front-end for local development
    // remove it on mainnet
    const Chainlink = await hre.ethers.getContractFactory("Chainlink");
    let chainlink = await Chainlink.deploy();

    const Tether = await hre.ethers.getContractFactory("Tether");
    let tether = await Tether.deploy();

    const UsdCoin = await hre.ethers.getContractFactory("UsdCoin");
    let usdCoin = await UsdCoin.deploy();

    const WrappedBitcoin = await hre.ethers.getContractFactory("WrappedBitcoin");
    let wrappedBitcoin = await WrappedBitcoin.deploy();

    const WrappedEther = await hre.ethers.getContractFactory("WrappedEther");
    let wrappedEther = await WrappedEther.deploy();

    await staking.addToken("Chainlink", "LINK", chainlink.address, 765, 1500);
    await staking.addToken("Tether", "USDT", tether.address, 100, 200);
    await staking.addToken("UsdCoin", "USDC", usdCoin.address, 100, 200);
    await staking.addToken("WrappedBitcoin", "WBTC", wrappedBitcoin.address, 1909102, 500);
    await staking.addToken("WrappedEther", "WETH", wrappedEther.address, ethUsdPrice, 1000);

    console.log("Staking:", staking.address);
    console.log("Chainlink:", chainlink.address);
    console.log("Tether:", tether.address);
    console.log("UsdCoin:", usdCoin.address);
    console.log("WrappedBitcoin:", wrappedBitcoin.address);
    console.log("WrappedEther:", wrappedEther.address);

    await chainlink.approve(staking.address, hre.ethers.utils.parseEther("50"));
    await staking.stakeToken("LINK", hre.ethers.utils.parseEther("50"));

    await tether.approve(staking.address, hre.ethers.utils.parseEther("30"));
    await staking.stakeToken("USDT", hre.ethers.utils.parseEther("30"));

    await wrappedBitcoin.approve(staking.address, hre.ethers.utils.parseEther("10"));
    await staking.stakeToken("WBTC", hre.ethers.utils.parseEther("10"));

    await wrappedEther.approve(staking.address, hre.ethers.utils.parseEther("9"));
    await staking.stakeToken("WETH", hre.ethers.utils.parseEther("9"));

    const block = await hre.ethers.provider.getBlock();
    const newCreatedDate = block.timestamp - 86400 * 365;
    await staking.modifyCreatedDate(1, newCreatedDate);
    await staking.modifyCreatedDate(2, newCreatedDate);
    await staking.modifyCreatedDate(3, newCreatedDate);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
