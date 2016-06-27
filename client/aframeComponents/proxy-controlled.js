// has one pair code:
  // '<this role>_<this characterId>-<this playerId>'

// use the onEvent() method of proxy-controls (probably have to re-write proxy controls)
//

var SocketPeer = require('socketpeer');

var PROXY_URL = 'https://proxy-controls.donmccurdy.com';

/**
 * Client controls via WebRTC datastream, for A-Frame.
 *
 * @namespace proxy-controls
 * @param {string} proxyUrl - URL of remote WebRTC connection broker.
 * @param {string} proxyPath - Proxy path on connection broken service.
 * @param {string} pairCode - ID for local client. If not specified, a random
 *                          code is fetched from the server.
 * @param {bool} [enabled=true] - To completely enable or disable the remote updates.
 * @param {debug} [debug=false] - Whether to show debugging information in the log.
 */
 AFRAME.registerComponent('proxy-controlled', {
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
    peer.on('upgrade', this.onUpgrade.bind(this));
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
  },

  onUpgrade: function () {
    if (this.data.debug) console.info('peer:upgrade()');
    this.peer.on('data', this.onEvent.bind(this));
  },

  /*******************************************************************
  * Remote event propagation
  */

  onEvent: function (event) {
    console.log('===============================================================');
    console.log('event happened', event);
    if (!this.data.enabled) {
      return;
    } else if (!event.type) {
      if (this.data.debug) console.warn('Missing event type.');
    } else if (event.type === 'ping') {
      this.peer.send(event);
    } else {
      this.state[event.type] = event.state;
    }
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
});
