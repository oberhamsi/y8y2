var gamejs = require('gamejs');
var server = require('./server');

exports.SoundManager = function(playerContinent) {

   var globalSounds = ['decreaseinfection', 'treat', 'increaseinfection'];

   this.handle = function(event) {
      if (event.type === server.RESULT || event.type === server.ACTION) {
         var soundType = event.data.type;
         if (sounds[soundType] && (globalSounds.indexOf(soundType) > -1 || event.data.player === playerContinent)) {
            sounds[soundType].play();
         }
      }
      if (event.type === server.VALIDATIONERROR && event.originalEvent.data.player === playerContinent) {
         sounds.validationError.play();
      }
   };

   var sounds = {
      'flight_sounds': [new gamejs.mixer.Sound('sounds/marker1.wav'),
            new gamejs.mixer.Sound('sounds/marker2.wav'),
            new gamejs.mixer.Sound('sounds/marker4.wav'),
            new gamejs.mixer.Sound('sounds/marker5.wav')
            ],
      'flight': {
         play: function() {
            sounds.flight_sounds[parseInt((sounds.flight_sounds.length-1) * Math.random(), 10)].play();
         }
      },
      'decraseinfection_sounds': [
         new gamejs.mixer.Sound('sounds/sd0.wav'),
         new gamejs.mixer.Sound('sounds/completetask0.wav')
      ],
      'decreaseinfection': {
         play: function() {
            sounds.decraseinfection_sounds[parseInt((sounds.decraseinfection_sounds.length-1) * Math.random(), 10)].play();
         }
      },
      'treat': new gamejs.mixer.Sound('sounds/heal.wav'),
      'validationError_sounds': [
         new gamejs.mixer.Sound('sounds/magicfail.wav'),
         new gamejs.mixer.Sound('sounds/magicfail.wav'),
      ],
      'validationError': {
         play: function() {
            sounds.validationError_sounds[parseInt((sounds.validationError_sounds.length-1) * Math.random(), 10)].play();
         }
      },
      'setagentlocation': new gamejs.mixer.Sound('sounds/zap13.wav'),
      'increaseinfection': new gamejs.mixer.Sound('sounds/zap6a.wav')
   };

   return this;
};
