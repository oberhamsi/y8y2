var gamejs = require('gamejs');
var $o = require('gamejs/utils/objects');
var $v = require('gamejs/utils/vectors');

var STRAIN_COLORS = require('./citymenu').STRAIN_COLORS;
var LEVEL_SIGNS = require('./actionmarkers').LEVEL_SIGNS;
var server = require('./server');

exports.Ticker = function(yworld) {

   var images = ['decreaseinfection_0', 'decreaseinfection_1',
      'increaseinfection_1', 'increaseinfection_2', 'increaseinfection_3'];

   var texts = {
      decreaseinfection: {
         2: 'Lowered Infection',
         1: 'Infection contained',
         0: 'Infection cured'
      },
      increaseinfection: {
         3: 'Epidemic',
         2: 'Infection worsened',
         1: 'Infection reported'
      }
   };

   var $ = function(title) {
      return yworld.cities[title] || yworld.agents[title];
   };

   var events = [];

   var getInfectionLevel = function ($city, continent) {
      var infectionLevel = 0;
      $o.keys($city.infections).forEach(function(strain) {
         if ($city.infections[strain] > 0) {
            infectionLevel += 1;
            if (continent && continent != strain) {
               infectionLevel +=1 ;
            }
         }
      });
      return infectionLevel;
   }

   var renderEventSurface = function(event) {
      var rect = new gamejs.Rect([0, 0], [280, 70]);
      var surface = new gamejs.Surface(rect);
      surface.fill('rgba(180, 180, 180, 0.5)');
      if (event.type === 'increaseinfection') {
         surface.blit(surfaces['increaseinfection_' + event.level]);
      } else if (event.type === 'decreaseinfection') {
         var level = Math.max(Math.min(1, event.level), 0);
         surface.blit(surfaces['decreaseinfection_' + level]);;
      }

      var citySrf = bigFont.render(event.city, STRAIN_COLORS[event.cityContinent]);
      var size = $v.add(citySrf.getSize(), [3,30]);
      pos = $v.subtract(rect.bottomright, size);
      surface.blit(citySrf, pos);

      var levelSign = LEVEL_SIGNS[Math.min(LEVEL_SIGNS.length-1, event.level)] || " ";
      var signSrf = bigFont.render(levelSign, STRAIN_COLORS[event.strain]);
      var size = signSrf.getSize();
      surface.blit(signSrf, $v.subtract(rect.bottomleft, [-3, size[1]+3]));

      var text = texts[event.type][event.level];
      var textSrf = font.render(text, '#dddddd')
      var size = $v.add(textSrf.getSize(), [3, 3]);
      var pos = $v.subtract(rect.bottomright, size);
      surface.blit(textSrf, pos);
      return surface;
   };

   this.handle = function(event) {
      if (event.type === server.RESULT) {
         if (['increaseinfection', 'decreaseinfection'].indexOf(event.data.type) > -1) {
            events.unshift(renderEventSurface({
               type: event.data.type,
               city: event.data.city.substring(0,1).toUpperCase() + event.data.city.substring(1,9),
               strain: event.data.strain,
               level: getInfectionLevel($(event.data.city)),
               cityContinent: $(event.data.city).continent
            }));
            if (events.length > 5) {
               events = events.splice(0, 5);
            }
         }
      }
   };

   this.draw = function(display) {
      var rect = new gamejs.Rect([0, 540], [280, 70]);
      events.forEach(function(surface) {
         display.blit(surface, rect);
         rect.moveIp(rect.width + 3, 0);
      });
   };

   var surfaces = {};
   images.forEach(function(img) {
      surfaces[img] = gamejs.image.load('images/ticker/' + img + '.png');
      return;
   });

   var font = new gamejs.font.Font('20px "Ubuntu Mono"');
   var bigFont = new gamejs.font.Font('40px "Ubuntu Mono"');
   return this;
};
