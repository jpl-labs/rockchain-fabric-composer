'use strict';

/**
 * Helpers and locals --------------
 */
var factory = getFactory();
var getCurrentGameRound = function() {
  return query('getCurrentGameRound')
    .then(function(rounds) {
      if (rounds.length === 0) {
        // make a new round to start the game
        return getAssetRegistry('com.omni.biznet.GameRound')
          .then(function(gameRoundRegistry) {
            var newRound = factory.newResource('com.omni.biznet', 'GameRound', 'round1');
            newRound.roundNumber = 1;
            return gameRoundRegistry.add(newRound)
              .then(function() {
                return newRound;
              });
          });
      }

      return rounds[0];
    });
};
var getPotSizeForRound = function(gameRound) {
  return query('getWagersByRound', { roundNumber: gameRound.roundNumber })
    .then(function(wagers) {
      return gameRound.startingPot + wagers.length;
    });
};

/**
 * @param {com.omni.biznet.RegisterUser} tx
 * @transaction
 */
function onRegisterUser(tx) {
  var newUser = factory.newResource('com.omni.biznet', 'User', tx.email);
  newUser.charity = tx.charity;
  newUser.balance = 1000;

  return getParticipantRegistry('com.omni.biznet.User')
    .then(function(userRegistry) {
      return userRegistry.add(newUser);
    });
}

/**
 * @param  {com.omni.biznet.MakeBet} tx
 * @transaction
 */
function onMakeBet(tx) {
  if (tx.bettor.balance < tx.numberOfRounds) {
    throw new Error('Balance is too low to make this bet');
  }
  if (tx.numberOfRounds < 1) {
    throw new Error('Wager must be at least 1');
  }
  if (tx.numberOfRounds > 50) {
    throw new Error('Wager cannot be larger than 50');
  }

  // - get all required registries
  // - get current game round
  // - create new wager record
  // - decrement the user's balance
  // - commit the changes to the blockchain
  // - emit an event containing wager info and pot at time of bet
  return Promise.all([
    getParticipantRegistry('com.omni.biznet.User'),
    getAssetRegistry('com.omni.biznet.Wager'),
    getCurrentGameRound()
  ]).then(function(resolved) {
    //TODO: use es6 deconstruction once composer is on fiber v1.1
    var userRegistry = resolved[0];
    var wagerRegistry = resolved[1];
    var currentRound = resolved[2];

    var newWager = factory.newResource('com.omni.biznet', 'Wager', tx.wagerId);
    newWager.artist = tx.artist;
    newWager.startingRoundNumber = currentRound.roundNumber;
    newWager.endingRoundNumber = currentRound.roundNumber + tx.numberOfRounds;
    newWager.bettor = tx.bettor;

    tx.bettor.balance -= tx.numberOfRounds;

    return Promise.all([
      userRegistry.update(tx.bettor),
      wagerRegistry.add(newWager),
      getPotSizeForRound(currentRound)
    ]).then(function(resolved) {
      //TODO: use es6 deconstruction once composer is on fiber v1.1
      var potSize = resolved[2];

      var betPlacedEvent = factory.newEvent('com.omni.biznet', 'BetPlaced');
      betPlacedEvent.potAtTimeOfBet = potSize;
      betPlacedEvent.wager = newWager;
      betPlacedEvent.gameRound = currentRound;
      emit(betPlacedEvent);
    });
  });
}

/**
 * @param  {com.omni.biznet.EndCurrentRound} tx
 * @transaction
 */
function onEndCurrentRound(tx) {
  /**
   * - get all required registries
   * - get current game round
   * - get all winning wagers
   * - make payouts to winners
   * - store round results in current game round
   * - set round to no longer be current
   * - make new round with new round number
   * - commit all changes to the blockchain
   * - emit an event with results
   */
  return Promise.all([
    getParticipantRegistry('com.omni.biznet.User'),
    getAssetRegistry('com.omni.biznet.GameRound'),
    getCurrentGameRound(),
  ]).then(function(resolved) {
    //TODO: use es6 deconstruction once composer is on fiber v1.1
    var userRegistry = resolved[0];
    var gameRoundRegistry = resolved[1];
    var currentRound = resolved[2];

    return Promise.all([
      query('getWinnersByRound', {
        roundNumber: currentRound.roundNumber,
        artist: tx.artist
      }),
      getPotSizeForRound(currentRound)
    ]).then(function(resolved) {
      //TODO: use es6 deconstruction once composer is on fiber v1.1
      var winners = resolved[0];
      var potSize = resolved[1];

      var promises = [];
      var nextRoundNumber = currentRound.roundNumber + 1;

      var roundResults = factory.newConcept('com.omni.biznet', 'RoundResults');
      roundResults.winners = winners;
      roundResults.artist = tx.artist;
      roundResults.songData = tx.songData;
      currentRound.results = roundResults;

      var nextRound = factory.newResource('com.omni.biznet', 'GameRound', 'round' + nextRoundNumber);
      nextRound.roundNumber = nextRoundNumber;
      nextRound.startingPot = potSize;

      if (winners.length > 0) {
        nextRound.startingPot = 0;
        var payout = potSize / winners.length;
        roundResults.payout = payout;

        winners.forEach(function(winner) {
          var fetchUpdatePromise = userRegistry.get(winner.bettor.getIdentifier())
            .then(function(bettor) {
              bettor.balance += payout;
              return userRegistry.update(bettor);
            });
          promises.push(fetchUpdatePromise);
        });
      }

      currentRound.isCurrent = false;
      promises.push(gameRoundRegistry.update(currentRound));
      promises.push(gameRoundRegistry.add(nextRound));

      return Promise.all(promises)
        .then(function() {
          var roundCompletedEvent = factory.newEvent('com.omni.biznet', 'RoundCompleted');
          roundCompletedEvent.round = currentRound;
          emit(roundCompletedEvent);
        });
    });
  });
}
