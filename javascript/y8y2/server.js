var gamejs = require('gamejs');
var $o = require('gamejs/utils/objects');
var arrays = require('gamejs/utils/arrays')
var YWorld = require('./world').YWorld;
var ValidationError = require('./order2action').ValidationError;
var order2action = require('./order2action').order2action;
var action2result = require('./action2result').action2result;

var DEBUG = false;

// event types
var ORDER = exports.ORDER = 30;
var VALIDATIONERROR = exports.VALIDATIONERROR = 31;
var RESULT = exports.RESULT = 32;
var ACTION = exports.ACTION = 33;
var GAMESTATE = exports.GAMESTATE = 34;

var STRAIN_ORDER = exports.STRAIN_ORDER = ['eu', 'asia', 'uae', 'unasur'];

var PHASE = [
   {
      maxNewInfected: 4,
      maxAdjacentInfected: 6,
      
      newInfectDelta: 19,
      adjacentInfectDelta: 17,
      
      newInfectCount: 1,
      adjacentInfectCount: 1
   },
   {
      maxNewInfected: 6,
      maxAdjacentInfected: 8,
      
      newInfectDelta: 15,
      adjacentInfectDelta: 28,
      
      newInfectCount: 1,
      adjacentInfectCount: 2
   }
];
var GAME_DURATION = exports.GAME_DURATION = 200;


// infect
//    change city infection
// charter flight
//    move agent
// private jet
//    move agent
// build research station
//    add station in city
// cure infection
//    change city infection
// treat disease
//    global marker

