// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Staking is Ownable {
    uint256 public currentTokenId = 1;

    struct Token {
        uint256 tokenId;
        string name;
        string symbol;
        address contractAddress;
        uint256 usdPrice;
        uint256 ethPrice;
        uint256 apy;
    }

    struct Position {
        uint256 positionId;
        address walletAddress;
        string name;
        string symbol;
        uint256 createdDate;
        uint256 apy;
        uint256 tokenQuantity;
        uint256 usdValue;
        uint256 ethValue;
        bool open;
    }

    uint256 public ethUsdPrice;
    string[] public tokenSymbols;
    mapping(string => Token) public tokens; // mapping from symbol to Token struct

    uint256 public currentPositionId = 1;
    mapping(uint256 => Position) public positions;

    mapping(address => uint256[]) public positionIdsByAddress;

    mapping(string => uint256) public stakedTokens; // tracks all quanity of tokens

    constructor(uint256 _currentEthPrice) payable {
        ethUsdPrice = _currentEthPrice;
    }

    function addToken(
        string calldata name,
        string calldata symbol,
        address contractAddress,
        uint256 usdPrice,
        uint256 apy
    ) external onlyOwner {
        tokenSymbols.push(symbol);
        tokens[symbol] = Token(
            currentTokenId,
            name,
            symbol,
            contractAddress,
            usdPrice,
            usdPrice / ethUsdPrice,
            apy
        );

        currentTokenId += 1;
    }

    function getTokenSymbols() public view returns (string[] memory) {
        return tokenSymbols;
    }

    function getToken(string calldata tokenSymbol) public view returns (Token memory) {
        return tokens[tokenSymbol];
    }

    function stakeToken(string calldata tokenSymbol, uint256 tokenAmount) external {
        require(tokens[tokenSymbol].tokenId != 0, "This token is not allowed to stake!");
        IERC20(tokens[tokenSymbol].contractAddress).transferFrom(
            msg.sender,
            address(this),
            tokenAmount
        );

        positions[currentPositionId] = Position(
            currentPositionId,
            msg.sender,
            tokens[tokenSymbol].name,
            tokenSymbol,
            block.timestamp,
            tokens[tokenSymbol].apy,
            tokenAmount,
            tokens[tokenSymbol].usdPrice * tokenAmount,
            (tokens[tokenSymbol].usdPrice * tokenAmount) / ethUsdPrice,
            true
        );

        positionIdsByAddress[msg.sender].push(currentPositionId);
        currentPositionId += 1;
        stakedTokens[tokenSymbol] += tokenAmount;
    }

    function getPositionIdsForAddress() external view returns (uint256[] memory) {
        return positionIdsByAddress[msg.sender];
    }

    function getPositionById(uint256 positionId) external view returns (Position memory) {
        return positions[positionId];
    }

    function calculateInterest(
        uint256 apy,
        uint256 value,
        uint256 numberDays
    ) public pure returns (uint256) {
        return (apy * value * numberDays) / 10000 / 365;
    }

    function closePosition(uint256 positionId) external {
        require(positions[positionId].walletAddress == msg.sender, "You are not owner");
        require(positions[positionId].open, "Position is already withdrawn");
        positions[positionId].open = false;

        IERC20(tokens[positions[positionId].symbol].contractAddress).transfer(
            msg.sender,
            positions[positionId].tokenQuantity
        );
        stakedTokens[positions[positionId].symbol] -= positions[positionId].tokenQuantity;

        uint256 numOfDays = calculateNumberDays(positions[positionId].createdDate);

        uint256 weiAmount = calculateInterest(
            positions[positionId].apy,
            positions[positionId].ethValue,
            numOfDays
        );
        (bool sent, ) = payable(msg.sender).call{value: weiAmount}("");
        require(sent, "Transaction Failed");
    }

    function calculateNumberDays(uint256 createdDate) public view returns (uint256) {
        return (block.timestamp - createdDate) / 60 / 60 / 24;
    }

    function modifyCreatedDate(uint256 positionId, uint256 newCreatedDate) public onlyOwner {
        positions[positionId].createdDate = newCreatedDate;
    }
}
