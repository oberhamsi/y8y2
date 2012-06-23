var objects = require('gamejs/utils/objects');
var $v = require('gamejs/utils/vectors');
var gamejs = require('gamejs');

var server = require('./server');
var STRAIN_ORDER = require('./server').STRAIN_ORDER;
var STRAIN_COLORS = require('./citymenu').STRAIN_COLORS;

exports.StatisticGatherer = function(yworld, playerContinent) {

   var pops = [];
   var cured = [];
   
   
   var GATHER_DELTA = 1000;
   var lastGather = 0;
   var tick = 0;
   
   this.handle = function(event) {
   
      if (event.type === server.RESULT && 
         event.data.type === 'decreaseinfection'
         && event.data.player === playerContinent) {
         cured.push({
            city: event.data.city,
            strain: event.data.strain
         });
      };
   }
   
   this.update = function(msDuration) {
      var now = Date.now();
      if (now  - lastGather > GATHER_DELTA) {
         pops[tick] = [];
         
         objects.keys(yworld.continents).forEach(function(continent) {
            pops[tick][STRAIN_ORDER.indexOf(continent)] = yworld.populations[continent];
            return;
         }, this);
      
         lastGather = now;
         tick++;
      }
   };
   var formatNumber = function(n, c, d, t) {
   var c = isNaN(c = Math.abs(c)) ? 2 : c, d = d == undefined ? "," : d, t = t == undefined ? "." : t, s = n < 0 ? "-" : "", i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", j = (j = i.length) > 3 ? j % 3 : 0;
   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

   this.toJSON = function() {
      var local = cured.filter(function(c) {
         return cities.indexOf(c.city) > -1;
      }).length;
      var foreign = cured.length - local;
      var domestic = cured.filter(function(c){
         return c.strain === playerContinent;
      }).length;
      var nondomestic = cured.length - domestic;
      return {
         populations: pops.slice(-1)[0].map(function(nr) {
            return formatNumber(nr, 0, '.',',');
         }),
         infections: {
            local: local,
            foreign: foreign,
            domestic: domestic,
            nondomestic: nondomestic
         }
      };
   };

   this.render = function() {
      // render population bars
      this.image = new gamejs.Surface([600, 420]);
      var width = 2;
      var bottomleft = [20, 420];
      pops.forEach(function(ps, tick) {
         var rowBottomleft = bottomleft;
         ps.forEach(function(p, continentIdx) {
            var cTop = $v.subtract(rowBottomleft, [0, p / 100000]);
            var continent = STRAIN_ORDER[continentIdx];
            var color = STRAIN_COLORS[continent];
            gamejs.draw.line(this.image, color, rowBottomleft, cTop, width);
            rowBottomleft = $v.subtract(bottomleft, [0, bottomleft[1] / 4 * (continentIdx+1)]);
         }, this);
         bottomleft = $v.add(bottomleft, [width+1, 0]);
      }, this);
   };
   
   var cities = objects.keys(yworld.cities).filter(function(city) {
      return city.continent === playerContinent;
   });
   
   return this;
};
