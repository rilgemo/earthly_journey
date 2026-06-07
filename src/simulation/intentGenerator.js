const {
  evaluateFieldMatch,
  evaluateManaResonance,
  getNeedComponent,
  getMemoryComponent
} = require('./intent/intentScorer');
const intentPipeline = require('./intent/intentPipeline');

function generateIntents(agent, actions, context) {
  return intentPipeline.execute(agent, actions, context).enrichedIntents;
}

module.exports = {
  generateIntents,
  evaluateFieldMatch,
  evaluateManaResonance,
  getNeedComponent,
  getMemoryComponent
};
