var config = require("./config.json")
const CAINode = require("./index.js");
const Char_AI = new CAINode();

(async function() {
    await Char_AI.login(config.cai_token);
    console.log("Login successfully");
    await Char_AI.logout()
})();