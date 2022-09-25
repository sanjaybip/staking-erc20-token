# Solidity Smart Contract For Staking ERC20 Token

This is a smart contract coded in `Solidity` allowing user to stakes any pre-approved ERC20 token and earn interest in `Ether` .

Contract owner can add ERC20 token which is allowed to stake by users. To add a token, contract owner need to provide its name, symbol, contract address, USD price and APY.

While deploying contract, contract owner need to provide some Ether so that contract can pay Ether as interest for staking ERC20 tokens by the user.

User can stake tokens which are added by the contract owner and can earn interest in the form of ether.

User can close their position at anytime and they will get their deposited ERC20 token back along with interest in Ether for the number of days they have staked the it.

I have also made a demo [react frontend](https://github.com/sanjaydefidev/stake-erc20-frontend) that interact with this smart contract.

The deploy script contains some demo data, which you should remove before deploying to mainnet

---

## Run these commands

### To install all the dependencies

```shell
yarn install
```
### Compile code
```shell
yarn hardhat compile
```
### Running Tests
```shell
yarn hardhat test
```
### Running localhost hardhat blockchain network
```shell
yarn hardhat node
```
### Deploying
```shell
yarn hardhat run ./scripts/deploy.js
```
