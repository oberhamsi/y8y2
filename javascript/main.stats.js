var STRAIN_ORDER = require('./y8y2/server').STRAIN_ORDER;
var STRAIN_COLORS = require('./y8y2/citymenu').STRAIN_COLORS;

var $ = function(id) {
   return document.getElementById(id);
};

var QueryString = function () {
  // This function is anonymous, is executed immediately and 
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = document.location.hash.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = decodeURIComponent(arr);
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  } 
    return query_string;
} ();

var data = JSON.parse(QueryString.data);
$('stat-graph').src = QueryString.image;
var populations = data.populations;
var order = STRAIN_ORDER;
order.forEach(function(continent, idx) {
   var elem = $('remaining-' + continent);
   elem.innerHTML = populations[idx];
   elem.style.color = STRAIN_COLORS[continent];
});

for (var key in data.infections) {
   $('infections-' + key).innerHTML = data.infections[key];
};
