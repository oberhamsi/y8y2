var gamejs = require('gamejs');
var $objects = require('gamejs/utils/objects');
var $v = require('gamejs/utils/vectors');
/**
 * event type sent when dragging starts
 *
 *     {type, pos, drag}
 */
var DRAGSTART = exports.DRAGSTART = 25;
/**
 * event type sent when the dragged object is dropped on one or more dropAbles
 *
 *     {type, pos, drag, dropTargets}
 */
var DRAGGING = exports.DRAGGING = 26;
var DROPPING = exports.DROPPING = 27;

/**
 * Posts events to the gamejs.event queue.
 * @param {Object} options,
 * @example
 *    {
 *     dragAbles: gamejs.sprite.Group,
 *     dropAbles: gamejs.sprite.Group,
 *     proxy: gamejs.sprite.Sprite || null (if null: dragged object will be used)
 *    }
 *
 */
exports.DragDrop = function(options) {

   var opts = $objects.merge(options, {
      dragAbles: new gamejs.sprite.Group(),
      dropAbles: new gamejs.sprite.Group(),
      proxy: null
   });

   var isDragging = false;
   var dragSprite = null;
   var proxyPos = [0,0];
   this.handle = function(event) {
      if (!dragSprite && event.type === gamejs.event.MOUSE_DOWN) {
         var dragging = opts.dragAbles.collidePoint(event.pos);
         if (dragging.length > 0) {
            dragSprite = dragging[0];
            gamejs.event.post({
               type: DRAGSTART,
               pos: event.pos,
               drag: dragSprite
            });
         }
         proxyPos = event.pos;
      } else if (dragSprite && event.type === gamejs.event.MOUSE_UP) {
         var dropTargets = opts.dropAbles.collidePoint(event.pos);
         if (dropTargets.length > 0) {
            gamejs.event.post({
               type: DROPPING,
               pos: event.pos,
               drag: dragSprite,
               dropTargets: dropTargets

            });
         }
         dragSprite = null;
         proxyPos = null;
      } else if (dragSprite && event.type === gamejs.event.MOUSE_MOTION) {
         if (dragSprite) {
            proxyPos = event.pos;
         }
      }
   };

   this.draw = function (display) {
      if (dragSprite) {
         var img = (opts.proxy || dragSprite.image);
         display.blit(img, $v.subtract(proxyPos, $v.divide(img.getSize(),2))   );
      }
   };

   return;
};
