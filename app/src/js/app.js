App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: function() {
    $('#createMatchModal').on('shown.bs.modal', function () {
      $('#myInput').trigger('focus')
    })
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
  castMyVote: function(_for){
    console.log(_for);
    App.contracts.Saloon.deployed().then(function(instance) {
      return instance.castMatchVote(_for, { from: App.account });
    }).then(function(result) {
      console.log(result)
    }).catch(function(err) {
      console.error(err);
    });
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
        App.loadThreads();
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
  loadThreads: function(matchCount) {
    console.log('loading threads')
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
      for (var i = 1; i <= matchCount; i++) {
        SaloonInstance.matches(i).then(function(match) {
          SaloonInstance.modes(match[1]).then(function(mode) {
            var id = match[0];
            var name = mode[1];
            var stake = match[2];
            var numAccounts = match[3];
            var usersNeeded = mode[4]; 
            if (numAccounts < usersNeeded){ // Lobby must not render if full
              var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + stake + " ETH </td><td>" + '' + "</td><td style='width: 10%;'><button class='btn btn-secondary w-100' onclick='App.requestJoinMatch("+id+");'>Join</button></td></tr>"
              candidatesResults.append(candidateTemplate);
            }
          });
        });
      }      return SaloonInstance.userInGame(App.account);
    }).then(function(inGame) {
      if(inGame) {
        App.handleInGame();
        // add oppenents to vote for
      }
      else {
        App.handleFindGame();
      }
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
