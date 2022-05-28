import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Contract, ContractFactory, providers, BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

describe("Farming", function () {
  let WETH: ContractFactory;
  let weth: Contract;
  let Farming: ContractFactory;
  let farming: Contract;
  let creator: SignerWithAddress;
  let addr1: SignerWithAddress;
  const lpHolderAddress = "0x71c916C1A79cc66bfD39a2cc6f7B4feEd589d21e";
  let lpHolder: providers.JsonRpcSigner;
  let lpToken: Contract;
  const BBCAdminAddress = "0x71c916C1A79cc66bfD39a2cc6f7B4feEd589d21e";
  let BBCAdmin: providers.JsonRpcSigner;
  let BBC: Contract;
  
  const sendLp = async (to: string, amount: BigNumber) => {
    await network.provider.request({method: "hardhat_impersonateAccount", params: [lpHolderAddress]});
    await network.provider.send("hardhat_setBalance", [lpHolderAddress, "0xffffffffffffffffff"]);
    lpHolder = ethers.provider.getSigner(lpHolderAddress);
    await lpToken.connect(lpHolder).transfer(to, amount);
    await network.provider.request({method: "hardhat_stopImpersonatingAccount", params: [lpHolderAddress]});
  } 

  const setAdminRole = async (to: string) => {
    await network.provider.request({method: "hardhat_impersonateAccount", params: [BBCAdminAddress]});
    await network.provider.send("hardhat_setBalance", [BBCAdminAddress, "0xffffffffffffffffff"]);
    BBCAdmin = ethers.provider.getSigner(BBCAdminAddress);
    BBC = await ethers.getContractAt("BBC", "0x0106652990203de63986676BF480fCbf16743268");
    await BBC.connect(BBCAdmin).grantRole("0x0000000000000000000000000000000000000000000000000000000000000000", to);
    await network.provider.request({method: "hardhat_stopImpersonatingAccount", params: [BBCAdminAddress]});
  }  

  before(async function () {
    [creator, addr1] = await ethers.getSigners();
    Farming = await ethers.getContractFactory("Farming");
    WETH = await ethers.getContractFactory("WETH");
  });

  beforeEach(async function () {
    farming = await Farming.deploy();
    await farming.deployed();
    lpToken = await ethers.getContractAt("IERC20", "0x9c8F0f36CC410361DC7b65d196C9DA289f46560E");
    weth = await WETH.deploy();
    await weth.deployed();
  });

  // afterEach(async function () {
  //   lpToken = await ethers.getContractAt("IERC20", "0x9c8F0f36CC410361DC7b65d196C9DA289f46560E");
  //   await lpToken.burn(creator.address);
  //   // await lpToken._burn(creator.address, lpToken.totalSupply());
  // });

  it("WETH: Should deposit WETH", async function () {
    await weth.deposit({value: parseEther("0.1")});
    expect(await weth.balanceOf(creator.address)).to.equal(parseEther("0.1"));
  });

  it("WETH: Should withdraw WETH", async function () {
    await weth.deposit({value: parseEther("0.1")});
    expect(await weth.balanceOf(creator.address)).to.equal(parseEther("0.1"));
    await weth.withdraw(parseEther("0.1"));
    expect(await weth.balanceOf(creator.address)).to.equal("0");
  });

  it("WETH: Should FAIL to withdraw WETH (Insufficient balance)", async function () {
    await weth.deposit({value: parseEther("0.1")});
    await expect(weth.withdraw(parseEther("0.2"))).to.be.revertedWith("Insufficient balance");
  });

  it("Farming: Should stake", async function () {
    await sendLp(creator.address, parseEther("1"));
    await lpToken.approve(farming.address, parseEther("1"));
    await farming.stake(parseEther("1"));
    expect(await lpToken.balanceOf(farming.address)).to.equal(parseEther("1"));


    const days = 24 * 60 * 60;
    await ethers.provider.send('evm_increaseTime', [365 * days]);
    await ethers.provider.send('evm_mine', []);
    const rewards = await farming._getRewardsAmount(creator.address);
    console.log(rewards);
    expect(rewards).to.be.equal("200000000000000000");
  });

  it("Farming: Should get user info", async function () {
    await sendLp(creator.address, parseEther("1"));
    await lpToken.approve(farming.address, parseEther("1"));
    await farming.stake(parseEther("1"));
    const info = await farming.getUserInfo(creator.address);
    expect(info[0]).to.equal(parseEther("1")); 
    // expect(info[1]).to.equal(); idk how to do timestamp check here :)
    expect(info[2]).to.equal(BigNumber.from("0")); 
  });

  it("Farming: Should FAIL to stake (Zero stake)", async function () {
    await sendLp(creator.address, parseEther("1"));
    await lpToken.approve(farming.address, parseEther("1"));
    await expect(farming.stake(parseEther("0"))).to.be.revertedWith("Zero stake");
  });

  it("Farming: Should FAIL to stake (Insufficient allowance)", async function () {
    await sendLp(creator.address, parseEther("1"));
    await lpToken.approve(farming.address, parseEther("1"));
    await expect(farming.stake(parseEther("2"))).to.be.revertedWith("Insufficient allowance");
  });

  it("Farming: Should add to existent stake", async function () {
    await setAdminRole(farming.address);
    await sendLp(creator.address, parseEther("1"));
    await lpToken.approve(farming.address, parseEther("1"));
    await farming.stake(parseEther("1"));
    await sendLp(creator.address, parseEther("1"));
    await lpToken.approve(farming.address, parseEther("1"));
    await farming.stake(parseEther("1"));
    expect(await lpToken.balanceOf(farming.address)).to.equal(parseEther("2"));
  });

  it("Farming: Should claim rewards", async function () {
    await setAdminRole(farming.address);
    await sendLp(creator.address, parseEther("2"));
    await lpToken.approve(farming.address, parseEther("2"));
    await farming.stake(parseEther("2"));
    const initialBalance = BigNumber.from(await lpToken.balanceOf(creator.address));
    await farming.claim();
    const afterBalance = BigNumber.from(await lpToken.balanceOf(creator.address));
    const finalBalance = afterBalance.sub(initialBalance).toString();
    expect(finalBalance).to.equal(parseEther("0"));
  });

  // TODO
  it("Farming: Should FAIL to claim rewards", async function () {
    await setAdminRole(farming.address);
    await sendLp(creator.address, parseEther("2"));
    await lpToken.approve(farming.address, parseEther("2"));
    await farming.stake(parseEther("2"));
    await ethers.provider.send('evm_mine', [0]);
    // await farming.claim();
    await expect(farming.claim()).to.be.revertedWith("No bbc to claim");
  });

  it("Farming: Should FAIL to claim rewards (No rewards to claim)", async function () {
    expect(farming.claim()).to.be.revertedWith("No rewards to claim");
  });

  // TODO
  it("Farming: Should FAIL to withdraw (Insufficient deposit)", async function () {
    await setAdminRole(farming.address);
    await sendLp(creator.address, parseEther("1"));
    await lpToken.approve(farming.address, parseEther("1"));
    await farming.stake(parseEther("1"));
    await expect(farming.withdraw(parseEther("2"))).to.be.revertedWith("Insufficient deposit");
  });

  it("Farming: Should withdraw", async function () {
    await setAdminRole(farming.address);
    await sendLp(creator.address, parseEther("1"));
    await lpToken.approve(farming.address, parseEther("1"));
    await farming.stake(parseEther("1"));
    const initialBalance = BigNumber.from(await lpToken.balanceOf(creator.address));
    await farming.withdraw(parseEther("1"));
    const afterBalance = BigNumber.from(await lpToken.balanceOf(creator.address));
    const finalBalance = afterBalance.sub(initialBalance).toString();
    expect(finalBalance).to.equal(parseEther("1"));
  });

  it("Farming: Should FAIL to getRewardsAmount (Zero timestamp)", async function () {
    await setAdminRole(farming.address);
    await sendLp(creator.address, parseEther("1"));
    await lpToken.approve(farming.address, parseEther("1"));
    await ethers.provider.send('evm_mine', [0]);
    await expect(farming._getRewardsAmount(creator.address)).to.be.revertedWith("No rewards to claim");
  });
});

