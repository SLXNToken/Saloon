pragma solidity ^0.4.24;

contract Elections {

	// Voter Model
	struct Voter {
		bool voted;
	}
	// Voter Mapping
	mapping(address => bool) public voters;

	// Candidate Model
	struct Candidate {
		uint id;
		string name;
		uint voteCount;
	}
	// Candidate Mapping (Fetch / Store)
	mapping(uint => Candidate) public candidates;
	// Candidate Count
	uint public candidateCount;

	constructor() public {
		addCandidate('Player #1');
		addCandidate('Player #5');
  	}

  	function addCandidate (string _name) private {
  		candidateCount ++;
  		candidates[candidateCount] = Candidate(candidateCount, _name, 0);
  	}

  	function vote (uint _candidateId) public {
  		require(!voters[msg.sender]);
  		require(_candidateId > 0 && _candidateId <= candidateCount);
  		voters[msg.sender] = true;
  		candidates[_candidateId].voteCount ++;
  	}
}