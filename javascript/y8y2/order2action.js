var $objects = require('gamejs/utils/objects');
var gamejs = require('gamejs');

exports.ValidationError = ValidationError = function(data) {
   this.data = data;
   return this;
}

/**
 * creates actions for the passed order data
 * ***************************
 */
exports.order2action = {
   /**
    * flight->
    *   {Agent} agent
    *   {City} to
    *
    * ->flight
    *   {Agent} agent
    *   {City} From
    *   {City} To
    */
   flight: function(data) {
      var $agent = this.$(data.agent);
      if (data.player !== $agent.continent) {
         throw new ValidationError('notyouragent');
      }
      var from = $agent.city;
      var $from = this.$(from);
      if ($from.adjacent.indexOf(data.to) === -1) {
         gamejs.log('[order2act] ', 'Error: not adjacent ', from, '->', data.to);
         throw new ValidationError('notadjacent');
      }
      return [
         {
            type: 'flight',
            start: this.getCurrentTick(),
            duration: 5,
            agent: data.agent,
            from: from,
            to: data.to,
            player: data.player
         }
      ];
   },
   jet: function(data) {

   },
   build: function(data) {

   },
   treat: function(data) {
      var city = this.$(data.agent).city;
      if (this.$(data.agent).continent != data.player) {
         throw new ValidationError('notyouragent');
      }
      var $city = this.$(city);
      // has infection?
      var strains =  $objects.keys($city.infections).filter(function(strain) {
         return $city.infections[strain] > 0;
      });
      if (!strains.length) {
         throw new ValidationError('noinfection');
      }
      // no other agent is treating here?
      var isTreating = $objects.keys(this.getAgents()).some(function(agent) {
         var $agent = this.$(agent);
         return ($agent.currentAction && $agent.currentAction.type === 'treat' && $agent.currentAction.city === city);
      }, this);
      if (isTreating) {
         throw new ValidationError('onlyonetreatmentpercity');
      }

      var agentStrain = this.$(data.agent).continent;
      strains.sort(function(a,b) {
         if (a === agentStrain && b !== agentStrain) return -1;
         if (a !== agentStrain && b === agentStrain) return 1;
         if ($city.infections[a] > $city.infections[b]) return -1;
         if ($city.infections[a] < $city.infections[b]) return 1;
         return 0;
      });
      var strain = strains[0];
      var treatDuration = (strain === agentStrain) ? 5 : 50;
      return [
         {
            type: 'treat',
            start: this.getCurrentTick(),
            duration: treatDuration,
            agent: data.agent,
            city: city,
            strain: strain,
            player: data.player
         }
      ];
   },
   /*
    * ->infect
    *   {City} city
    *   {Continent} strain
    */
   infect: function(city) {
      var strain = this.getNextStrain();
      var cityKey = city || this.getRandomCity(strain);
      return [{
         type: 'infect',
         start: this.getCurrentTick(),
         duration: 0,
         city: cityKey,
         strain: strain
      }];
   }
};
