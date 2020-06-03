const isUserRegistered = userState => {
  return userState.tiers !== undefined;
};

export const getCurrentUserTierData = (tiers, userState) => {
  const baseTier = {
    name: 0,
    limit: 0
  };

  if (!isUserRegistered(userState)) {
    return baseTier;
  }

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
  }, baseTier);
};

export const isAccountCreationProcessing = (tiers, userState) => {
  // If any tier is PENDING_SDD return that user is creating account
  return (
    isUserRegistered(userState) &&
    tiers.some(tier => userState.tiers[tier.name].status === "PENDING_SDD")
  );
};

export const isCurrentUserUpgrading = (tiers, userState) => {
  // If any tier is PENDING_VERIFICATION return that user is Upgrading
  return (
    isUserRegistered(userState) &&
    tiers.some(
      tier => userState.tiers[tier.name].status === "PENDING_VERIFICATION"
    )
  );
};

export const isCurrentUserActionRequired = (tiers, userState) => {
  // If any tier is PENDING_UPLOAD_DOCUMENTS return that user is Upgrading
  return (
    isUserRegistered(userState) &&
    tiers.some(
      tier => userState.tiers[tier.name].status === "PENDING_UPLOAD_DOCUMENTS"
    )
  );
};

export const isCurrentUserSuspended = (tiers, userState) => {
  // If any tier is SANCTIONED return that user is Upgrading
  return (
    isUserRegistered(userState) &&
    tiers.some(tier => userState.tiers[tier.name].status === "SANCTIONED")
  );
};
