//SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "hardhat/console.sol";

contract Token {
    uint256 constant private MAX_UINT256 = 2**256 - 1;
    uint256 public tokenTotalSupply;
    uint8 public tokenDecimals;
    string public tokenName;
    string public tokenSymbol;
    address public creator;

    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowed;

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        tokenName = _name;
        tokenSymbol = _symbol;
        tokenDecimals = _decimals;
        creator = msg.sender;
    }

    event Transfer(address _from, address _to, uint256 _value);
    event Approval(address _creator, address _spender, uint256 _value);
    event Mint(address _creator, uint256 _value);
    event Burn(address _creator, uint256 _value);

    modifier creatorOnly {
        _creatorOnly();
        _;
    }

    function _creatorOnly() private view {
        require(msg.sender == creator, "This address is not a creator");
    }

    function balanceOf(address _sender) public view returns (uint256 balance) {
        return balances[_sender];
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        return true;
    }

    function allowance(address _creator, address _spender) public view returns (uint256 remaining) {
        return allowed[_creator][_spender];
    }

    function mint(address _address, uint256 _amount) external creatorOnly returns (bool success) {
        tokenTotalSupply += _amount;
        balances[_address] += _amount;
        emit Mint(_address, _amount);
        return true;
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(_value <= balances[msg.sender], "Insufficient balance");
        balances[msg.sender] -= _value;
        balances[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(_value <= balances[_from], "Insufficient balance");
        uint256 _allowed = allowance(_from, msg.sender);
        require(_value <= _allowed, "Insufficient allowance");
        if (_allowed < MAX_UINT256) {
            allowed[_from][msg.sender] -= _value;
        }
        balances[_to] += _value;
        balances[_from] -= _value;
        emit Transfer(_from, _to, _value);
        return true;
    }

    function burn(address _from, uint256 amount) external creatorOnly returns (bool success) {
        require(balances[_from] > amount, "Insufficient balance");
        balances[_from] -= amount;
        tokenTotalSupply -= amount;
        emit Burn(_from, amount);
        return true;
    }
}
