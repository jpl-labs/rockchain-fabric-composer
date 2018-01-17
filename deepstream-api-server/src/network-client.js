const EventEmitter = require('events')
const config = require('config')

const {
  cardname,
  namespace
} = config.get('biznet')

class RockchainNetwork extends EventEmitter {
  constructor({
    logger,
    connection
  }) {
    super()

    this.logger = logger
    this.connection = connection
  }

  async init() {
    this.network = await this.connection.connect(cardname)
    this.factory = this.network.getFactory()
    this.logger.info('RockchainNetwork::init', 'network definition successfully acquired - id:', this.network.getIdentifier())

    // get all needed registries
    const [
      userRegistry,
      wagerRegistry,
      gameRoundRegistry
    ] = await Promise.all([
      this.connection.getParticipantRegistry(`${namespace}.User`),
      this.connection.getAssetRegistry(`${namespace}.Wager`),
      this.connection.getAssetRegistry(`${namespace}.GameRound`)
    ])

    this.userRegistry = userRegistry
    this.wagerRegistry = wagerRegistry
    this.gameRoundRegistry = gameRoundRegistry
    this.logger.info('RockchainNetwork::init', 'all registries were successully acquired')

    //forward network events as namespaced specific events
    this.connection.on('event', evt => {
      const fullEventName = `${evt['$namespace']}.${evt['$type']}`
      this.logger.info('RockchainNetwork::<event_received>', 'received a network event:', fullEventName)
      this.emit(fullEventName, evt)
    })
  }

  ensureNetwork(method) {
    if (!this.factory) {
      const err = 'network not initialized'
      this.logger.error(`RockchainNetwork::${method}`, err)
      throw new Error(err)
    }
  }

  listUsers() {
    this.ensureNetwork('listUsers')
    return this.userRegistry.getAll()
  }

  listWagers() {
    this.ensureNetwork('listWagers')
    return this.wagerRegistry.getAll()
  }

  listGameRounds() {
    this.ensureNetwork('listGameRounds')
    return this.gameRoundRegistry.getAll()
  }

  async registerUser({ email, charity }) {
    this.ensureNetwork('registerUser')

    const tx = this.factory.newTransaction(namespace, 'RegisterUser')
    tx.email = email
    tx.charity = charity

    await this.connection.submitTransaction(tx)
    return this.userRegistry.get(email)
  }

  async makeBet({ email, wagerId, artist, numberOfRounds }) {
    this.ensureNetwork('makeBet')

    const tx = this.factory.newTransaction(namespace, 'MakeBet')
    tx.wagerId = wagerId
    tx.artist = artist
    tx.numberOfRounds = numberOfRounds
    tx.bettor = this.factory.newRelationship(namespace, 'User', email)

    await this.connection.submitTransaction(tx)
    return this.wagerRegistry.get(wagerId)
  }

  endCurrentRound({ artist, songData }) {
    this.ensureNetwork('endCurrentRound')

    const tx = this.factory.newTransaction(namespace, 'EndCurrentRound')
    tx.artist = artist
    tx.songData = songData

    return this.connection.submitTransaction(tx)
  }
}

module.exports = RockchainNetwork
