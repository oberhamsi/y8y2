var gamejs = require('gamejs');
var $objects = require('gamejs/utils/objects');
var $v = require('gamejs/utils/vectors');
var server = require('./server');
var CITY_RADIUS = require('./citymenu').CITY_RADIUS;
var STRAIN_COLORS = require('./citymenu').STRAIN_COLORS;
/**
 * FlightMarker
 */
var FlightMarker = exports.FlightMarker = function(event, $) {
   FlightMarker.superConstructor.apply(this, []);

   var duration = event.duration * server.TICK_DURATION;
   var color = STRAIN_COLORS[$(event.agent).continent];
   var $fromCity = $(event.from);
   var $toCity = $(event.to);
   var delta = $v.subtract($toCity.pos, $fromCity.pos);
   var distance = $v.len(delta) - CITY_RADIUS * 2;
   var direction = $v.unit(delta);
   var origin = $v.add($fromCity.pos, $v.multiply(direction, CITY_RADIUS));
   var progress = 0;
   this.update = function(msDuration) {
      progress += msDuration;
      if (progress >= duration) {
         this.kill();
      }
   }

   this.draw = function(display) {
      var endPos = $v.add(origin, $v.multiply(direction, distance * (progress/duration)));
      // '#098200'
      gamejs.draw.line(display, 'black', origin, endPos, 7);
      gamejs.draw.line(display, color, origin, endPos, 5);
   };

   return this;
}
$objects.extend(FlightMarker, gamejs.sprite.Sprite);

/**
 * SetagentlocationMarker
 */
var SetagentlocationMarker = exports.SetagentlocationMarker = function(event, $) {
   SetagentlocationMarker.superConstructor.apply(this, []);

   var duration = 1000;
   var progress = 0;

   var $city = $(event.city);
   var color = STRAIN_COLORS[$(event.agent).continent];
   this.update =function(msDuration) {
      progress += msDuration;
      if (progress >= duration) {
         this.kill();
      }
   }

   this.draw = function(display) {
      if (progress % 500 < 250) {
         gamejs.draw.circle(display, color, $city.pos, CITY_RADIUS + 2, 0);
      }
   };

   return this;
};
$objects.extend(SetagentlocationMarker, gamejs.sprite.Sprite);


/**
 * DecreaseinfectionMarker
 */
var DecreaseinfectionMarker = exports.DecreaseinfectionMarker = function(event, $) {
   DecreaseinfectionMarker.superConstructor.apply(this, []);

   var duration = 1500;
   var progress = 0;

   var $city = $(event.city);
   var color = STRAIN_COLORS[event.strain];
   var origImage = new gamejs.Surface([CITY_RADIUS*2, CITY_RADIUS * 2]);
   origImage.fill(color);
   origImage.blit(gamejs.image.load('images/hazard_big.png'));
   this.image = origImage.clone();
   var rotatePerMs = 0.5;
   var currRotate = 0;
   var smallerPerSec = 15;
   var currSize = $v.multiply(this.image.getSize(), 2.1);
   var alphaPerSec = 0.3;
   var currAlpha = 0.1;
   this.rect = $v.subtract($city.pos, [CITY_RADIUS * 1.5, CITY_RADIUS * 1.5]);
   this.update = function(msDuration) {
      progress += msDuration;
      currRotate += (rotatePerMs * msDuration);
      var smallerDelta = (smallerPerSec * (msDuration/1000));
      if (currSize[0] > smallerDelta && currSize[1] > smallerDelta) {
         currSize = [currSize[0] - smallerDelta, currSize[1] - smallerDelta];
      }
      currAlpha += (alphaPerSec * (msDuration/1000));
      origImage.setAlpha(currAlpha);
      this.image = gamejs.transform.rotate(origImage.clone(), currRotate);
      this.image = gamejs.transform.scale(this.image, currSize);
      if (progress >= duration) {
         this.kill();
      }
   }

   return this;
};
$objects.extend(DecreaseinfectionMarker, gamejs.sprite.Sprite);

