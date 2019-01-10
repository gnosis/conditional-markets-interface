module.exports = {
    "extends": [
        "eslint:recommended",
        "plugin:prettier/recommended",
        "prettier"
    ],
    "parserOptions": { "ecmaVersion": 8 },
    "env": { 
        "es6": true,
        "node": true,
        "mocha": true 
    },
    "root": true,
    "globals": {
        "assert": true,
        "contract": true,
        "artifacts": true,
        "web3": true,
    },
    "rules": {
        "no-redeclare": 0
    }
}