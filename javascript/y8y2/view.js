var gamejs = require('gamejs');
var $math = require('gamejs/utils/math');
var $o = require('gamejs/utils/objects');

var YWorld = require('./world').YWorld;
var CityMenu = require('./citymenu').CityMenu;
var STRAIN_COLORS = require('./citymenu').STRAIN_COLORS;
var dragdrop = require('./dragdrop');
var DragDrop =  dragdrop.DragDrop;
var server = require('./server');
var actionmarkers = require('./actionmarkers');
var Ticker = require('./ticker').Ticker;

// disable normal browser mouse select
var disableMouseSelect = function() {
   // no text select on drag
   document.body.style.webkitUserSelect = 'none';
   // non right clickery
   document.body.oncontextmenu = function(ev) { ev.preventDefault(); };
}

var YView = exports.YView = function(playerContinent) {

   var $ = function(title) {
      return yworld.cities[title] || yworld.agents[title];
   };

   var cityFont =  new gamejs.font.Font('20px "Ubuntu Mono"');
   var agentFont =  new gamejs.font.Font('15px "Ubuntu Mono"');
   /**
    * draw cities
    */
   this.draw = function(display) {
      display.blit(bakedBackground);
      cityLines.forEach(function(points) {
         gamejs.draw.line(
            display,
            '#000000',
            points[0],
            points[1],
            4
         );
         gamejs.draw.line(
            display,
            '#ffffff',
            points[0],
            points[1],
            3
         );
      });
      // draw city menues
      cityMenus.draw(display);

      // draw drag&drop
      dragDropCities.draw(display);

      var bgSize = bakedBackground.getSize();
      gamejs.draw.rect(display,'rgba(111,111,111,0.5)', new gamejs.Rect([0,0], [bgSize[0], 50]));
      // markers
      markers.draw(display);
      ticker.draw(display);

   };

   /**
    * update
    */
   this.update = function(msDuration) {
      markers.update(msDuration);
      cityMenus.update(msDuration);
      return;
   };

   /**
    * handle event
    */
   var lastMouseMotion = Date.now();
   this.handle = function(event) {
      // DROPPING
      if (event.type === dragdrop.DROPPING) {
         var originCityMenu = event.drag;
         var inactiveAgents = originCityMenu.agents.filter(function(agent) {
            var $agent = $(agent);
            return !$agent.currentAction && ($agent.continent === playerContinent);
         });
         if (inactiveAgents.length > 0) {
            var destinationCityMenu = event.dropTargets[0];
            var toCity = destinationCityMenu.cityKey;
            var agent = inactiveAgents[0];
            var fromCity = $(agent).city;
            if (fromCity === toCity) {
               gamejs.event.post({
                  type: server.ORDER,
                  data: {
                     type: 'treat',
                     agent: agent,
                     player: playerContinent
                  }
               });
            } else {
               gamejs.event.post({
                  type: server.ORDER,
                  data: {
                     type: 'flight',
                     agent: agent,
                     to: toCity,
                     player: playerContinent
                  }
               });
            }
         } else {
            gamejs.log('[YView.handle]', 'all agents busy or none present');
         }
      // RESULT
      } else if (event.type === server.RESULT) {
         yworld.handle(event);
         ticker.handle(event);

         var eventMarkerClassName = event.data.type.substring(0,1).toUpperCase()
                  + event.data.type.substr(1) + 'Marker';
         var eventMarkerClass = actionmarkers[eventMarkerClassName];
         if (eventMarkerClass) {
            markers.add(new eventMarkerClass(event.data, $));
         } else {
            gamejs.log('[YView.handle]', 'no marker ', eventMarkerClassName);
         }
      // VALIDATIONERROR
      } else if (event.type === server.VALIDATIONERROR) {
         gamejs.log('Validation Error "'+ event.reason + '" for event: ', event.originalEvent);
      } else if (event.type === server.ACTION) {
         yworld.handle(event);
         var eventMarkerClassName = event.data.type.substring(0,1).toUpperCase()
                  + event.data.type.substr(1) + 'Marker';
         var eventMarkerClass = actionmarkers[eventMarkerClassName];
         if (eventMarkerClass) {
            markers.add(new eventMarkerClass(event.data, $));
         } else {
            gamejs.log('[YView.handle]', 'no marker ', eventMarkerClassName);
         }
      // OTHER
      } else {
         /*
         helpers to generate cities.json
         if (event.type === gamejs.event.MOUSE_UP) {
            var city = prompt();
            var string = "$1: {pos: [$2, $3]}";
            console.log(string.replace('$1', city).replace('$2', event.pos[0]).replace('$3', event.pos[1]));
         }
         */
         dragDropCities.handle(event);
      }
   };

   this.getWorldReference = function() {
      return yworld;
   };

   /**
    * constructor
    */
   disableMouseSelect();
   var openMenus = new gamejs.sprite.Group();
   // create client world
   var yworld = new YWorld();
   // city icons with infeciton info, agents, etc
   var cityMenus = new gamejs.sprite.Group();
   for (var cityKey in yworld.cities) {
      cityMenus.add(new CityMenu($(cityKey), cityKey, yworld, playerContinent));
   }
   // drag & drop
   var proxySurface = new gamejs.Surface([32, 32]);
   gamejs.draw.circle(proxySurface, STRAIN_COLORS[playerContinent], [16, 16], 10);
   gamejs.draw.circle(proxySurface, 'black', [16, 16], 10, 1);
   var dragDropCities = new DragDrop({dragAbles: cityMenus, dropAbles: cityMenus, proxy: proxySurface});

   // markers for actions and results
   var markers = new gamejs.sprite.Group();

   // bake background
   var cityLines = [];
   for (var cityKey in yworld.cities) {
      var $city = yworld.cities[cityKey];
      $city.adjacent.forEach(function(acity) {
         cityLines.push([$city.pos, $(acity).pos]);
      });
   }
   var bakedBackground = gamejs.image.load('images/worldmap.png');

   // ticker

   var ticker = new Ticker(yworld);

   return this;
};
