pragma solidity ^0.4.24;

contract Saloon {

  /*/ Initialize Contract */
	constructor() public {
		addMode('Fortnite 1v1', 1, 100, 2, (2*3)-1);
		addMode('Fortnite 1v1v1v1', 1, 100, 4, (4*3)-1);
  }

	/* Modes */
	struct Mode {
		uint id;
		string name;
		uint minStake;
		uint maxStake;
		uint usersNeeded;
    uint votesNeeded;
	}

	mapping(uint => Mode) public modes; uint public modeCount;

  function addMode (string _name, uint _minStake, uint _maxStake, uint _maxPlayers, uint _votesToSettleIssue) private {
  	require(_votesToSettleIssue % 2 != 0);
    modeCount ++;
  	modes[modeCount] = Mode(modeCount, _name, _minStake, _maxStake,_maxPlayers,_votesToSettleIssue);
  }

  /* Matches */
  struct Issue {
    uint id;
    mapping(address => uint) voteCount; uint numVotes;
    mapping(address => bool) hasVoted;
    uint assoc_match;
  }
  mapping(uint => Issue) public issues; uint public numIssues;

  event addedIssueEvent ( uint indexed issueID );
  function addIssue (uint _id) private {

    // Add the match to the mapping
    numIssues ++;
    issues[numIssues] = Issue(numIssues, 0, _id);
    matches[_id].assoc_issue = numIssues;

    // Trigger event
    emit addedIssueEvent(numIssues);
  }

  function addVoteToIssue (uint _issueID, address _forAccount, address _fromAccount) private{
    issues[_issueID].voteCount[_forAccount] ++;
    issues[_issueID].numVotes ++;
    issues[_issueID].hasVoted[_fromAccount] = true;

    // check for final vote
    // if final vote
    if (issues[_issueID].numVotes == modes[matches[issues[_issueID].assoc_match].mode].votesNeeded){
      address liked;
      for (uint j = 0; j < matches[issues[_issueID].assoc_match].numAccounts; j++){ // loop through accounts in match
        uint votesForThisACC = issues[_issueID].voteCount[matches[issues[_issueID].assoc_match].accounts[j]];// get issue.votes[account]
        uint votesForLikedACC = issues[_issueID].voteCount[liked];
        if (votesForThisACC > votesForLikedACC){
          liked = matches[issues[_issueID].assoc_match].accounts[j];
        }
      }
      endMatch(issues[_issueID].assoc_match, liked);

    }
  }

  /* Matches */
  struct Match {
  	uint id;
  	uint mode;
  	uint stake;
    uint numAccounts;
    uint assoc_issue;
    mapping(uint => address) accounts;
      mapping(address => uint) voteCount;
      mapping(address => bool) hasVoted;
      mapping(address => string) epic;
  }
	mapping(uint => Match) public matches; uint public matchCount;

  event addedMatchEvent ( uint indexed matchId );
	function addMatch (uint _mode, uint _stake, address _founder, string _epic) private {

		// Add the match to the mapping
		matchCount ++;
		matches[matchCount] = Match(matchCount, _mode, _stake, 0, 0);

		// Place the user in the Match's account mapping
		placeUserInMatch(matchCount, _founder, _epic);

    // Trigger event
    emit addedMatchEvent(matchCount);
	}
  function getAccountByIDinMatch(uint _matchID, uint account) public constant returns(address votes)
  {
     return matches[_matchID].accounts[account];
  }    
  function getEpicByIDinMatch(uint _matchID, address account) public constant returns(string votes)
  {
     return matches[_matchID].epic[account];
  }  
  function getVotesForAccountInMatch(uint _matchID, address account) public constant returns(uint votes)
  {
     return matches[_matchID].voteCount[account];
  }  
  function getHasVotedForAccountInMatch(uint _matchID, address account) public constant returns(bool voted)
  {
     return matches[_matchID].hasVoted[account];
  }

	function placeUserInMatch (uint _id, address _address, string _epic) private {

    // remove stake from user and give it to Saloon

		// Place the user in the Match !merge-!refactor-these
		userInGame[_address] = true;
		usersGame[_address] = matchCount;

		// Place the user in the Match's account mapping
		matches[_id].numAccounts ++;
    matches[_id].accounts[matches[_id].numAccounts] = _address;
    matches[_id].epic[_address] = _epic;
	}

  function endMatch (uint _id, address _winner) private {
    usersWins[_winner] ++;
    for (uint i = 0; i < matches[_id].numAccounts; i++){ // loop through accounts in match
      delete userInGame[matches[_id].accounts[i+1]];
      delete usersGame[matches[_id].accounts[i+1]];
    }
  }
  function disputeMatch (uint _id) private {
    // create a dispute 
    addIssue(_id);
  }

  /* Users -> Matches */
  mapping(address => uint) public usersGame;
  mapping(address => bool) public userInGame;
  mapping(address => uint) public usersWins;

  function createMatch (uint _mode, uint _stake, string _epic)  public payable {

    require(!userInGame[msg.sender]); // user can not already be in a game
  	require(modes[_mode].id != 0, "_mode must exist");
  	require(_stake >= modes[_mode].minStake && _stake <= modes[_mode].maxStake); // stake must be stakeween minStake and maxStake

  	addMatch(_mode, _stake, msg.sender, _epic);
  }

  function joinMatch (uint _id, string _epic) public{

 	  require(!userInGame[msg.sender]); // user can not already be in a match
 		require(matches[_id].id!=0); // match must exist
  	require(modes[matches[_id].mode].usersNeeded > matches[_id].numAccounts); // must not be full lobby

  	placeUserInMatch(_id, msg.sender, _epic);
  }

  function castIssueVote (uint _issueID, address _forAccount) public {
    // sender must meet requirements to vote
    require(matches[issues[_issueID].assoc_match].voteCount[_forAccount] > 0); // vote must be for account in match
    require(issues[_issueID].numVotes < modes[matches[issues[_issueID].assoc_match].mode].votesNeeded); // issue must be open, issue.numVotes > issue.match.mode.votesNeeded
    require(issues[_issueID].hasVoted[msg.sender] != true); // sender must not have already voted for this issue
    addVoteToIssue(_issueID, _forAccount, msg.sender);
  }

  function castMatchVote (uint accountID) public{
    address sender = msg.sender;
    uint matchID = usersGame[sender];

    require(userInGame[sender]); // user must be in a match
    require(modes[matches[matchID].mode].usersNeeded == matches[matchID].numAccounts); // must be full lobby
    require(matches[matchID].hasVoted[sender] == false); // user must not have voted
    require(accountID <= matches[matchID].numAccounts && accountID > 0); // vote must be for player in match

    address voteFor = matches[matchID].accounts[accountID];

    matches[matchID].voteCount[voteFor] ++;
    matches[matchID].hasVoted[sender] = true;

    // check for flags
    bool flag;
    for (uint i = 0; i < matches[matchID].numAccounts; i++){ // loop through accounts in match
      if (!matches[matchID].hasVoted[getAccountByIDinMatch(1, i+1)]){ // if any account hasn't voted
        flag = true; // raise flag
      }
    }
    // handle flags
    if (flag == false){
      address undisputedWinner;
      bool disputed;
      for (uint j = 0; j < matches[matchID].numAccounts; j++){ // loop through accounts in match
        address thisAccount = matches[matchID].accounts[j+1];
        uint voteCount = matches[matchID].voteCount[thisAccount];
        if (voteCount > 0){
          if (undisputedWinner == 0){
            undisputedWinner = thisAccount;
          }
          else if (undisputedWinner != thisAccount){
            disputed = true;
          }
        }
      }
      if (!disputed){
        endMatch(matchID, undisputedWinner);
      }
      else {
        disputeMatch(matchID);
      }
    }
  }
}