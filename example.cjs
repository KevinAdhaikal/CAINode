(async function() {
    const Char_AI = (await import("./index.js")).CAINode();
    await Char_AI.login("Your Character AI Token");
    console.log("Login successfully");
    await Char_AI.logout();
})();
