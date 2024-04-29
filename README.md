# CAINode
Unofficial Character AI using Node JS
# Example
```js
const CAINode = require("./index.js");
const Char_AI = new CAINode();

(async function() {
    await Char_AI.login("Your Character AI Token");
    console.log("Login successfully");
    await Char_AI.logout()
})();
```