var YServer = exports.YServer = function () {
   var currentTick = 0;
   var tickTimeout = YServer.TICK_DURATION;
   var activeActions = [];

   var $ = this.$ = function(title) {
      return yworld.cities[title] || yworld.agents[title];
   };

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

   /**
    * removes actions when done and turns them into results
    */
   this.update = function(msDuration) {
      var results = [];
      tickTimeout -= msDuration;
      if (tickTimeout <= 0) {
         var phaseIdx = parseInt(currentTick * PHASE.length / GAME_DURATION, 10);
         if (PHASE[phaseIdx] !== phase) {
            phase = PHASE[phaseIdx]
            var gameOver = phase === undefined
            gamejs.event.post({
               type: GAMESTATE,
               data: {
                  phaseIdx: phaseIdx,
                  gameOver: gameOver
               }
            });
            if (gameOver) {
               return;
            }
         }
         var infectedCities = $o.keys(yworld.cities).filter(function(city) {
            return getInfectionLevel($(city)) > 0;
         });

         // infect new cities
         if (currentTick % phase.newInfectDelta === 0 && infectedCities.length < phase.maxNewInfected) {
            var i = phase.newInfectCount;
            while (i-->0) {
               var infectActions = order2action.infect.apply(this, []);
               infectActions.forEach(function(action) {
                  gamejs.event.post({
                     type: ACTION,
                     data: action
                  });
               });
            }
         }
         // infect adjacent cities
         if (currentTick % phase.adjacentInfectDelta === 0 && infectedCities.length < phase.maxAdjacentInfected) {
            var adjacentDeepList = infectedCities.map(function(city) {
               return $(city).adjacent;
            });
            if (adjacentDeepList.length) {
               var adjacentCities = adjacentDeepList.reduce(function(a, b) {
                  return a.concat(b);
               });
               arrays.shuffle(adjacentCities);
               var i = phase.adjacentInfectCount;
               while (adjacentCities.length > i && i-->0) {
                  var infectActions = order2action.infect.apply(this, [adjacentCities[i]]);
                  infectActions.forEach(function(action) {
                     gamejs.event.post({
                        type: ACTION,
                        data: action
                     });
                  });
               }
            }
         }
         // actions -> results
         activeActions = activeActions.filter(function(action) {
            if (currentTick >= action.start + action.duration) {
               var results = action2result[action.type].apply(this, [action]);
               results.forEach(function(result) {
                  gamejs.event.post({
                     type: RESULT,
                     data: result

                  });
               });
               return false;
            }
            return true;
         }, this);
         if (currentTick % 5 == 0) {
            // kill population
            $o.keys(yworld.continents).forEach(function(continent) {
               var continentInfectionLevels = $o.keys(yworld.cities).map(function(cityKey) {
                  var $city = $(cityKey);
                  if ($city.continent !== continent) {
                     return 0;
                  } else {
                     return getInfectionLevel($city, continent);
                  }
               });
               var sumLevels = continentInfectionLevels.reduce(function(a,b) {
                  return a + b;
               }, 0);
               var deathRate = sumLevels * 0.01;
               if (deathRate === 0) {
               // BAIL OUT
                  return;
               }
               var currentCount = yworld.populations[continent];
               var newCount = currentCount - (currentCount * deathRate)
               gamejs.event.post({
                  type: RESULT,
                  data: {
                     type: 'setpopulation',
                     continent: continent,
                     count: newCount,
                     deathRatePerMs: (deathRate / (5 * YServer.TICK_DURATION)),
                     duration: 5 * YServer.TICK_DURATION
                  }
               });
            });
         }
         currentTick++;
         tickTimeout = YServer.TICK_DURATION;
      }
      return;
   };
   /**
    * turns order into actions which the server can process and the view
    * can display
    */
   this.handle = function(event) {
      if (event.type === ORDER) {
         var actions = [];
         var errors = [];
         try {
            DEBUG && gamejs.log('[YServer.handle] order2action:', event);
            // FIXME if the relevant agent already has an assigment:
            //    cancel it
            actions = order2action[event.data.type].apply(this, [event.data]);
         } catch (e) {
            if (e instanceof ValidationError) {
               gamejs.event.post({
                  type: VALIDATIONERROR,
                  reason: e.data,
                  originalEvent: event // FIXME need original event to better display problem
               });
            } else {
               throw e;
            }
         }
         actions.forEach(function(action) {
            DEBUG && gamejs.log('[Yserver.handle] creating action: ', action);
            gamejs.event.post({
               type: ACTION,
               data: action
            });
         });
      } else if (event.type === ACTION) {
         activeActions.push(event.data);
         yworld.handle(event);
      } else if (event.type === RESULT) {
         yworld.handle(event);
      } else {
         DEBUG && gamejs.log('[YServer.handle] unknown type ', event.type);
      }
      return;
   };

   this.getRandomCity = function(strain) {
      var itOrNeighbourHasThatInfection = function ($city) {
         return $city.infections[strain] > 0 || $city.adjacent.some(function(cityKey) {
            return $(cityKey).infections[strain] > 0;
         });
      }
      var fromThatContinent = function($city) {
         return $city.continent === strain;
      }
      var weightedCityKeys = $o.keys(yworld.cities);
      weightedCityKeys.forEach(function(cityKey) {
         var $city = $(cityKey);
         if (itOrNeighbourHasThatInfection($city)) {
            var i = 2;
            while (i-->0) {
               weightedCityKeys.push(cityKey);
            }
         } else if (fromThatContinent($city)) {
            var i = 6;
            while (i-->0) {
               weightedCityKeys.push(cityKey);
            }
         }
      });
      return weightedCityKeys[parseInt((weightedCityKeys.length - 1) * Math.random(), 10)];
   };
   var strainIdx = 0;
   this.getNextStrain = function() {
      if (strainIdx >= STRAIN_ORDER.length) {
         strainIdx = 0;
      }
      try {
         return STRAIN_ORDER[strainIdx];
      } finally {
         strainIdx++;
      }
   }
   this.getCurrentTick = function() {
      return currentTick;
   };

   this.getAgents = function() {
      return yworld.agents;
   };

   /**
    * Constructor
    */
   var yworld = new YWorld();
   var phase = null;

   return this;
};

exports.TICK_DURATION = YServer.TICK_DURATION = 1000;
