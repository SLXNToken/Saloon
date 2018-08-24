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

      App.listenForEvents();

      return App.render();
    });
  },
  listenForEvents: function() {
    App.contracts.Saloon.deployed().then(function(instance) {
      instance.addedMatchEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {App.render();});
    });
  },
  voteThread: function(_won){
    var _for = App.account;
    if (_won != 1){ _for = 0x0f75bec2d4930282d252f1150429ba0eb4dee498; }
    console.log(_for);
    App.contracts.Saloon.deployed().then(function(instance) {
      return instance.castMatchVote(_for, { from: App.account });
    }).then(function(result) {
      console.log(result)
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
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
  requestJoinMatch: function(_threadID){
    // show match data
    console.log(_threadID)
    $('#joinMatchModal').modal('show');
    $('#joinMatchModal #confirm').on('click', function(){
      let epcnm = $('#joinMatchModal #epicValue').val();
      App.joinThread(_threadID, epcnm);
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
  render: function() {
    var SaloonInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

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

            var numAccounts = match[4];
            var usersNeeded = mode[4]; 
            if (numAccounts < usersNeeded){ // Lobby must not render if full
              var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + stake + " ETH </td><td>" + '' + "</td><td style='width: 10%;'><button class='btn btn-secondary w-100' onclick='App.requestJoinMatch("+id+");'>Join</button></td></tr>"
              candidatesResults.append(candidateTemplate);
            }
          });
        });
      }

      loader.hide();
      content.show();
      return SaloonInstance.userInGame(App.account);

    }).then(function(inGame) {
    if(inGame) {
      $('#ingame_screen').slideDown();
      // add oppenents to vote for
    }
    loader.hide();
    content.show();
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
