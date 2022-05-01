const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token", function () {
  let Token;
  let tokenContract;
  let creator;
  let addr1;

  beforeEach(async function () {
    Token = await ethers.getContractFactory("Token");
    [creator, addr1] = await ethers.getSigners();
    tokenContract = await Token.deploy("Bigblackcoin", "BBC", 18);
    await tokenContract.deployed();
    await tokenContract.mint(creator.address, ethers.utils.parseUnits("2", 18));
  });

  it("Creation: should deploy the contract", async function () { 
    await tokenContract;
    expect((await tokenContract.address));
  });

  it("Creation: should check if the contract data is correct", async function () {
    expect(await tokenContract.tokenName()).to.equal("Bigblackcoin");
    expect(await tokenContract.tokenSymbol()).to.equal("BBC");
    expect(await tokenContract.tokenDecimals()).to.equal(18);
    expect(await tokenContract.tokenTotalSupply()).to.equal(ethers.utils.parseUnits("2", 18));
  });
  
  it("Transactions: should transfer 1 BBC token to addr1", async function () {
    initialBalance = await tokenContract.balanceOf(addr1.address);
    await tokenContract.transfer(addr1.address, ethers.utils.parseUnits("1", 18));

    finalBalance = await tokenContract.balanceOf(addr1.address);
    expect((finalBalance - initialBalance).toString()).to.equal(
      ethers.utils.parseUnits("1", 18).toString());
  });

  it("Transactions: should FAIL to transfer 420 BBC tokens to addr1 (insufficient balance)", async function () {
    await tokenContract.transfer(addr1.address, ethers.utils.parseUnits("420", 18));
  });

  it("Transactions: should transfer 1 BBC token from addr1 to owner", async function () {
    await tokenContract.transfer(addr1.address, ethers.utils.parseUnits("1", 18));
    await tokenContract.connect(addr1).approve(
      creator.address, ethers.utils.parseUnits("1", 18));
    await tokenContract.transferFrom(
      addr1.address, creator.address, ethers.utils.parseUnits("1", 18))

    expect(await tokenContract.allowance(addr1.address, creator.address)).to.equal(0);
  });

  it("Transactions: should FAIL to transfer 420 BBC tokens from addr1 to creator (insufficient balance)", async function () {
    await tokenContract.transferFrom(addr1.address, creator.address, ethers.utils.parseUnits("420", 18));
  });

  it("Approval: should approve 1 BBC token", async function () {
    await tokenContract.connect(addr1).approve(
      creator.address, ethers.utils.parseUnits("1", 18));
    expect(await tokenContract.allowance(addr1.address, creator.address)).to.equal(
      ethers.utils.parseUnits("1", 18));
  });

  it("Minting: should mint 4 BBC tokens", async function () {
    await tokenContract.mint(creator.address, ethers.utils.parseUnits("4", 18));
    totalSupply = (await tokenContract.tokenTotalSupply()).toString();
    expect(totalSupply).to.equal(ethers.utils.parseUnits("6", 18).toString());
  });

  it("Minting: should FAIL to mint 4 BBC tokens from non-owner address", async function () {
    await tokenContract.connect(addr1).mint(creator.address, ethers.utils.parseUnits("4", 18));
  });

  it("Burning: should burn 1 BBC token", async function () {
    await tokenContract.burn(creator.address, ethers.utils.parseUnits("1", 18));
    totalSupply = (await tokenContract.tokenTotalSupply()).toString();
    expect(totalSupply).to.equal(ethers.utils.parseUnits("1", 18));
  });

  it("Burning: should FAIL to burn 1 BBC token from non-owner address", async function () {
    await tokenContract.mint(creator.address, ethers.utils.parseUnits("1", 18));
    await tokenContract.connect(addr1).burn(creator.address, ethers.utils.parseUnits("1", 18));
  });

  it("Burning: should FAIL burning 100 BBC token (insufficient balance)", async function () {
    await tokenContract.burn(creator.address, ethers.utils.parseUnits("100", 18));
  });
});