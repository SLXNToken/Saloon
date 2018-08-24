pragma solidity ^0.4.24;

contract Saloon {

  /*/ Initialize Contract */
	constructor() public {
		addMode('Fortnite 1v1', 1, 100, 2);
		addMode('Fortnite 1v1v1v1', 1, 100, 4);
  }

	/* Modes */
	struct Mode {
		uint id;
		string name;
		uint minStake;
		uint maxStake;
		uint usersNeeded;
	}
	mapping(uint => Mode) public modes; uint public modeCount;

  function addMode (string _name, uint _minStake, uint _maxStake, uint _maxPlayers) private {
  	modeCount ++;
  	modes[modeCount] = Mode(modeCount, _name, _minStake, _maxStake,_maxPlayers);
  }

  /* Matches */
  struct Match {
  	uint id;
  	uint mode;
  	uint stake;
  	address founder;
  	mapping(address => address) vote;
  	mapping(uint => address) accounts; uint numAccounts;
    mapping(address => string) epic;
  }
	mapping(uint => Match) public matches; uint public matchCount;
  event addedMatchEvent ( uint indexed matchId );
	function addMatch (uint _mode, uint _stake, address _founder, string _epic) private {

		// Add the match to the mapping
		matchCount ++;
		matches[matchCount] = Match(matchCount, _mode, _stake, _founder, 0);

		// Place the user in the Match's account mapping
		placeUserInMatch(matchCount, _founder, _epic);
    // Trigger event
    addedMatchEvent(matchCount);
	}
	function placeUserInMatch (uint _id, address _address, string _epic) private {

		// Place the user in the Match !merge-!refactor-these
		userInGame[_address] = true;
		usersGame[_address] = matchCount;
    // Place the user in the Match !merge-!refactor-these
    usersEpic[_address] = _epic;
		// Place the user in the Match's account mapping
		matches[_id].numAccounts ++;
		matches[_id].accounts[matches[_id].numAccounts] = _address;

	}
	function addVote (address _for) private {
		// Add the vote to the vote mapping of the match
		matches[usersGame[msg.sender]].vote[msg.sender] = _for;

    if (everyoneVoted(matches[usersGame[msg.sender]].id) == true){

    }
	}
	function everyoneVoted (uint _id) private view returns (bool _allVotesAreIn){
		for (uint i = 0; i < matches[_id].numAccounts; i++){ // all connected accounts must have voted for someone
			if (matches[_id].vote[matches[_id].accounts[i]]==0) return false; // someone hasn't voted yet
		}
    return true; // noone hasn't voted
	}
  function evaluateThread (uint _id) private {

  // CREATE VARIABLES
    // for all accounts in a thread mapping(account => uint) votes;
      // get vote for each account
      // require vote is for account in thread mapping, else, don't count it 
      // increment votes[vote] by one

  // PUT VARIABLES UNDER CONDITIONS
    // create an empty winner address winner;
    // for all accounts in a thread mapping's votes
      // if (account's votes > 0) 
        // if winner is unset 
          // winner = account;
        // else 
          // if (account's votes > 0) dispute = true;
      //

  // MANAGE OUTCOME
    // if (dispute is true)
      // createDispute();
    // else
      // awardWinner(winner);

  }

  	/* Users -> Matches */
	mapping(address => bool) public userInGame;
	mapping(address => uint) public usersGame;
  mapping(address => string) private usersEpic;

  function createMatch (uint _mode, uint _stake, string _epic) public {
  	// User must have stake
  	require(modes[_mode].id != 0, "_mode must exist");
  	require(_stake >= modes[_mode].minStake && _stake <= modes[_mode].maxStake); // stake must be stakeween minStake and maxStake
  	require(!userInGame[msg.sender]); // user can not already be in a game

  	// Create the Match
  	addMatch(_mode, _stake, msg.sender, _epic);
  }
  function joinMatch (uint _id, string _epic) public{
  	// User must have stake
 	  require(!userInGame[msg.sender]); // user can not already be in a match
 		require(matches[_id].id!=0); // match must exist
  	require(modes[matches[_id].mode].usersNeeded > matches[_id].numAccounts); // Match must not be full match

  	placeUserInMatch(_id, msg.sender, _epic); // Place the user in the Match's account mapping
  }
  	function castMatchVote (address _for) public {
  		require(userInGame[msg.sender]); // User must be in a match
  		require(matches[usersGame[msg.sender]].id!=0); // match the user is in must exist
      require(_for!=0); // _for cannot be blank
  		require(matches[usersGame[msg.sender]].vote[msg.sender] == 0); // user must not have already vote in this match
  		require(modes[matches[usersGame[msg.sender]].mode].usersNeeded == matches[usersGame[msg.sender]].numAccounts); // Match must be full match.mode.usersNeeded == match.numAccounts

  		// Add the vote
  		addVote(_for);
  	}
}