export const getCurrentUserTierData = (tiers, userState) => {
  return tiers.reduce((selectedTier, currentTier) => {
    if (userState.tiers[currentTier.name].status === "ENABLED") {
      return currentTier;
    }
    return selectedTier;
  }, {});
};
