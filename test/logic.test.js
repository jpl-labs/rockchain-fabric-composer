'use strict';
/**
 * Write the unit tests for your transction processor functions here
 */

const AdminConnection = require('composer-admin').AdminConnection;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const IdCard = require('composer-common').IdCard;
const MemoryCardStore = require('composer-common').MemoryCardStore;

const path = require('path');

require('chai').should();
const assert = require('chai').assert;

const namespace = 'com.omni.biznet';

describe('#' + namespace, () => {
  // In-memory card store for testing so cards are not persisted to the file system
  const cardStore = new MemoryCardStore();
  let adminConnection;
  let businessNetworkConnection;

  const getUserRegistry = () => businessNetworkConnection.getParticipantRegistry(`${namespace}.User`);
  const getWagerRegistry = () => businessNetworkConnection.getAssetRegistry(`${namespace}.Wager`);
  const getGameRoundRegistry = () => businessNetworkConnection.getAssetRegistry(`${namespace}.GameRound`);

  /**
   * Registers a user and returns the new user
   * @param  {String} email         the email/identifier for the user
   * @return {com.omni.biznet.User} the resulting User
   */
  const registerUser = (email) => {
    const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

    const registerUserTx = factory.newTransaction(namespace, 'RegisterUser');
    registerUserTx.email = email;
    registerUserTx.charity = 'Undefined';

    return Promise.all([
      getUserRegistry(),
      businessNetworkConnection.submitTransaction(registerUserTx)
    ]).then(([ userRegistry, tx ]) => {
      return userRegistry.get(email);
    })
  };

  /**
   * Gets the current game round for the current businessNetworkConnection
   * (Will throw an error if no bets have been placed yet / no current round found)
   * @return {com.omni.biznet.GameRound} the current game round
   */
  const getCurrentGameRound = () => {
    return businessNetworkConnection.query('getCurrentGameRound')
      .then(rounds => rounds[0]);
  };

  const endCurrentRound = (artist, songData) => {
    const factory = businessNetworkConnection.getBusinessNetwork().getFactory();
    const endRoundTx = factory.newTransaction(namespace, 'EndCurrentRound');
    endRoundTx.artist = artist;
    endRoundTx.songData = songData;

    return businessNetworkConnection.submitTransaction(endRoundTx);
  };

  /**
   * Makes a wager for the given user and returns the new wager
   * @param  {String} wagerId               the id for the wager
   * @param  {String} artist                the artist value for the wager
   * @param  {Integer} numberOfRounds       the numberOfRounds value for the wager
   * @param  {com.omni.biznet.User} bettor  the User that the wager is for
   * @return {com.omni.biznet.Wager}        the resulting Wager
   */
  const makeBet = (wagerId, artist, numberOfRounds, bettor) => {
    const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

    const makeBetTx = factory.newTransaction(namespace, 'MakeBet');
    makeBetTx.wagerId = wagerId;
    makeBetTx.artist = artist;
    makeBetTx.numberOfRounds = numberOfRounds;
    makeBetTx.bettor = factory.newRelationship(namespace, 'User', bettor.$identifier);

    return Promise.all([
      getWagerRegistry(),
      businessNetworkConnection.submitTransaction(makeBetTx)
    ]).then(([ wagerRegistry, tx ]) => {
      return wagerRegistry.get(wagerId);
    });
  };

  before(() => {
    // Embedded connection used for local testing
    const connectionProfile = {
      name: 'embedded',
      type: 'embedded'
    };
    // Embedded connection does not need real credentials
    const credentials = {
      certificate: 'FAKE CERTIFICATE',
      privateKey: 'FAKE PRIVATE KEY'
    };

    // PeerAdmin identity used with the admin connection to deploy business networks
    const deployerMetadata = {
      version: 1,
      userName: 'PeerAdmin',
      roles: [ 'PeerAdmin', 'ChannelAdmin' ]
    };
    const deployerCard = new IdCard(deployerMetadata, connectionProfile);
    deployerCard.setCredentials(credentials);

    const deployerCardName = 'PeerAdmin';
    adminConnection = new AdminConnection({ cardStore: cardStore });

    return adminConnection.importCard(deployerCardName, deployerCard).then(() => {
      return adminConnection.connect(deployerCardName);
    });
  });

  beforeEach(() => {
    businessNetworkConnection = new BusinessNetworkConnection({ cardStore: cardStore });

    const adminUserName = 'admin';
    let adminCardName;
    let businessNetworkDefinition;

    return BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..')).then(definition => {
      businessNetworkDefinition = definition;
      // Install the Composer runtime for the new business network
      return adminConnection.install(businessNetworkDefinition.getName());
    }).then(() => {
      // Start the business network and configure a network admin identity
      const startOptions = {
        networkAdmins: [
          {
            userName: adminUserName,
            enrollmentSecret: 'adminpw'
          }
        ]
      };
      return adminConnection.start(businessNetworkDefinition, startOptions);
    }).then(adminCards => {
      // Import the network admin identity for us to use
      adminCardName = `${adminUserName}@${businessNetworkDefinition.getName()}`;
      return adminConnection.importCard(adminCardName, adminCards.get(adminUserName));
    }).then(() => {
      // Connect to the business network using the network admin identity
      return businessNetworkConnection.connect(adminCardName);
    });
  });

  describe('RegisterUser()', () => {
    it('should register a new user with 1000 starting balance', () => {
      return registerUser('user1').then(user => {
        user.balance.should.equal(1000);
      });
    });
  });

  describe('MakeBet()', () => {

    const wagerAutoId = (() => {
      let id = 0;
      return () => {
        return `wager${id++}`;
      };
    })();

    it('should create initial GameRound on first bet', () => {
      return registerUser('user1')
        .then(user => {
          return makeBet('wager1', 'artist1', 10, user);
        }).then(wager => {
          return getCurrentGameRound();
        }).then(currentRound => {
          currentRound.isCurrent.should.equal(true);
        });
    });

    it('should deduct from user balance', () => {
      let user1;

      return registerUser('user1')
        .then(user => {
          user1 = user;
          return makeBet('wager1', 'artist1', 10, user);
        }).then(wager => {
          return getUserRegistry();
        }).then(userRegistry => {
          return userRegistry.get(user1.$identifier);
        }).then(updatedUser => {
          updatedUser.balance.should.equal(990);
        });
    });

    it('should not allow a bet of 0', () => {
      let err;

      return registerUser('user1')
        .then(user => {
          return makeBet('wager1', 'artist1', 0, user);
        }).catch(ex => {
          err = ex;
        }).then(() => {
          assert.exists(err, 'Expected an error to be thrown');
          err.message.should.contain('Wager must be at least 1');
        })
    });

    it('should not allow a bet greater than 50', () => {
      let err;

      return registerUser('user1')
        .then(user => {
          return makeBet('wager1', 'artist1', 51, user);
        }).catch(ex => {
          err = ex;
        }).then(() => {
          assert.exists(err, 'Expected an error to be thrown');
          err.message.should.contain('Wager cannot be larger than 50');
        })
    });

    it('should not allow a bet greater than user balance', () => {
      let err;

      // registered users start with a balance of 1000
      // max bet size is 50
      // 1000 / 50 = 20
      // --> the 21st wager should trigger an error

      return registerUser('user1')
        .then(user => {
          let promise;
          for (let i = 0; i <= 20; i++) {
            if (promise) {
              promise = promise.then(() => makeBet(wagerAutoId(), 'artist1', 50, user));
            } else {
              promise = makeBet(wagerAutoId(), 'artist1', 50, user);
            }
          }

          return promise;
        }).catch(ex => {
          err = ex;
        }).then(() => {
          assert.exists(err, 'Expected an error to be thrown');
          err.message.should.contain('Balance is too low to make this bet');
        })
    });
  });

  describe('EndCurrentRound()', () => {
    let factory, user1, user2;

    const wagerAutoId = (() => {
      let id = 0;
      return () => {
        return `wager${id++}`;
      };
    })();

    beforeEach(() => {
      factory = businessNetworkConnection.getBusinessNetwork().getFactory();

      return Promise.all([
        registerUser('user1'),
        registerUser('user2')
      ]).then(([ _user1, _user2 ]) => {
        user1 = _user1;
        user2 = _user2;
      }).then(() => {
        //make the bets that will be used to test assertions below
        return makeBet(wagerAutoId(), 'artist1', 10, user1)
          .then(() => makeBet(wagerAutoId(), 'artist2', 10, user1))
          .then(() => makeBet(wagerAutoId(), 'artist1', 5, user2))
          .then(() => makeBet(wagerAutoId(), 'artist3', 10, user2));

        // user1.balance == 980
        // user2.balance == 985
      });
    });

    it('should increase startingPot for next round if there are no winners', () => {
      return endCurrentRound('foo')
        .then(() => {
          return getCurrentGameRound();
        }).then(currentRound => {
          currentRound.roundNumber.should.equal(2);
          currentRound.startingPot.should.equal(4);
        });
    });

    it('should reset startingPot to 0 for next round if there are winners', () => {
      return endCurrentRound('artist1')
        .then(() => {
          return getCurrentGameRound();
        }).then(currentRound => {
          currentRound.roundNumber.should.equal(2);
          currentRound.startingPot.should.equal(0);
        });
    });

    it('should payout 2 to both winners when artist1 is on first round', () => {
      return endCurrentRound('artist1')
        .then(() => {
          return getUserRegistry();
        }).then(userRegistry => {
          return Promise.all([
            userRegistry.get('user1'),
            userRegistry.get('user2')
          ]);
        }).then(([ _user1, _user2 ]) => {
          _user1.balance.should.equal(982);
          _user2.balance.should.equal(987);
        });
    });

    it('should payout 20 to user1 when artist2 is on fifth round', () => {
      return endCurrentRound('foo')             // round 1
        .then(() => endCurrentRound('foo'))     // round 2
        .then(() => endCurrentRound('foo'))     // round 3
        .then(() => endCurrentRound('foo'))     // round 4
        .then(() => endCurrentRound('artist2')) // round 5
        .then(() => {
          return getUserRegistry();
        }).then(userRegistry => {
          return Promise.all([
            userRegistry.get('user1'),
            userRegistry.get('user2')
          ]);
        }).then(([ _user1, _user2 ]) => {
          _user1.balance.should.equal(1000);
          _user2.balance.should.equal(985);
        });
    });

    it('should payout 23 to user1 when artist1 is on sixth round', () => {
      return endCurrentRound('foo')             // round 1
        .then(() => endCurrentRound('foo'))     // round 2
        .then(() => endCurrentRound('foo'))     // round 3
        .then(() => endCurrentRound('foo'))     // round 4
        .then(() => endCurrentRound('foo'))     // round 5
        .then(() => endCurrentRound('artist1')) // round 6
        .then(() => {
          return getUserRegistry();
        }).then(userRegistry => {
          return Promise.all([
            userRegistry.get('user1'),
            userRegistry.get('user2')
          ]);
        }).then(([ _user1, _user2 ]) => {
          _user1.balance.should.equal(1003);
          _user2.balance.should.equal(985);
        });
    });
  });
});
