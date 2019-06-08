module.exports = artifacts => ({
  ammFunding: process.env.AMMFUNDING || "1" + "0".repeat(18),
  oracle:
    process.env.ORACLE || artifacts.require("Migrations").defaults()["from"]
});
