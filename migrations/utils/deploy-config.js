// default to 30 days later
const defaultResolutionTime = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

module.exports = {
  daiPriceResolutionTime:
    process.env.DAIPRICERESOLUTIONTIME || defaultResolutionTime,
  daiPriceTargetValue: process.env.DAIPRICETARGETVALUE || "1" + "0".repeat(18),
  daiPriceQuestionID: process.env.DAIPRICEQUESTIONID || "0x01",

  daiSupplyResolutionTime:
    process.env.DAISUPPLYRESOLUTIONTIME || defaultResolutionTime,
  daiSupplyTargetValue:
    process.env.DAISUPPLYTARGETVALUE || "81000000" + "0".repeat(18),
  daiSupplyQuestionID: process.env.DAISUPPLYQUESTIONID || "0x02",

  daiStabilityFeeResolutionTime:
    process.env.DAISTABILITYFEERESOLUTIONTIME || defaultResolutionTime,
  daiStabilityFeeTargetValue:
    process.env.DAISTABILITYFEETARGETVALUE || "1000000005113779426955452540",
  daiStabilityFeeQuestionID: process.env.DAISTABILITYFEEQUESTIONID || "0x03",

  ammFunding: process.env.AMMFUNDING || "1000" + "0".repeat(18)
};
