var $objects = require('gamejs/utils/objects');
var server = require('../server');
var astar = require('gamejs/pathfinding/astar');
var SearchMap = require('./searchmap').SearchMap;

var gamejs = require('gamejs');

var DEBUG = false;

var STATE_IDLE = 0;
var STATE_ONROUTE = 1;
var STATE_TREATING = 2;

var Agent = exports.Agent = function(agent, playerContinent, yworld) {


   var $ = this.$ = function(title) {
      return yworld.cities[title] || yworld.agents[title];
   };

   var path = [];
   var state = STATE_IDLE;
   var $agent = $(agent);
   var destinationCity = null;
   var nextCity =  null;
   var futureDestinationCity = null;

   this.handle = function(event) {
      if (event.type === server.VALIDATIONERROR) {
         if (event.reason === 'noinfection' || event.reason === 'onlyonetreatmentpercity' || event.type === 'treatfailed') {
            if (this.isTreating()) {
               this.setIdle();
            }
            gamejs.log('Agent.handle ', 'setting idle due to treat problem ', agent);
         } else if (event.reason === 'notadjacent') {
            this.setIdle();
            gamejs.warn('Agent.handle ', '!! trying to move to non-adjacent field ', agent, ' to city  ', event.originalEvent.data.to);
         } else {
            gamejs.warn('Agent.handle ', '!! unhandled VALIDATIONERROR for agent ', agent, ' key: ', event.reason);
         }
      } else if (event.type === server.RESULT && event.data.type === 'setagentlocation') {
         if ($agent.city !== event.data.city) {
            gamejs.warn('Agent.handle ', '!! agent not on expected city', $agent.city, event.data.city);
            this.setIdle();
         } else {
            this.procede();
         }
      }
   };

   this.procede = function() {
      if (state === STATE_ONROUTE) {
         nextCity = path.shift();
         if (nextCity) {
            gamejs.event.post({
               type: server.ORDER,
               data: {
                  type: 'flight',
                  agent: agent,
                  to: nextCity,
                  player: playerContinent
               }
            });
         // start treat
         } else {
            state = STATE_TREATING;
            gamejs.event.post({
               type: server.ORDER,
               data: {
                  type: 'treat',
                  agent: agent,
                  city: $agent.city,
                  player: playerContinent
               }
            });
         }
      }
   };

   this.isBusy = function() {
      return state > STATE_IDLE;
   }

   this.isTreating = function() {
      return state === STATE_TREATING;
   }
   
   this.isOnRoute = function() {
      return state === STATE_ONROUTE;
   }

   this.setIdle = function() {
      state = STATE_IDLE;
      nextCity = null;
      destinationCity = null;
      path = [];
      if (futureDestinationCity) {
         this.setDestinationCity(futureDestinationCity);
      }
      return;
   }

   this.setDestinationCity = function(city) {
      destinationCity = city;
      futureDestinationCity = null;
      var route = this.getRoute(city);
      if (route) {
         while (route && route.point) {
            path.push(route.point);
            route = route.from;
         }
         path.reverse();
         path.shift();
         state = STATE_ONROUTE;
         this.procede();
         DEBUG && gamejs.log('[Agent.setDestination]', agent, path, destinationCity);
      } else {
         DEBUG && gamejs.log('[Agent.setDestination]', '!! warn, no route', this.getCity(), '->', destinationCity);
      }
   };

   this.setFutureDestinationCity = function(city) {
      DEBUG && gamejs.log('[Agent.setFutureDestinationCity]', agent, city);
      if (this.isBusy()) {
         futureDestinationCity = city;
      } else {
         this.setDestinationCity(city);
      }
   };

   this.getRoute = function(city) {
      return findRoute(this.getCity(), city);
   };

   this.getKey = function() {
      return agent;
   }

   this.getCity = function() {
      if (state === STATE_ONROUTE) {
         return nextCity;
      } else {
         return $agent.city
      }
   };

   this.getCurrentPathLength = function() {
      return path && path.length || 0;
   }

   this.getDestinationCity = function() {
      return futureDestinationCity || destinationCity;
   }

   var searchMap = new SearchMap(yworld);
   var findRoute = function(from, to) {
      return astar.findRoute(searchMap, from, to, 3000);
   };


   return this;
};
