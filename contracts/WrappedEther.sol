// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WrappedEther is ERC20 {
    constructor() ERC20("WrappedEther", "WETH") {
        _mint(msg.sender, 5000 * 10**18); // minting 5000 LINK token
    }
}
