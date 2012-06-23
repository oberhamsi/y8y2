

/**
 * resolves actions to results which the world can use to modify its state.
 * ***************************
 */
exports.action2result = {
   /**
    *
    * flight->
    *    {Agent} agent
    *    {City} to
    *
    * ->setagentlocation
    *    {Agent} agent
    *    {City} city
    *
    */
   flight: function(data) {
      return [{
         type: 'setagentlocation',
         agent: data.agent,
         city: data.to,
         player: data.player
      }];
   },
   /**
    *
    *  infect->
    *     {City} city
    *     {Continent} Strain
    *
    *  ->increaseinfection
    *       {City} city
    *       {Continent} Continent
    */
   infect: function(data) {
      var results = [];
      var $city = this.$(data.city);
      // if already at 3, infect surrounding cities
      // FIXME this should be recursive
      if ($city.infections && $city.infections[data.strain] >= 3) {
         $city.adjacent.forEach(function(acity) {
            var $acity = this.$(acity);
            if ($acity.infections && $acity.infections[data.strain] < 3) {
               results.push({
                  type: 'increaseinfection',
                  city: acity,
                  strain: data.strain
               });
            }
         }, this);
      } else {
         results.push({
            type: 'increaseinfection',
            city: data.city,
            strain: data.strain
         })
      }
      return results;
   },
   treat: function(data) {
      return [
         {
            type: 'decreaseinfection',
            city: data.city,
            strain: data.strain,
            agent: data.agent,
            player: data.player
         }
      ];
   }
};
