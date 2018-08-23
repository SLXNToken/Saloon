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
  createMatch: function() {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Saloon.deployed().then(function(instance) {
      return instance.createMatch(1,10, { from: App.account });
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
      return SaloonInstance.modeCount();
    }).then(function(modeCount) {
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();
    var candidatesSelect = $('#candidatesSelect');
    candidatesSelect.empty();
      for (var i = 1; i <= modeCount; i++) {
        SaloonInstance.modes(i).then(function(candidate) {

        var id = candidate[0];
        var name = candidate[1];
        var minStake = candidate[2];
        var maxStake = candidate[3];
        var usersNeeded = candidate[4];

          // Render candidate Result
          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + minStake + "</td><td>" + maxStake + "</td><td>" + usersNeeded + "</td></tr>"
          candidatesResults.append(candidateTemplate);
                  // Render candidate ballot option
        var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
        candidatesSelect.append(candidateOption);
        });
      }

      loader.hide();
      content.show();
      return SaloonInstance.userInGame(App.account);

    }).then(function(inGame) {
      // Do not allow a user to vote
      if(inGame) {
        $('form').hide();
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
