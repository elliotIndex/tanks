AFRAME.registerComponent('death-listener', {
 schema: {
    characterId: { default: undefined },
  },

  init: function () {
    const el = this.el;
    const data = this.data;
    window.addEventListener('characterDestroyed', function (e) {
      // console.log(data.characterId, data.type, e.detail.characterId);
      if(data.characterId === e.detail.characterId) {
        if(el.components.spawner) {
          el.components.spawner.pause();
        }
        
        if(el.components['forward-movement-controls']) {
          el.components['forward-movement-controls'].pause();
        }
      }
      // const characterId = e.detail.characterId;
      // console.log('character killed:', characterId);

      // const blackPlane = document.createElement('a-plane');
      // blackPlane.setAttribute('position', '0 0 -0.2');
      // blackPlane.setAttribute('material', 'shader', 'flat');
      // el.appendChild(blackPlane);

      // const opacityAnimation = document.createElement('a-animation');
      // opacityAnimation.setAttribute('attribute', 'material.opacity');
      // opacityAnimation.setAttribute('from', 0);
      // opacityAnimation.setAttribute('to', 1);
      // opacityAnimation.setAttribute('dur', 1500);
      // opacityAnimation.setAttribute('easing', 'ease-out');

      // blackPlane.appendChild(opacityAnimation);
      // el.appendChild(blackPlane);

      // setTimeout(() => {
      //   el.removeChild(blackPlane)
      // }, 3000);
    });
  }
});
