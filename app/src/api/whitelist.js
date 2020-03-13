const conf = require("../conf");
const { WHITELIST_ENABLED, WHITELIST_API_URL } = conf;

export const getWhitelistState = async accountAddress => {
  if (!WHITELIST_ENABLED) {
    return true;
  }

  const response = await fetch(
    `${WHITELIST_API_URL}/v1/users/${accountAddress}/`
  );
  if (response.status === 404) {
    return "NOT_FOUND";
  }

  if (!response.ok) {
    return "ERROR";
  }

  const json = await response.json();

  return json.status; // 'PENDING_KYC', 'BLOCKED', 'WHITELISTED'
};

export const getResidenceCountries = async () => {
  const url = `${WHITELIST_API_URL}/v1/countries`;

  return fetch(url, {
    method: "GET"
  }).then(res => res.json());
};

export const setSourceOfFunds = async sowInformation => {
  const { email, ...data } = sowInformation;
  const url = `${WHITELIST_API_URL}/v1/users/${email}/sow`;

  return fetch(url, {
    method: "POST",
    body: JSON.stringify(data), // data can be `string` or {object}!
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const getCurrentTradingVolume = accountAddress => {
  return Math.floor(Math.random() * 151);
};

export const postPersonalDetails = async personalDetails => {
  const url = `${WHITELIST_API_URL}/v1/sdd/users/`;
  console.log(personalDetails);
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(personalDetails),
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

export const getWhitelistSddStatus = async account => {
  const url = `${WHITELIST_API_URL}/v2/users/${account}`;

  const response = await fetch(url, {
    method: "GET"
  });

  if (response.ok) {
    const json = await response.json();

    // This just checks for PENDING, not if the status is successful or not
    let sanctionStatus = "PENDING";
    let whitelistStatus = "PENDING";
    let rejected = false;
    let t1;
    if (json["tiers"] && json["tiers"]["tier1"]) {
      t1 = json["tiers"]["tier1"];

      sanctionStatus = t1["status"] !== "PENDING_SDD";
      whitelistStatus = json["status"] != "BLOCKED" && sanctionStatus;

      if (t1["status"] === "SANCTIONED") {
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
  const url = `${WHITELIST_API_URL}/v1/tiers/2/upgrades`;
  console.log(userDetails);
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
  const url = `${WHITELIST_API_URL}/v1/tiers/2/requests`;

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
