var gamejs = require('gamejs');
var $o = require('gamejs/utils/objects');
var server = require('./server');

var YWorld = exports.YWorld = function() {
   var self = this;

   this.agents = gamejs.http.load('./data/agents.json');
   this.continents = gamejs.http.load('./data/continents.json');
   this.connections = gamejs.http.load('./data/connections.json');
   // FIXME store adjacent in extra 'connections' and resolve it here
   // at load time for easy indexOf() lookup
   var rawCities = gamejs.http.load('./data/cities.json');
   this.cities = {};

   this.populations = {};
   $o.keys(this.continents).forEach(function(continent) {
      this.populations[continent] = 10000000;
   }, this);

   var $ = function(title) {
      return self.cities[title] || self.agents[title] || self.continents[title];
   };
   // convert raw cities into this.cities object
   $o.keys(rawCities).forEach(function(cityKey) {
      var $c = rawCities[cityKey];
      $c.continent = $o.keys(this.continents).filter(function(continentKey) {
         return $(continentKey).indexOf(cityKey) > -1;
      })[0];
      $c.infections = {};
      $c.adjacent = [];
      $o.keys(this.continents).forEach(function(continent) {
         $c.infections[continent] = 0;
      });
      this.cities[cityKey] = $c;
   }, this);

   // resolve connections
   this.connections.forEach(function(con) {
      var a = con[0];
      var b = con[1];
      if (!$(a) || !$(b)) return;
      $(a).adjacent.push(b);
      $(b).adjacent.push(a);

   });


   /**
    * the resolves, create by the server, modify the world
    */
   var APPLY = {
      setagentlocation: function(data) {
         $(data.agent).city = data.city;
      },
      increaseinfection: function(data) {
         var $city = $(data.city);
         $city.infections[data.strain]++;
      },
      decreaseinfection: function(data) {
         var $city = $(data.city);
         $city.infections[data.strain]--;
         if ($city.infections[data.strain] < 0) {
            gamejs.log('[World.apply] warning! infections < 0', data.strain,$city.infections[data.strain]);
            $city.infections[data.strain] = 0;
         }
      },
      setpopulation: function(data) {
         this.populations[data.continent] = data.count;
      },
   }

   /**
    * uses resolves to modify the world
    */
   this.handle = function(event) {
      if (event.type === server.RESULT) {
         APPLY[event.data.type].apply(this, [event.data]);
         gamejs.info('[YWorld.handle]', event);
         if (event.data.agent) {
            $(event.data.agent).currentAction = null;
         }
      } else if (event.type === server.ACTION) {
         if (event.data.agent) {
            $(event.data.agent).currentAction = event.data;
         }
      }

   }

   return this;
};
