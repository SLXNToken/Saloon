App = {

  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: function() {
    return App.initWeb3();
  },
  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },
  initContract: function() {
    $.getJSON("Saloon.json", function(Saloon) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Saloon = TruffleContract(Saloon);
      // Connect provider to interact with contract
      App.contracts.Saloon.setProvider(App.web3Provider);

      return App.render();
    });
  },
  requestJoinMatch: function(_threadID){
    // show match data
    $('#joinMatchModal').modal('show');
    $('#joinMatchModal #confirm').on('click', function(){
      let epcnm = $('#joinMatchModal #epicValue').val();
      App.joinThread(_threadID, epcnm);
    });
  },
  joinThread: function(_threadID, _epic) {
    App.contracts.Saloon.deployed().then(function(instance) {
      return instance.joinMatch(_threadID, _epic, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  },
  requestCreateMatch: function(){
    $('#createMatchModal').modal('show');
    $('#createMatchModal #confirm').on('click', function(){
      let epcnm = $('#createMatchModal #epicValue').val();
      let stk = $('#createMatchModal #stakeValue').val();
      let md = $('#createMatchModal #modeSelect').val();
      console.log(epcnm,stk,md);
      App.createMatch(md,stk,epcnm)
    });
  },
  requestVoteIssue: function(_issueID) {
    $('.goodbye').empty();
    $('#voteOnDisputeModal #confirm').attr('disabled', true)
    App.contracts.Saloon.deployed().then(function(instance) {
      SaloonInstance = instance;
      return SaloonInstance.issues(_issueID);
    }).then(function(result) {
      matchID = (result[2].valueOf());
      return SaloonInstance.matches(matchID);
    }).then(function(result) {
      numAccounts = (result[3].valueOf());
      function redo(i) {
        SaloonInstance.getAccountByIDinMatch(matchID, i).then(function(acc){
          SaloonInstance.getEpicByIDinMatch(matchID, acc).then(function(epic){
            temp = $( ".hello" ).clone()
            temp.removeClass('hello')
            temp.removeClass('d-none')
            temp.addClass('voting')
            temp.find('.playerName').html(epic)
            temp.find('.checkbox').attr('acc', i)
            temp.appendTo( ".goodbye" );
            if (i < numAccounts) {
              redo(i+1)
            }
          });
        });
      };
      redo(1);
    }).catch(function(err) {
      console.error(err);
    });


    $('#voteOnDisputeModal').modal('show');

    $('#voteOnDisputeModal #confirm').on('click', function(){
      SaloonInstance.issues(_issueID).then(function(result){
      matchID = (result[2].valueOf());
        SaloonInstance.getAccountByIDinMatch(matchID, $('#voteOnDisputeModal .voting .checkbox:checked').attr('acc')).then(function(acc){
              console.log(_issueID, acc);
              App.sendIssueVote(_issueID, acc);
      })    
      })    
    })
  },
  castMyVote: function(_for){
    App.contracts.Saloon.deployed().then(function(instance) {
      return instance.castMatchVote(_for, { from: App.account });
    }).catch(function(err) {
      console.error(err);
    });
  },
  sendIssueVote: function(_issueID, _forAccount){
    App.contracts.Saloon.deployed().then(function(instance) {
      return instance.castIssueVote(_issueID, _forAccount, { from: App.account });
    }).catch(function(err) {
      console.error(err);
    });
  },
  updateCheckBoxes: function(e){
    console.log(e)
    var boxes = $('#voteOnDisputeModal').find('.voting .checkbox');
    for (var i = 0; i < boxes.length; i++) {
        $(boxes[i]).prop('checked', false);
    }
    $(e).prop('checked', true);
    $('#voteOnDisputeModal #confirm').attr('disabled', false)
  },
  createMatch: function(_mode, _stake, _epic) {
    App.contracts.Saloon.deployed().then(function(instance) {
      return instance.createMatch(_mode, _stake, _epic, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  },
  handleFindGame: function() {

      $('#thread_finder').slideDown();
      },
  handleInGame: function() {
    $('#voting').empty(); // empty voting area
    $('#ingame_screen').slideDown(); // show screen

    App.contracts.Saloon.deployed().then(function(instance) {
      SaloonInstance = instance;
      return SaloonInstance.usersGame(App.account);
    }).then(function(usersGame) {
      myGame = usersGame
      return SaloonInstance.matches(usersGame);
    }).then(function(usersMatch) {
      var aMatch = usersMatch;
      SaloonInstance.modes(usersMatch[1]).then(function(mode) {
        var usersNeeded = mode[4];
        console.log('accounts in my match:', usersMatch[3].valueOf())
        console.log('accounts needed to start:', usersNeeded.valueOf());
        if (usersNeeded.valueOf() == usersMatch[3].valueOf()){
          SaloonInstance.getHasVotedForAccountInMatch(myGame, App.account).then(function(v){
            var voted = v;
            if (!voted){
              $('#select_who_won').slideDown();
              console.log('this account voted: ', voted)
              function trenches(i) {
                    SaloonInstance.getAccountByIDinMatch(myGame, i).then(function(acc){
                      SaloonInstance.getEpicByIDinMatch(myGame, acc).then(function(epic){
                        console.log(i,epic)
                        $('#voting').append('<button onclick="App.castMyVote('+i+');" class="btn btn-secondary" title="'+acc+'">'+epic+'</button> ')
                        if (i < usersMatch[3].valueOf()) trenches(i+1);
                      });
                  })
              }
              trenches(1)
            }
            else {
                let isDisputed = usersMatch[4].valueOf();
                if (isDisputed == 1) {
                  $('#wait_for_dispute').slideDown();

                }
                else {
                  $('#wait_for_votes').slideDown();
                }
            }
          });   
        }
        else {
          $('#wait_for_players').html('waiting for '+ (usersNeeded.valueOf() - usersMatch[3].valueOf()) +' player(s) to join.');
          $('#wait_for_players').slideDown();
        }
      });
      // show waiting screen if numAccounts < accountsNeeded

      // else show voting screen

    }).catch(function(err) {
      console.error(err);
    });
  },
  render: function() {
    var SaloonInstance;

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data
    App.contracts.Saloon.deployed().then(function(instance) {
      SaloonInstance = instance;
      return SaloonInstance.matchCount();
    }).then(function(matchCount) {
      var candidatesResults = $("#dataBody");
      candidatesResults.empty();
      var disputeDataElement = $("#disputeData");
      disputeDataElement.empty();
      for (var i = 1; i <= matchCount; i++) {
        SaloonInstance.matches(i).then(function(match) {
          SaloonInstance.modes(match[match[0]]).then(function(mode) {
            var id = match[0];
            var name = mode[1];
            var stake = match[2];
            var numAccounts = match[3];
            var usersNeeded = mode[4]; 
            var dis = match[4]; 
            if (dis == 1){
              // sender must not have already voted for this issue
              // issue must be open, issue.numVotes > issue.match.mode.votesNeeded
              var candidateTemplate = "<tr><th class='text-center'>" + id + "</th><td>" + name + "</td><td style='width: 10%;'><button class='btn btn-secondary w-100' onclick='App.requestVoteIssue("+id+");'>Vote</button></td></tr>"
              disputeDataElement.append(candidateTemplate);
            }
            else if (numAccounts < usersNeeded){ // Lobby must not render if full
              var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + stake + " ETH </td><td>" + '' + "</td><td style='width: 10%;'><button class='btn btn-secondary w-100' onclick='App.requestJoinMatch("+id+");'>Join</button></td></tr>"
              candidatesResults.append(candidateTemplate);
            }
          });
        });
      }      
      return SaloonInstance.userInGame(App.account);
    }).then(function(inGame) {
      if(inGame) {
        App.handleInGame();
        // add oppenents to vote for
      }
      else {
        App.handleFindGame();
      }
      $('#loaderModal').fadeToggle(1000);
    }).catch(function(error) {
        console.warn(error);
      });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});