const RockchainNetwork = require('./network-client')
const provide = require('./deepstream-provider')
const winston = require('winston')
const { BusinessNetworkConnection } = require('composer-client')

winston.loggers.add('application', {
  console: {
    level: 'silly',
    colorize: true,
    label: 'RockchainNetwork-client'
  }
});
const logger = winston.loggers.get('application')

const network = new RockchainNetwork({
  logger,
  connection: new BusinessNetworkConnection()
})

provide(network).then(() => logger.info('RockchainNetwork deepstream API server is ready!'))
