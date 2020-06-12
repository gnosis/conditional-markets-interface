const conf = require("../conf");
const { WHITELIST_API_URL } = conf;

const WHITELIST_PENDING = "PENDING_KYC";
const WHITELIST_BLOCKED = "BLOCKED";
const WHITELIST_APPROVED = "WHITELISTED";
const WHITELIST_UNKNOWN = "UNKNOWN";
const WHITELIST_LOADING = "LOADING";
const WHITELIST_ERROR = "ERROR";

/**
 * Whitelist State Values
 *
 * @enum {string}
 */
export const WHITELIST_STATES = {
  PENDING: WHITELIST_PENDING,
  BLOCKED: WHITELIST_BLOCKED,
  WHITELISTED: WHITELIST_APPROVED,
  UNKNOWN: WHITELIST_UNKNOWN,
  LOADING: WHITELIST_LOADING,
  ERROR: WHITELIST_ERROR
};

const WHITELIST_TIER_PENDING_SDD = "PENDING_SDD";
const WHITELIST_TIER_PENDING = "PENDING";
const WHITELIST_TIER_SANCTIONED = "SANCTIONED";

/**
 * Whitelist Tier Statuses
 *
 * @enum {string}
 */
export const WHITELIST_TIER_STATES = {
  ["PENDING_SDD"]: WHITELIST_TIER_PENDING_SDD,
  ["PENDING"]: WHITELIST_TIER_PENDING,
  ["SANCTIONED"]: WHITELIST_TIER_SANCTIONED
};

export const getResidenceCountries = async () => {
  const url = `${WHITELIST_API_URL}/v1/countries`;

  return fetch(url, {
    method: "GET"
  }).then(res => res.json());
};

export const getSourceOfWealthState = async account => {
  const url = `${WHITELIST_API_URL}/v1/users/${account}/sow/`;

  return fetch(url, {
    method: "GET"
  });
};

