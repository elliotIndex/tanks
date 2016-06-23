import React from 'react';
import PlayerDriver from './PlayerDriver';
import TankBody from './TankBody';
import Turret from './Turret';
import Barrel from './Barrel';
import { rand } from '../../math/vectorHelpers';

class PlayerTank extends React.Component {

  constructor(props) {
    super(props);
    this.rotation = props.rotation || '0 0 0';
    this.socket = props.socket;
  }

  render () {
    if(this.props.role === 'driver') {
      return (
        <PlayerDriver
        socket={this.props.socket}
        position={this.props.position}
        rotation={this.rotation}
        role={this.props.role}
        characterId={this.props.characterId}
        material={this.props.material}
        roomId={this.props.roomId}>
          <Barrel
          position='0 2 0'
          material={this.props.material}
          barrelLength={6}
          socket={this.props.socket}
          characterId={this.props.characterId}/>
        </PlayerDriver>
      )
    } else if(this.props.role === 'gunner') {
      return (
        <a-entity position='0 0 0' rotation='0 0 0'>
          <TankBody
          characterId={this.props.characterId}
          position={this.props.position}
          material={this.props.material}
          rotation={this.rotation}
          socket={this.props.socket}>
            <Turret
            activeControl={true}
            role={this.props.role}
            characterId={this.props.characterId}
            position={'0 2.75 0'}
            material={this.props.material}
            socket={this.props.socket}
            roomId={this.props.roomId}/>
            <a-cone
            position='0 0 -5'
            rotation='-90 0 0'
            radius-top='0'
            radius-bottom='0.25'
            height='1'
            material='color: blue; opacity: 0.5;'/>
          </TankBody>
        </a-entity>
      );
    }
  }
}

module.exports = PlayerTank;
