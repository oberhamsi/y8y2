
var SearchMap = exports.SearchMap = function(yworld) {

   this.adjacent = function(origin) {
      return yworld.cities[origin].adjacent.slice(0);
   };

   this.estimatedDistance = function(pointA, pointB) {
      return 1;
   };

   this.actualDistance = function(pointA, pointB) {
      return 1;
   };
   
   this.equals = function(pointA, pointB) {
      return (pointA === pointB);
   };
   
   this.hash = function(point) {
      return point;   
   }
   
   return this;
};
