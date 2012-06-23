var gamejs = require('gamejs');
var objects = require('gamejs/utils/objects');
var arrays = require('gamejs/utils/arrays');

var YServer = require('./y8y2/server').YServer;
var YView = require('./y8y2/view').YView;
var server = require('./y8y2/server');
var Player = require('./y8y2/ai/player').Player;
var SoundManager = require('./y8y2/sounds').SoundManager;
var StatisticGatherer = require('./y8y2/statistic').StatisticGatherer;

require('./y8y2/preloader').preload();

gamejs.ready(function() {
   // prepare client view
   var playerContinent = document.location.hash && document.location.hash.substring(1) || 'eu';
   var display = gamejs.display.setMode(gamejs.image.load('images/worldmap.png').getSize());
   var yview = new YView(playerContinent);
   var sounds = new SoundManager(playerContinent);
   var clientWorld = yview.getWorldReference();
   // setup statistic gathering unit
   var statGatherer = window.statGatherer = new StatisticGatherer(clientWorld, playerContinent);
   // setup ai players
   // they re-use the client's world but read-only (hopefully) to determin
   // what to do
   var aiPlayers = arrays.shuffle(objects.keys(clientWorld.continents)).filter(function(continent) {
      return continent !== playerContinent;
   }).map(function(continent) {
      return (new Player(clientWorld, continent));
   });
   // create server
   var yserver = window.yserver = new YServer();
   var isRunning = true;
   var isForwarded = false;
   function tick(msDuration) {
      if (!isRunning) {
         if (!isForwarded) {
            var statData = statGatherer.toJSON();
            statGatherer.render();
            var statImageData = statGatherer.image._canvas.toDataURL();
            document.location.href = "./stats.html#data=" + encodeURIComponent(JSON.stringify(statData)) + "&image=" +encodeURIComponent(statImageData);
            isForwarded = true;
         }
         return;
      }
      yview.update(msDuration);
      statGatherer.update(msDuration);
      // game loop
      yserver.update(msDuration);
      gamejs.event.get().forEach(function(event) {
         if (event.type === server.GAMESTATE) {
            if (event.data.gameOver) {
               isRunning = false;
               statGatherer.render();
               return;
            }
         }
         if (event.type === server.ORDER) {
            yserver.handle(event);
         } else {
            if (event.type === server.RESULT) {
               statGatherer.handle(event);
            }
            yserver.handle(event);
            yview.handle(event);
            sounds.handle(event);
            aiPlayers.forEach(function(aiPlayer) {
               aiPlayer.handle(event);
            });
         }
      });
      display.clear();
      yview.draw(display);
      return;
   };
   gamejs.time.fpsCallback(tick, this, 26);
});
