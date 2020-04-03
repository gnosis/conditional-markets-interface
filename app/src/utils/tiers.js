export const getCurrentUserTierData = (tiers, userState) => {
  return tiers.reduce((selectedTier, currentTier) => {
    // Exceptional case where an user is WHITELISTED and then SumSub status go back
    // to PENDING_SDD. Sight will keep this user as WHITELISTED until we get the BLOCKED or ENABLED sign
    if (
      userState.status === "WHITELISTED" &&
      currentTier.name === 1 &&
      userState.tiers[currentTier.name].status === "PENDING_SDD"
    ) {
      return currentTier;
    }
    // If Tier is ENABLED return this TIER
    if (userState.tiers[currentTier.name].status === "ENABLED") {
      return currentTier;
    }
    // Return any previous selected Tier
    return selectedTier;
  }, {});
};
