# Rockchain Composer Fiber Network
Welcome to the Hyperledger Composer implementation of Rockchain. 

## Setup
#### Prerequisites:
* https://hyperledger.github.io/composer/installing/development-tools.html (including additional pre-reqs mentioned)
* Fiber is running according to above instructions

npm build commands
---
#### run per Fiber instance:
Once you have a running instance of Fiber, you must install the composer chaincode runtime via:
```
$ npm run install-runtime
```
You will have to run the above command every time to teardown and re-startup your local Fiber instance.

#### run first time (also per Fiber instance):
Now that you have the Composer runtime installed, you should then be able to build the business network archive and deploy it to your Fiber instance by running the following commands:
```
$ npm run build-archive
$ npm run import-admin-card
$ npm run network-start
```

#### run after modifying local files:
If you would like to develop and test changes to the network, modify the appropriate files (models, logic, permissions, queries), and then run the following commands:
```
$ npm run build-archive
$ npm run network-update
```

viewing/testing the network
---
Finally, run `composer-playground` (installed in pre-reqs above) to log in and test out the network. More information about using the playground can be found here: https://hyperledger.github.io/composer/tutorials/playground-tutorial
