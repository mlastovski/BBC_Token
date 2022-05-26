// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import { IERC20 } from "../node_modules/@openzeppelin/contracts/interfaces/IERC20.sol";
import { BBC } from "./BBC.sol";


contract Farming {
    IERC20 immutable lpToken = IERC20(0x9c8F0f36CC410361DC7b65d196C9DA289f46560E);
    BBC immutable bbc = BBC(0x0106652990203de63986676BF480fCbf16743268);

    struct Stake {
        uint256 amount;
        uint256 timestamp;
    }

    mapping(address => Stake) internal _stakes;

    event Staked(address account, uint256 amount);
    event Claimed(address account, uint256 amount);
    event Withdrawal(address account, uint256 amount);

    function stake(uint256 amount) public {
        require(amount > 0, "Zero stake");
        require(lpToken.allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");
        lpToken.transferFrom(msg.sender, address(this), amount);

        if(_stakes[msg.sender].amount > 0) {
            _stakes[msg.sender].amount += amount;
            _stakes[msg.sender].timestamp = block.timestamp;
        } else {
            _stakes[msg.sender] = Stake({amount: amount, timestamp: block.timestamp});
        }

        emit Staked(msg.sender, amount);
    }

    function claim() public {
        require(_stakes[msg.sender].timestamp != 0, "No rewards to claim");
        uint256 rewardInBBC = _getRewardsAmount(msg.sender);
        require(_stakes[msg.sender].amount > 0 && rewardInBBC > 0, "No bbc to claim");
        bbc.mint(msg.sender, rewardInBBC);
        _stakes[msg.sender].timestamp = 0;

        emit Claimed(msg.sender, rewardInBBC);
    }

    function withdraw(uint256 amount) public {
        require(amount <= _stakes[msg.sender].amount, "Insufficient deposit");
        claim();
        _stakes[msg.sender].amount -= amount;
        lpToken.transfer(msg.sender, amount);

        emit Withdrawal(msg.sender, amount);
    }

    function getUserInfo(address user) public view returns (uint256 deposit, uint256 timestamp, uint256 rewards) {
        return(_stakes[msg.sender].amount, _stakes[msg.sender].timestamp, _getRewardsAmount(user));
    }

    function _getRewardsAmount(address account) internal view returns (uint256 rewards) {
        require(_stakes[account].timestamp != 0, "No rewards to claim");
        uint256 lockedDays = block.timestamp - _stakes[account].timestamp;
        uint256 amountStaked = _stakes[account].amount;
        return((amountStaked * 20 * lockedDays) / (365 days * 100));
    }
}
