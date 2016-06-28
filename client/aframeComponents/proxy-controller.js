// player tank would be a proxy-controller
// has a pair code for each component it is controlling
  // pair code format:
  // '<controller role>_<controller characterId>-<host playerId>'
  // for the current four player set up,
  // <playerId0> as playerDriver for characterId: '0' would have pair codes:
    // eg: 'tank_0-player_<playerId1>'
    // eg: 'tank_0-player_<playerId2>'
    // eg: 'tank_0-player_<playerId3>'

// use the peer.send method to send an object:
// { position } (or) { rotation }
const { DOWNLOAD_PERIOD, TANK_RADIUS } = require('../../simulation/constants');

var SocketPeer = require('socketpeer');

var PROXY_URL = 'https://proxy-controls.donmccurdy.com';

/**
 * Client controls via WebRTC datastream, for A-Frame.
 *
 * @namespace proxy-controls
 * @param {string} proxyUrl - URL of remote WebRTC connection broker.
 * @param {string} pairCode - ID for local client. If not specified, a random
 *                          code is fetched from the server.
 * @param {string} role - one of 'tank' or 'gunner'
 * @param {string} characterId - characterId of the player's tank
 *
 * @param {bool} [enabled=true] - To completely enable or disable the remote updates.
 * @param {debug} [debug=false] - Whether to show debugging information in the log.
 */
 AFRAME.registerComponent('proxy-controller', {
  /*******************************************************************
  * Schema
  */

  schema: {
    enabled: { default: true },
    debug: { default: false },

    role: { default: 'tank' },
    characterId: { default: '0' },

    // WebRTC/WebSocket configuration.
    proxyUrl: { default: PROXY_URL },
  },

  /*******************************************************************
  * Initialization
  */

  /**
   * Called once when component is attached. Generally for initial setup.
   */
  init: function () {
    /** @type {SocketPeer} WebRTC/WebSocket connection. */
    this.peer = null;
    this.peers = [];

    this.interval = 0;
    this.count = 0;

    this.pairCodes = this.generatePairCodes();
    // make pair codes out of <role><characterId>_playerId(NEED TO GET PLAYERID SOMEHOW)
    if (this.pairCodes.length) {
      this.setupConnection(this.pairCodes);
    }
  },

  tick: function () {},

  /*******************************************************************
  * WebRTC Connection
  */

  generatePairCodes() {
    const pairCodes = [];
    const roles = ['driver', 'gunner'];
    const characterIds = ['0', '1'];
    const baseId = this.data.role + this.data.characterId;
    let peerId;
    for (var i = 0; i < roles.length; i++) {
      for (var j = 0; j < characterIds.length; j++) {
        peerId = roles[i] + characterIds[j]
        if (peerId !== baseId) {
          pairCodes.push(baseId + '_' + peerId);
        }
      }
    }
    return pairCodes;
  },

  setupConnection: function (pairCodes) {
    const data = this.data;
    const self = this;
    const peers = this.peers;

    if (!data.proxyUrl) {
      console.error('proxy-controls "proxyUrl" property not found.');
      return;
    }
    pairCodes.forEach(pairCode => {
      var peer = new SocketPeer({
        pairCode: pairCode,
        url: data.proxyUrl + '/socketpeer/'
      });

      peer.on('connect', self.onConnection.bind(self));
      peer.on('upgrade', self.onUpgrade.bind(self, peer));
      peer.on('disconnect', self.onDisconnect.bind(self));
      peer.on('error', function (error) {
        if (data.debug) console.error('peer:error(%s)', error.message);
      });

      // Debugging
      if (data.debug) {
        peer.on('connect', console.info.bind(console, 'peer:connect("%s")'));
        peer.on('upgrade', console.info.bind(console, 'peer:upgrade("%s")'));
      }

      peers.push(peer);
    });
    window.peers = peers;
  },

  onConnection: function () {
    if (this.data.debug) console.info('peer:connection()');
  },

  onUpgrade: function (peer) {
    if (this.data.debug) console.info('peer:upgrade()');
    this.interval = setInterval(this.sendUpdate.bind(this, peer), DOWNLOAD_PERIOD);
  },

  onDisconnect: function () {
    if (this.data.debug) console.info('peer:disconnect()');
    clearInterval(this.interval);
  },

  sendUpdate: function (peer) {
    let update = {};
    if (this.data.role === 'driver' ) {
      update.rotation = this.el.children[0].getAttribute('rotation');
      update.position = this.el.getAttribute('position');
    } else {
      update.rotation = this.el.getAttribute('rotation');
    }
    peer.send(update);
  },

  /*******************************************************************
  * Dealloc
  */

  /**
   * Called when a component is removed (e.g., via removeAttribute).
   * Generally undoes all modifications to the entity.
   */
  remove: function () {
    this.peers.forEach(peer => peer && peer.destroy());
  }
});
