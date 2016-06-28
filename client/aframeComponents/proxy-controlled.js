const SocketPeer = require('socketpeer');
const { lerpRotations, getVelocity } = require('../../math/vectorHelpers');
const { DOWNLOAD_PERIOD, TANK_RADIUS } = require('../../simulation/constants');
const PROXY_URL = 'https://proxy-controls.donmccurdy.com';

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

    role: { default: 'driver' },
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
    this.pairCode = this.generatePairCode();

    if (this.pairCode) {
      this.setupConnection(this.pairCode);
    }

    // Motion simulation
    this.lastUpdateTime = 0;
    this.updateWaiting = false;
    this.updateRate = DOWNLOAD_PERIOD;

    if (this.data.role === 'driver') {
      this.previousPosition = new THREE.Vector3();
      this.currentPosition = new THREE.Vector3();
      this.nextPosition = new THREE.Vector3();
    }

    this.previousRotation = new THREE.Vector3();
    this.currentRotation = new THREE.Vector3();
    this.nextRotation = new THREE.Vector3();
  },

  tick: function (t) {
    if(this.updateWaiting) {
      this.updateRate = (t - this.lastUpdateTime);
      this.lastUpdateTime = t;
      this.updateWaiting = false;
    }

    const alpha = Math.min(1, (t - this.lastUpdateTime) / this.updateRate);

    lerpRotations(this.currentRotation, this.previousRotation, this.nextRotation, alpha);

    if (this.data.role === 'driver') {
      this.currentPosition.lerpVectors(this.previousPosition, this.nextPosition, alpha);
      this.currentPosition.y = TANK_RADIUS;
      this.el.setAttribute('position', this.currentPosition);
      this.el.children[0].setAttribute('rotation', this.currentRotation);
    } else {
      this.el.setAttribute('rotation', this.currentRotation);
    }

  },

  /*******************************************************************
  * WebRTC Connection
  */

  generatePairCode() {
    return `${this.data.role}${this.data.characterId}_${window.role}${window.characterId}`
  },

  setupConnection: function (pairCode) {
    const data = this.data;

    if (!data.proxyUrl) {
      console.error('proxy-controls "proxyUrl" property not found.');
      return;
    }

    const peer = this.peer = new SocketPeer({
      pairCode: pairCode,
      url: data.proxyUrl + '/socketpeer/'
    });

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

  onDisconnect: function () {
    if (this.data.debug) console.info('peer:disconnect()');
  },

  /*******************************************************************
  * Remote event propagation
  */

  onEvent: function (event) {
    this.updateWaiting = true;
    if (this.data.role === 'driver') {
      this.previousRotation = this.el.children[0].getAttribute('rotation');
      this.previousPosition = this.el.getAttribute('position');
      this.nextPosition = event.position;
    } else {
      this.previousRotation = this.el.getAttribute('rotation');
    }
    this.nextRotation = event.rotation;
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
