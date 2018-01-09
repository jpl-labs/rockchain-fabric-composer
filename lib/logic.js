'use strict';

/**
 * @param {com.omni.biznet.RegisterUser} tx
 * @transaction
 */
function onRegisterUser(tx) {
  var factory = getFactory();
  var newUser = factory.newResource('com.omni.biznet', 'User', tx.email);
  newUser.charity = tx.charity;
  //init starting balance to 1000
  newUser.balance = 1000;

  getParticipantRegistry('com.omni.biznet.User')
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

  var factory = getFactory();

  // - get all required registries
  // - get current game round
  // - create new wager record
  // - decrement the user's balance
  // - commit the changes to the blockchain
  // - emit an event containing wager info and pot at time of bet
  return Promise.all([
    getParticipantRegistry('com.omni.biznet.User'),
    getAssetRegistry('com.omni.biznet.Wager'),
    query('getCurrentGameRound')
  ]).then(function(userRegistry, wagerRegistry, currentRound) {
    var newWager = factory.newResource('com.omni.biznet', 'Wager', tx.wagerId);
    newWager.artist = tx.artist;
    newWager.startingRoundNumber = currentRound.roundNumber;
    newWager.endingRoundNumber = currentRound.roundNumber + tx.numberOfRounds;
    newWager.bettor = tx.bettor;

    tx.bettor.balance -= tx.numberOfRounds;

    return Promise.all([
      userRegistry.update(tx.bettor),
      wagerRegistry.add(newWager),
      query('getWagersByRound', { roundNumber: currentRound.roundNumber })
    ]).then(function(bettor, newWager, wagersForRound) {
      var betPlacedEvent = factory.newEvent('com.omni.biznet', 'BetPlaced');
      betPlacedEvent.potAtTimeOfBet = currentRound.startingPot + wagersForRound.length;
      betPlacedEvent.wager = newWager;
      betPlacedEvent.gameRound = currentRound;
      emit(betPlacedEvent);
    });
  });
}
