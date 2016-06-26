// player driver would be a proxy-controller
// has a pair code for each component it is controlling
  // pair code format:
  // '<controller role>_<controller characterId>-<host playerId>'
  // for the current four player set up,
  // <playerId0> as playerDriver for characterId: '0' would have pair codes:
    // eg: 'driver_0-player_<playerId1>'
    // eg: 'driver_0-player_<playerId2>'
    // eg: 'driver_0-player_<playerId3>'

// use the peer.send method to send an object:
// { position } (or) { rotation }
const { DOWNLOAD_PERIOD, TANK_RADIUS } = require('../../simulation/constants');

require('./lib/Object.polyfill.js');

var SocketPeer = require('socketpeer');

var PROXY_URL = 'https://proxy-controls.donmccurdy.com';
if (typeof process !== 'undefined') {
  PROXY_URL = process.env.npm_package_config_proxy_url || PROXY_URL;
}

/**
 * Client controls via WebRTC datastream, for A-Frame.
 *
 * @namespace proxy-controls
 * @param {string} proxyUrl - URL of remote WebRTC connection broker.
 * @param {string} pairCode - ID for local client. If not specified, a random
 *                          code is fetched from the server.
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

    // WebRTC/WebSocket configuration.
    proxyUrl: { default: PROXY_URL },
    pairCode: { default: '' },
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

    /** @type {Object} State tracking, keyed by event type. */
    this.state = {};

    this.interval = 0;

    if (this.data.pairCode) {
      this.setupConnection(this.data.pairCode);
    }
  },

  tick: function () {},

  /*******************************************************************
  * WebRTC Connection
  */

  setupConnection: function (pairCode) {
    var data = this.data;

    if (!data.proxyUrl) {
      console.error('proxy-controls "proxyUrl" property not found.');
      return;
    }

    var peer = this.peer = new SocketPeer({
      pairCode: pairCode,
      url: data.proxyUrl + '/socketpeer/'
    });
    window.peer = peer;
    this.el.emit('proxycontrols.paircode', {pairCode: pairCode});

    peer.on('connect', this.onConnection.bind(this));
    peer.on('disconnect', this.onDisconnect.bind(this));
    peer.on('error', function (error) {
      if (data.debug) console.error('peer:error(%s)', error.message);
    });

    // Debugging
    if (data.debug) {
      peer.on('connect', console.info.bind(console, 'peer:connect("%s")'));
      peer.on('upgrade', console.info.bind(console, 'peer:upgrade("%s")'));
    }
  },

  onConnection: function () {
    if (this.data.debug) console.info('peer:connection()');
    this.interval = setInterval(this.sendUpdate, 100);
  },

  onDisconnect: function () {
    if (this.data.debug) console.info('peer:disconnect()');
    clearInterval(this.interval);
  },

  sendUpdate: function () {
    // this.peer.send(this.el.getAttribute(this.data.attribute));
    this.peer.send({ 'oh hi': 'there' });
  },

  /*******************************************************************
  * Dealloc
  */

  /**
   * Called when a component is removed (e.g., via removeAttribute).
   * Generally undoes all modifications to the entity.
   */
  remove: function () {
    if (this.peer) this.peer.destroy();
    if (this.overlay) this.overlay.destroy();
  }
};