/**
 * IncreaseinfectionMarker
 */
var IncreaseinfectionMarker = exports.IncreaseinfectionMarker = function(event, $) {
   IncreaseinfectionMarker.superConstructor.apply(this, []);

   var duration = 1500;
   var progress = 0;

   var $city = $(event.city);
   var image = gamejs.image.load('images/hazard_big.png');
   this.image = new gamejs.Surface(image.getSize());
   this.image.fill(STRAIN_COLORS[event.strain]);
   this.image.blit(image);
   this.rect = $v.subtract($city.pos, [CITY_RADIUS, CITY_RADIUS]);

   this.update =function(msDuration) {
      progress += msDuration;
      if (progress >= duration) {
         this.kill();
      }
   }

   this.draw = function(display) {
      if (progress % 500 < 250) {
         display.blit(this.image, this.rect);
      }
   };

   return this;
};
$objects.extend(IncreaseinfectionMarker, gamejs.sprite.Sprite);

/**
 * TreatMarker
 */
var TreatMarker = exports.TreatMarker = function(event, $) {
   TreatMarker.superConstructor.apply(this, []);

   var duration = event.duration * server.TICK_DURATION;
   var $city = $(event.city);
   this.rect = {center: $city.pos, width: CITY_RADIUS*1.5};
   var progress = 0;
   var color = STRAIN_COLORS[$(event.agent).continent];
   this.update = function(msDuration) {
      progress += msDuration;
      if (progress >= duration) {
         this.kill();
      }
   }

   this.draw = function(display) {
      var stopAngle = 360 * (progress / duration);
      // '#3baeff'
      gamejs.draw.arc(display, color, this.rect, stopAngle, 0, 0);
      gamejs.draw.arc(display, 'black', this.rect, stopAngle, 0, 2);
   };

   return this;
}
$objects.extend(TreatMarker, gamejs.sprite.Sprite);

/**
 * SetpopulationMarker
 */
var POPULATION_POSITIONS = {
   'eu': [550, 3],
   'uae': [760, 3],
   'unasur': [80, 3],
   'asia': [980, 3]
};
var LEVEL_SIGNS = exports.LEVEL_SIGNS = [
   '',
   '☣',
   '☠',
   '☠☠'
]
var formatNumber = function(n, c, d, t) {
   var c = isNaN(c = Math.abs(c)) ? 2 : c, d = d == undefined ? "," : d, t = t == undefined ? "." : t, s = n < 0 ? "-" : "", i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", j = (j = i.length) > 3 ? j % 3 : 0;
   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

var SetpopulationMarker = exports.SetpopulationMarker = function(event, $) {
   SetpopulationMarker.superConstructor.apply(this, []);

   var duration = event.duration + 250;
   var progress = 0;
   var count = event.count;
   var cCount = count;
   var deathRatePerMs = event.deathRatePerMs;
   var rawLevel = ((deathRatePerMs * 1000000) / 4) - 1;
   var level = Math.min(3, parseInt(rawLevel,10));
   var sign = LEVEL_SIGNS[level];
   var string = parseInt(cCount, 10);
   var font =  new gamejs.font.Font('25px "Ubuntu Mono"');
   var image = font.render(string, STRAIN_COLORS[event.continent]);
   this.update =function(msDuration) {
      progress += msDuration;
      cCount -= msDuration * deathRatePerMs * cCount;
      if (progress % 100 < 50) {
         string = formatNumber(parseInt(cCount, 10), 0, '.',',')
         if (level > 0) string += ' [' + sign + ']';
         image = font.render(string, STRAIN_COLORS[event.continent]);
      }
      if (progress >= duration) {
         this.kill();
      }
   }
   this.draw = function(display) {
      display.blit(
         image,
         POPULATION_POSITIONS[event.continent]
      );
   }

   return this;
}
$objects.extend(SetpopulationMarker, gamejs.sprite.Sprite);
