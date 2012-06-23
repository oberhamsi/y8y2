var $objects = require('gamejs/utils/objects');
var server = require('../server');
var astar = require('gamejs/pathfinding/astar');
var Agent = require('./agent').Agent;

var gamejs = require('gamejs');

var DEBUG = false;

exports.Player = function(yworld, playerContinent) {

   var $ = this.$ = function(title) {
      return yworld.cities[title] || yworld.agents[title];
   };

   var passToAgent = function(event) {
      var eventAgent = (event.data && event.data.agent || event.originalEvent && event.originalEvent.data.agent);
      aiAgents.forEach(function(agent) {
         if (agent.getKey() === eventAgent) {
            agent.handle(event);
         }
      });
   }

   var APPLY = {
      // increase priority
      'increaseinfection': function(data) {
         this.update();
      },
      // decrease priority
      'decreaseinfection': function(data) {
         this.update();
      },
      'treatfailed': passToAgent,
      'setagentlocation': passToAgent,
   };

   this.handle = function(event) {
      if (event.type === server.RESULT) {
         if (APPLY[event.data.type]) {
            APPLY[event.data.type].apply(this, [event]);
         }
      } else if (event.type === server.VALIDATIONERROR) {
         APPLY.treatfailed.apply(this, [event]);
      }
   };

   var infectionSum = function(city) {
      var sum = 0;
      $objects.keys(yworld.continents).forEach(function(continent) {
         var add = 0;
         var concerFactor = 1;
         if (cities.indexOf(city) === -1 && continent !== playerContinent) {
            concerFactor = 0;
         }
         add += (cities.indexOf(city) > -1) ? 5 : 0;
         add += (continent === playerContinent) ? 10 : 0;
         add *= Math.max($(city).infections[continent], 0);
         add *= concerFactor;
         sum += add;
      });
      return sum;
   };

   var agentEngagingCity = function(city) {
      var engaged = aiAgents.filter(function(agent) {
         return agent.getDestinationCity() === city && agent.isBusy() || agent.getCity() === city && agent.isTreating();
      });
      return engaged && engaged[0] || null;
   }
   this.update = function() {
      var sortedCities = $objects.keys(yworld.cities);
      sortedCities.sort(function(a, b) {
         return infectionSum(b) - infectionSum(a);
      }, this);
      var agentsUpdatedThisRound = [];
      sortedCities.forEach(function(city) {
         var infections = $(city).infections;
         var sum = infectionSum(city);
         var agent = agentEngagingCity(city);

         // no infection
         if (sum <= 0) {
            if (agent && agent.isTreating()) {
               agent.setIdle();
               gamejs.log('[Player.update] Canceled treat order', agent.getKey());
            }
            return;
         // already engaged
         } else if (agent) {
            DEBUG && gamejs.log('[Player.update] Not pondering:', city, ' because engaged:', agent.getKey());
            return;
         }
         DEBUG && gamejs.log('[Player.update] Pondering:', city);

         aiAgents.sort(function(a, b) {
            var aRoute = a.getRoute(city);
            var bRoute = b.getRoute(city);
            return Math.max(aRoute && aRoute.length, 0) - Math.max(bRoute && bRoute.length, 0);
         });
         aiAgents.some(function(aiAgent) {
            if (agentsUpdatedThisRound.indexOf(aiAgent.getKey()) > -1) {
               return false;
            }
            var route = aiAgent.getRoute(city);
            DEBUG && gamejs.log('[Player.update]', aiAgent.getKey(), 
                     ' agent route from ', aiAgent.getCity(),
                     '[busy: ',aiAgent.isBusy(), ' treating: ', aiAgent.isTreating(), ']: ', route);
            if (!route) {
               DEBUG && gamejs.log('[Player.update] Error: no route for agent in ', aiAgent.getCity(0));
               return false;
            }
            if (aiAgent.isBusy()) {
               if (aiAgent.isTreating() ) {
                  aiAgent.setFutureDestinationCity(city);
                  agentsUpdatedThisRound.push(aiAgent.getKey());
                  return true;
               } else if (aiAgent.isOnRoute()) {
                  var currentDistance = aiAgent.getCurrentPathLength() || 1;
                  var currentLevel = infectionSum(aiAgent.getDestinationCity());
                  var nextLevel = infectionSum(city);
                  var nextDistance = Math.max(route && route.length, 0);
                  var changeTarget = (currentDistance / currentLevel) > (nextDistance / nextLevel);
                  if (changeTarget) {
                     DEBUG && gamejs.log('[Player.update] Change task ',
                        ' Target city', aiAgent.getDestinationCity(), ' -> ', city,
                        ' reasoning: ', (currentDistance / currentLevel) , (nextDistance / nextLevel)
                     );
                     aiAgent.setFutureDestinationCity(city);
                     agentsUpdatedThisRound.push(aiAgent.getKey());
                     return true;
                  }
               }
            } else {
               aiAgent.setDestinationCity(city);
               agentsUpdatedThisRound.push(aiAgent.getKey());
               return true;
            }
            return false;
         });

      });
   };

   // player agents
   var aiAgents = [];
   $objects.keys(yworld.agents).filter(function(agent) {
      return $(agent).continent === playerContinent;
   }).forEach(function(agent) {
      aiAgents.push(new Agent(agent, playerContinent, yworld));
   });

   // player's cities
   var cities = $objects.keys(yworld.cities).filter(function(city) {
      return $(city).continent === playerContinent;
   });

   // DEBUG help
   if (DEBUG) {
      window.$ = $;
      if (!window.aiAgents) {
         window.aiAgents = {};
      }
      if (!window.priorities) {
         window.priorities = {};
      }
      window.aiAgents[playerContinent] = aiAgents;
      window.priorities[playerContinent] = priorities;
   }

   return this;
};