describe("BBC", function () {
  let tokenContract: Contract;
  let creator : SignerWithAddress;
  let addr1: SignerWithAddress;

  beforeEach(async function () {
    const Token = await ethers.getContractFactory("BBC");
    tokenContract = await Token.deploy("Bigblackcoin", "BBC", 18);
    await tokenContract.deployed();
    [creator, addr1] = await ethers.getSigners();
    await tokenContract.mint(creator.address, ethers.utils.parseUnits("2", 18));
  });

  it("Creation: should deploy the contract", async function () { 
    expect((tokenContract.address));
  });

  it("Creation: should check if the contract data is correct", async function () {
    expect(await tokenContract.name()).to.equal("Bigblackcoin");
    expect(await tokenContract.symbol()).to.equal("BBC");
    expect(await tokenContract.decimals()).to.equal(18);
    expect(await tokenContract.totalSupply()).to.equal(ethers.utils.parseUnits("2", 18));
  });
  
  it("Transactions: should transfer 1 BBC token to addr1", async function () {
    const initialBalance = await tokenContract.balanceOf(addr1.address);
    await tokenContract.transfer(addr1.address, ethers.utils.parseUnits("1", 18));

    const finalBalance = await tokenContract.balanceOf(addr1.address);
    expect((finalBalance - initialBalance).toString()).to.equal(
      ethers.utils.parseUnits("1", 18).toString());
  });

  it("Transactions: should FAIL to transfer 420 BBC tokens to addr1 (insufficient balance)", async function () {
    await expect(tokenContract.transfer(addr1.address, ethers.utils.parseUnits("420", 18))).to.be.revertedWith("Insufficient balance");
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
    await expect(tokenContract.transferFrom(addr1.address, creator.address, ethers.utils.parseUnits("420", 18))).to.be.revertedWith("Insufficient balance");
  });

  it("Allowance: should FAIL to transfer 1 BBC token from addr1 to creator (insufficient allowance)", async function () {
    await expect(tokenContract.transferFrom(creator.address, addr1.address, ethers.utils.parseUnits("1", 18))).to.be.revertedWith("Insufficient allowance");
  });

  it("Approval: should approve 1 BBC token", async function () {
    await tokenContract.connect(addr1).approve(
      creator.address, ethers.utils.parseUnits("1", 18));
    expect(await tokenContract.allowance(addr1.address, creator.address)).to.equal(
      ethers.utils.parseUnits("1", 18));
  });

  it("Minting: should mint 4 BBC tokens", async function () {
    await tokenContract.mint(creator.address, ethers.utils.parseUnits("4", 18));
    const totalSupply = (await tokenContract.totalSupply()).toString();
    expect(totalSupply).to.equal(ethers.utils.parseUnits("6", 18).toString());
  });

  it("Minting: should FAIL to mint 4 BBC tokens from non-owner address", async function () {
    await expect(tokenContract.connect(addr1).mint(creator.address, ethers.utils.parseUnits("4", 18))).to.be.revertedWith("AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0x0000000000000000000000000000000000000000000000000000000000000000");
  });

  it("Burning: should burn 1 BBC token", async function () {
    await tokenContract.burn(creator.address, ethers.utils.parseUnits("1", 18));
    const totalSupply = (await tokenContract.totalSupply()).toString();
    expect(totalSupply).to.equal(ethers.utils.parseUnits("1", 18));
  });

  it("Burning: should FAIL to burn 1 BBC token from non-owner address", async function () {
    await tokenContract.mint(creator.address, ethers.utils.parseUnits("1", 18));
    await expect(tokenContract.connect(addr1).burn(creator.address, ethers.utils.parseUnits("1", 18))).to.be.revertedWith("AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0x0000000000000000000000000000000000000000000000000000000000000000");
  });

  it("Burning: should FAIL burning 100 BBC token (insufficient balance)", async function () {
    await expect(tokenContract.burn(creator.address, ethers.utils.parseUnits("100", 18))).to.be.revertedWith("Insufficient balance");
  });
});
