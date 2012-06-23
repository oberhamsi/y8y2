var gamejs = require('gamejs');
var $objects = require('gamejs/utils/objects');
var $math = require('gamejs/utils/math');
var $v = require('gamejs/utils/vectors');

var STRAIN_ORDER = require('./server').STRAIN_ORDER;

var STRAIN_COLORS = exports.STRAIN_COLORS = {
   eu: '#fff711',
   asia: '#e78800',
   uae: '#ff1111',
   unasur: '#ff11ae'
};
exports.CITY_RADIUS = CITY_RADIUS = 15;

var CityMenu = exports.CityMenu = function($city, cityKey, yworld, playerContinent) {
   CityMenu.superConstructor.apply(this, []);

   var $ = function(title) {
      return yworld.cities[title] || yworld.agents[title] || yworld.players[title];
   };
   this.image = gamejs.image.load('images/hazard.png');
   var center = $city.pos;
   this.rect = new gamejs.Rect($v.subtract(center, [CITY_RADIUS, CITY_RADIUS]),
         [CITY_RADIUS * 2, CITY_RADIUS * 2]);

   this.draw = function(display) {
      gamejs.draw.circle(display, '#ffffff', center, CITY_RADIUS, 0);
      gamejs.draw.circle(display, STRAIN_COLORS[$city.continent], center, CITY_RADIUS+1, 3);
      gamejs.draw.circle(display, 'black', center, CITY_RADIUS-1, 1);

      // infections
      if ($city.infections) {
         for (var i=0;i<360;i+=30) {
            var strainIdx = parseInt((i/360) * 4, 10);
            var strainStep = parseInt((i - (strainIdx  * 90)) / 30, 10)
            var strain = STRAIN_ORDER[strainIdx];
            if ($city.infections[strain] > strainStep) {
               var color = STRAIN_COLORS[strain];
               var r2 = CITY_RADIUS;
               var x = center[0] + r2 * Math.cos($math.radians(i));
               var y = center[1] + r2 * Math.sin($math.radians(i));
               var infectionRadius = 8;
               var imgSize = this.image.getSize();
               var topLeft = [x - infectionRadius/3 - 4, y-infectionRadius/2 - 4];
               gamejs.draw.circle(display, color, [x, y], infectionRadius, 0);
               display.blit(this.image, topLeft);
               gamejs.draw.circle(display, 'black', [x, y], infectionRadius, 1);
            }
         };
      }
      // agents
      var agentsOnCity = $objects.keys(yworld.agents).filter(function(agent) {
         var $agent = $(agent);
         return $agent.city === cityKey && !$agent.currentAction;
      });
      var agentsPerContinent = {};
      var totalCount = 0;
      $objects.keys(yworld.continents).forEach(function(continent) {
         agentsPerContinent[continent] = agentsOnCity.filter(function(agent) {
            return $(agent).continent === continent;
         }).length;

         totalCount += agentsPerContinent[continent];
      });
      var ownCount = agentsPerContinent[playerContinent];
      if (totalCount > 0 && ownCount > 0) {
         //  '#66ff5a' '#098200'
         gamejs.draw.circle(display, STRAIN_COLORS[playerContinent], center, totalCount*3);
         gamejs.draw.circle(display, 'black', center, totalCount*3, 1);
      }
      var drawCount = totalCount-ownCount;
      $objects.keys(yworld.continents).forEach(function(continent) {
         if (continent === playerContinent) {
            return;
         }
         if (agentsPerContinent[continent] > 0) {
            if (drawCount > 0) {
               var size = ownCount > 0 ? 2 : 3;
               gamejs.draw.circle(display, STRAIN_COLORS[continent], center, drawCount*size);
            }
            drawCount -= agentsPerContinent[continent];
         }
      });

   };

   this.update = function(msDuration) {
   };

   $objects.accessors(this, {
      cityKey: {
         get: function() {
            return cityKey
         }
      },
      agents: {
         get: function() {
            return Object.keys(yworld.agents).filter(function(agent) {
               return $(agent).city === cityKey;
            });
         }
      }
   });
   return this;
};
$objects.extend(CityMenu, gamejs.sprite.Sprite);
