var gamejs = require('gamejs');
exports.preload = function() {
   gamejs.preload([
      'images/worldmap.png',
      'images/hazard.png',
      'images/hazard_big.png',

      'sounds/marker1.wav',
      'sounds/marker2.wav',
      'sounds/marker4.wav',
      'sounds/marker5.wav',
      'sounds/sd0.wav',
      'sounds/heal.wav',
      'sounds/magicfail.wav',
      'sounds/magicfail2.wav',
      'sounds/zap6a.wav',
      'sounds/zap13.wav',
      'sounds/completetask0.wav',

      'images/ticker/decreaseinfection_0.png',
      'images/ticker/decreaseinfection_1.png',
      'images/ticker/increaseinfection_1.png',
      'images/ticker/increaseinfection_2.png',
      'images/ticker/increaseinfection_3.png'
   ]);
};
