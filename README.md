# CAINode
Unofficial Character.AI API using Node JS
# Install
`npm install cainode`
# Example
- Example Login
```js
const CAINode = require("cainode");
const Char_AI = new CAINode();

(async function() {
    await Char_AI.login("Your Character AI Token");
    console.log("Login successfully");
    await Char_AI.logout()
})();
```
- Character.AI Group Chat Implementation using Discord: https://github.com/kevinadhaikal/caicord
