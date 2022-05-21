//SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract BBC is AccessControl {
    uint256 private tokenTotalSupply;
    uint8 private tokenDecimals;
    string private tokenName;
    string private tokenSymbol;

    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowed;

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        tokenName = _name;
        tokenSymbol = _symbol;
        tokenDecimals = _decimals;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
    event Mint(address indexed _owner, uint256 _value);
    event Burn(address indexed _owner, uint256 _value);

    function name() public view returns (string memory) {
        return tokenName;
    }

    function symbol() public view returns (string memory) {
        return tokenSymbol;
    }

    function decimals() public view returns (uint8) {
        return tokenDecimals;
    }

    function totalSupply() public view returns (uint256) {
        return tokenTotalSupply;
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        return balances[_owner];
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
        allowed[_from][msg.sender] -= _value;
        balances[_to] += _value;
        balances[_from] -= _value;
        emit Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }

    function mint(address _address, uint256 _amount) external onlyRole(DEFAULT_ADMIN_ROLE) returns (bool success) {
        tokenTotalSupply += _amount;
        balances[_address] += _amount;
        emit Mint(_address, _amount);
        return true;
    }

    function burn(address _from, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) returns (bool success) {
        require(balances[_from] >= amount, "Insufficient balance");
        balances[_from] -= amount;
        tokenTotalSupply -= amount;
        emit Burn(_from, amount);
        return true;
    }
}
