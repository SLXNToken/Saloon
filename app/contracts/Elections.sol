pragma solidity ^0.4.24;

contract Elections {

	/*/ Initialize Contract */
	constructor() public {
		addMode('1v1', 1, 100, 2);
		addMode('2v2', 1, 100, 4);
  	}

	/* Modes */
	struct Mode {
		uint id;
		string name;
		uint minBet;
		uint maxBet;
		uint usersNeeded;
	}
	mapping(uint => Mode) public modes; uint public modeCount;

  	function addMode (string _name, uint _minBet, uint _maxBet, uint _maxPlayers) private {
  		modeCount ++;
  		modes[modeCount] = Mode(modeCount, _name, _minBet, _maxBet,_maxPlayers);
  	}

  	/* Matches */
  	struct Match {
  		uint id;
  		uint mode;
  		uint bet;
  		address founder;
  		mapping(address => address) vote;
  	}
	mapping(uint => Match) public matches; uint public matchCount;
  	function addMatch (uint _mode, uint _bet, address _founder) private {

  		// Add the match to the mapping
  		matchCount ++;
  		matches[matchCount] = Match(matchCount, _mode, _bet, _founder);

  		// Place the user in the Match
  		userInGame[_founder] = true;
  		usersGame[_founder] = matchCount;
  	}
  	function addVote (address _for) private{
  		// Add the vote to the vote mapping of the match
  		matches[usersGame[msg.sender]].vote[msg.sender] = _for;
  	}

  	/* Users -> Matches */
	mapping(address => bool) public userInGame;
	mapping(address => uint) public usersGame;

  	function createMatch (uint _mode, uint _bet) public {
  		require(modes[_mode].id != 0); // Mode must exist
  		require(_bet >= modes[_mode].minBet && _bet <= modes[_mode].maxBet); // Bet must be between minBet and maxBet
  		require(!userInGame[msg.sender]); // The user can not already be in a game

  		// Create the Match
  		addMatch(_mode, _bet, msg.sender);
  	}
  	function castMatchVote (address _for) public {
  		require(userInGame[msg.sender]); // User must be in a match
  		require(matches[usersGame[msg.sender]].id!=0); // The match the user is in must exist
  		require(matches[usersGame[msg.sender]].vote[msg.sender]==0); // The user must not have already vote in this match

  		// Add the vote
  		addVote(_for);
  	}
}