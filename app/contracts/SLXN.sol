pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

contract SLXN is StandardToken {
	
	string public name = "Saloon";
	string public symbol = "SLXN";
	uint8 public decimals = 0;
	uint public INITIAL_SUPPLY = 999999;
	
	constructor() public {
	  totalSupply_ = INITIAL_SUPPLY;
	  balances[msg.sender] = INITIAL_SUPPLY;
	}
}