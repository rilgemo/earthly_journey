const IDENTITY_RULES = Object.freeze([
  Object.freeze({ identity: 'Runesmith', requirements: Object.freeze({ forging: 30, arcaneManipulation: 20 }) }),
  Object.freeze({ identity: 'Mage', requirements: Object.freeze({ arcaneTheory: 25, arcaneManipulation: 20 }) }),
  Object.freeze({ identity: 'Blacksmith', requirements: Object.freeze({ forging: 25 }) }),
  Object.freeze({ identity: 'Hunter', requirements: Object.freeze({ hunting: 25 }) }),
  Object.freeze({ identity: 'Farmer', requirements: Object.freeze({ farming: 25 }) })
]);

function normalizeDerivationInput(input = {}) {
  if (input.skills) return input;
  return { skills: input };
}

function deriveIdentities(input = {}) {
  const { skills = {} } = normalizeDerivationInput(input);
  return IDENTITY_RULES
    .filter(rule => Object.entries(rule.requirements)
      .every(([skill, minimum]) => (skills[skill] || 0) >= minimum))
    .map(rule => rule.identity);
}

module.exports = {
  IDENTITY_RULES,
  deriveIdentities
};