export const setEthAccountEmail = async userInformation => {
  const url = `${WHITELIST_API_URL}/v1/users/`;

  return fetch(url, {
    method: "POST",
    body: JSON.stringify(userInformation), // data can be `string` or {object}!
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const setSourceOfFunds = async sowInformation => {
  const { email, ...data } = sowInformation;
  const url = `${WHITELIST_API_URL}/v1/users/`;

  return fetch(url, {
    method: "POST",
    body: JSON.stringify({ email, sow: data }), // data can be `string` or {object}!
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const getTiersLimit = async () => {
  const url = `${WHITELIST_API_URL}/v1/tiers/`;

  return fetch(url, {
    method: "GET"
  }).then(res => res.json());
};

export const getCurrentTradingVolume = async accountAddress => {
  const url = `${WHITELIST_API_URL}/v1/users/${accountAddress}/trading/volumes/`;

  return fetch(url, {
    method: "GET"
  }).then(res => res.json());
};

/**
 * Sends the intended buy volume to check against user buy limit
 * Returns the current user buy volume after the current trade
 *
 * @param {string} accountAddress - Ethereum Wallet Address
 * @param {array} buyVolumes - An array of items indicating collateralToken and amount
 * @returns {Object} - buyVolume object containing the user spend volume after the current trade
 */
export const postTradingVolumeSimulation = async (
  accountAddress,
  buyVolumes
) => {
  const url = `${WHITELIST_API_URL}/v1/users/${accountAddress}/trading/volumes/simulation/`;

  return fetch(url, {
    method: "POST",
    body: JSON.stringify(buyVolumes),
    headers: {
      "Content-Type": "application/json"
    }
  }).then(res => res.json());
};

export const postPersonalDetails = async personalDetails => {
  const url = `${WHITELIST_API_URL}/v1/sdd/users/`;
  // acceptNewsletter is required to be defined for backend but is not mandatory param
  const data = { acceptNewsletter: false, ...personalDetails };

  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (response.ok) {
    // ok response (204) has no body
    return [response, null];
  }

  const json = await response.json();
  return [response, json];
};

/**
 * @typedef {Object} UserState
 * @property {string} ethAddress - User account
 * @property {WHITELIST_STATES} status - The current user state 'PENDING_KYC', 'BLOCKED', 'WHITELISTED'
 * @property {Object} tiers - Current tiers state for user
 */
/**
 * Returns the current status of the requested accounts whitelist process
 *
 * @param {string} accountAddress - Ethereum Wallet Address
 * @returns {UserState} - state
 */
export const getUserState = async accountAddress => {
  const response = await fetch(
    `${WHITELIST_API_URL}/v2/users/${accountAddress}/`
  );
  if (response.status === 404) {
    return { status: WHITELIST_STATES.UNKNOWN };
  }

  if (!response.ok) {
    return { status: WHITELIST_STATES.ERROR };
  }

  return response.json();
};

/**
 * @typedef {object} WhitelistProcessingInformation
 * @property {string} sanctionStatus - Address checked against sanction list
 * @property {string} whitelistStatus - Address (if applicable) added to whitelist
 * @property {bool} rejected - Applicant was rejected
 */

/**
 * Determines if the passed accounts whitelist process is currently pending or completed.
 * This function returns this information in two sections "sanctionStatus" and "whitelistStatus"
 * "sanctionStatus" - Was this address checked against a sanction list
 * "whitelistStatus" - Was this address (if applicable) added to the whitelist
 *
 * @param {string} account - Ethereum Wallet
 * @returns {WhitelistProcessingInformation}
 */
export const isTieredWhitelistProcessing = async account => {
  const url = `${WHITELIST_API_URL}/v2/users/${account}/`;

  const response = await fetch(url, {
    method: "GET"
  });

  if (response.ok) {
    const json = await response.json();

    // This just checks for PENDING, not if the status is successful or not
    let sanctionStatus = WHITELIST_TIER_STATES.PENDING;
    let whitelistStatus = WHITELIST_TIER_STATES.PENDING;
    let rejected = false;
    let t1;
    if (json["tiers"] && json["tiers"]["1"]) {
      t1 = json["tiers"]["1"];

      sanctionStatus = t1["status"] !== WHITELIST_TIER_STATES.PENDING_SDD;
      whitelistStatus =
        json["status"] != WHITELIST_TIER_STATES.BLOCKED && sanctionStatus;

      if (t1["status"] === WHITELIST_TIER_STATES.SANCTIONED) {
        whitelistStatus = true;
        rejected = true;
      }
    }

    return { sanctionStatus, whitelistStatus, rejected };
  }

  return { sanctionStatus: "ERROR", whitelistStatus: "ERROR" };
};

/**
 * Call to upgrade a Tier 1 user that wants to promote to Tier 2.
 * @function
 * @param {Object} userDetails - Information from the user that requests the upgrade.
 * @param {string} userDetails.ethAddress - The user eth address.
 * @param {string} userDetails.recaptchaToken - The user signed captcha.
 */
export const postTier2Upgrade = async userDetails => {
  const url = `${WHITELIST_API_URL}/v1/tiers/2/upgrades/`;

  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(userDetails),
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (response.ok) {
    // ok response (204) has no body
    return [response, null];
  }

  const json = await response.json();
  return [response, json];
};

/**
 * Call to request a Tier 2 account creation for an user that can't apply for Tier 1. (Non EU user).
 * @function
 * @param {Object} userDetails - Information from the user that requests the registration.
 * @param {string} userDetails.email - The user email to start the proccess.
 * @param {string} userDetails.recaptchaToken - The user signed captcha.
 */
export const postTier2Request = async userDetails => {
  const url = `${WHITELIST_API_URL}/v1/tiers/2/requests/`;
  // acceptNewsletter is required to be defined for backend but is not mandatory param
  const data = { acceptNewsletter: false, ...userDetails };

  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (response.ok) {
    // ok response (204) has no body
    return [response, null];
  }

  const json = await response.json();
  return [response, json];
};

/**
 * Call to upgrade a Tier 2 user that wants to promote to Tier 3.
 * @function
 * @param {Object} userDetails - Information from the user that requests the upgrade.
 * @param {string} userDetails.ethAddress - The user eth address.
 * @param {string} userDetails.recaptchaToken - The user signed captcha.
 */
export const postTier3Upgrade = async userDetails => {
  const url = `${WHITELIST_API_URL}/v1/tiers/3/upgrades/`;

  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(userDetails),
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (response.ok) {
    // ok response (204) has no body
    return [response, null];
  }

  const json = await response.json();
  return [response, json];
};
