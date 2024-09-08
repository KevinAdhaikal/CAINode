import {CAINode} from "./index.js"

const Char_AI = new CAINode()
await Char_AI.login("Your Character.AI Token");
console.log("it works!")
await Char_AI.logout();
