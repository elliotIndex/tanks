import React from 'react';
import BattleScene from './BattleScene';
import JoinGameScene from './JoinGameScene';
const uuid = require('uuid');
const io = require('socket.io-client/socket.io');
const server = 'http://localhost:8080'; // change for production

class WelcomePage extends React.Component {

  constructor(props) {
    super(props);
    this.roomId = '0';
    this.socket = io.connect(server);
    window.socket = this.socket; // figure out a better way for everyone to have access to this socket
    this.playerId = uuid.v4();
    window.playerId = this.playerId;
    this.state = {
      scene: 'joinGame'
    };
  }

  changeScene(nextScene, characterId, role) {
    this.setState({
      scene: nextScene,
      characterId,
      role,
    });
  }

  render () {
    if(this.state.scene === 'joinGame') {
      return (
        <JoinGameScene socket={this.socket} playerId={this.playerId}
        enterBattle={this.changeScene.bind(this, 'battleMode')} roomId={this.roomId}/>
      )
    } else if (this.state.scene === 'battleMode') {
      return (
        <BattleScene socket={this.socket} playerId={this.playerId}
        role={this.state.role} characterId={this.state.characterId} roomId={this.roomId}/>
      )
    }
  }
}

module.exports = WelcomePage;
