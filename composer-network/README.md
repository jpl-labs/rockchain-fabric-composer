# Rockchain Composer Fiber Network
Welcome to the Hyperledger Composer implementation of Rockchain.

## Setup
#### Prerequisites:
* https://hyperledger.github.io/composer/installing/development-tools.html (including additional pre-reqs mentioned)
* Fiber is running according to above instructions

npm build commands
---
#### run per Fiber instance:
The following commands should be run after every Fabric teardown/startup cycle (with the exception of the `import-admin-card` step as explained below)

First you must install the composer chaincode runtime via:
```
$ npm run install-runtime
```
This is a requirement because Composer is just an abstracted framework on top of the low-level Fabric infrastructure.
In order for a Fiber business network to be managed by Composer, the runtime chaincode must first be installed for that network.

Now that you have the Composer runtime installed, you should then be able to build the business network archive and deploy it to your Fiber instance by running the following commands:
```
$ npm run build-archive
$ npm run network-start
$ npm run import-admin-card
```
NOTE: the `import-admin-card` step should only need to run the very first time you run this network. The admin cards appear to survive across Fiber startup/teardown cycles.

#### run after modifying local files:
If you would like to develop and test changes to the network, modify the appropriate files (models, logic, permissions, queries), and then run the following commands:
```
$ npm run build-archive
$ npm run network-update
```

viewing/testing the network
---
Finally, run `composer-playground` (installed in pre-reqs above) to log in and test out the network. More information about using the playground can be found here: https://hyperledger.github.io/composer/tutorials/playground-tutorial

Running the tests
---
You may run the network's unit tests via:
```
$ npm install
$ npm run test
```
