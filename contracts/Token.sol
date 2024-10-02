// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Importing console.sol for debugging, which allows us to log output to the console in Hardhat
import "hardhat/console.sol";

// Defining the Token contract
contract Token {
    // Public variables to store the token's name, symbol, decimals, and total supply
    string public name; // The name of the token (e.g., "Dapp University Token")
    string public symbol; // The symbol of the token (e.g., "DAPP")
    uint256 public decimals = 18; // The number of decimal places (standard is 18 for most tokens)
    uint256 public totalSupply; // The total supply of tokens (the maximum amount created)

    // A mapping to track each address's balance of tokens
    // For example: balanceOf[0xAddress] returns the balance of that address
    mapping(address => uint256) public balanceOf;

    // A mapping to track allowances: how much a spender is allowed to transfer on behalf of the token owner
    // For example: allowance[owner][spender] returns how many tokens the spender is allowed to transfer from the owner's balance
    mapping(address => mapping(address => uint256)) public allowance;

    // An event that is emitted whenever a transfer occurs
    // The `from` is the sender, `to` is the recipient, and `value` is the amount of tokens transferred
    event Transfer(address indexed from, address indexed to, uint256 value);

    // An event that is emitted whenever a token owner approves a spender to transfer tokens on their behalf
    // The `owner` is the person who approves, `spender` is the one allowed to transfer tokens, and `value` is the amount approved
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    // Constructor function that initializes the token with a name, symbol, and total supply
    // This function is called only once when the contract is deployed
    constructor(
        string memory _name, // The name of the token passed as an argument
        string memory _symbol, // The symbol of the token passed as an argument
        uint256 _totalSupply // The initial total supply of tokens passed as an argument (in whole units)
    ) {
        name = _name; // Setting the token name
        symbol = _symbol; // Setting the token symbol
        totalSupply = _totalSupply * (10 ** decimals); // Setting the total supply with the correct number of decimals (18 decimals)
        balanceOf[msg.sender] = totalSupply; // Assigning the total supply to the deployer's address (msg.sender)
    }

    // Function to transfer tokens from the caller's (msg.sender) account to another address
    // The `_to` address is the recipient, and `_value` is the amount of tokens to transfer
    function transfer(
        address _to,
        uint256 _value
    ) public returns (bool success) {
        // Ensure the sender has enough tokens to send
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");

        // Call the internal transfer function to handle the token movement
        _transfer(msg.sender, _to, _value);

        // Return true indicating the transfer was successful
        return true;
    }

    // Internal function that handles the actual token transfer logic
    // `_from` is the address sending the tokens, `_to` is the recipient, and `_value` is the amount to transfer
    function _transfer(address _from, address _to, uint256 _value) internal {
        // Ensure that the recipient address is valid (not the zero address)
        require(_to != address(0), "Invalid recipient address");

        // Deduct the tokens from the sender's balance
        balanceOf[_from] -= _value;

        // Add the tokens to the recipient's balance
        balanceOf[_to] += _value;

        // Emit the Transfer event to log the transfer action
        emit Transfer(_from, _to, _value);
    }

    // Function to approve a spender to transfer a specified amount of tokens on behalf of the caller (msg.sender)
    // `_spender` is the address that is allowed to transfer the tokens, and `_value` is the amount allowed
    function approve(
        address _spender,
        uint256 _value
    ) public returns (bool success) {
        // Ensure the spender address is valid
        require(_spender != address(0), "Invalid spender address");

        // Set the allowance mapping to allow the spender to transfer `_value` tokens on behalf of the caller
        allowance[msg.sender][_spender] = _value;

        // Emit the Approval event to log the approval action
        emit Approval(msg.sender, _spender, _value);

        // Return true indicating the approval was successful
        return true;
    }

    // Function to transfer tokens on behalf of someone else (delegated transfer)
    // `_from` is the address sending the tokens, `_to` is the recipient, and `_value` is the amount to transfer
    // The caller (msg.sender) must have been approved to transfer this amount by the `_from` address
    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool success) {
        // Ensure the sender has enough tokens to transfer
        require(_value <= balanceOf[_from], "Insufficient balance");

        // Ensure the caller (msg.sender) has been approved to transfer this amount from the `_from` address
        require(_value <= allowance[_from][msg.sender], "Allowance exceeded");

        // Reduce the allowance by the amount being transferred
        allowance[_from][msg.sender] -= _value;

        // Perform the token transfer by calling the internal transfer function
        _transfer(_from, _to, _value);

        // Return true indicating the delegated transfer was successful
        return true;
    }
}
