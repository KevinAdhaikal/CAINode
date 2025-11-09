import WebSocket from "ws";
import EventEmitter from "node:events";
const textDecoder = new TextDecoder()

async function load() {
    if (typeof process !== "undefined" && process.versions && process.versions.node && Number(process.version.substring(1, 3)) < 18) {
        fetch = await import("node-fetch")
        .then(module => module.default)
        .catch(e => {
            throw "Please install node-fetch by typing 'npm install node-fetch'.";
        });
    } else fetch = global.fetch;
}

await load();

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function generateRandomUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function https_fetch(url, method, headers = {}, body_data = "") {
    if (body_data) headers["Content-Length"] = body_data.length
    return await fetch(url, {
        method: method,
        headers: {
            "User-Agent": "Character.AI",
            "DNT": "1",
            "Sec-GPC": "1",
            "Connection": "close",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "TE": "trailers",
            ...headers
        },
        body: body_data ? body_data : undefined
    })
}

function open_ws(url, cookie, userid, this_class) {
    return new Promise(resolve => {
        const ws_con = new WebSocket(url, {
            headers: {
                Cookie: cookie
            }
        })
        ws_con.once('open', function() {
            if (userid) ws_con.send(`{"connect":{"name":"js"},"id":1}{"subscribe":{"channel":"user#${userid}"},"id":1}`)
            resolve(ws_con)
        })
        ws_con.on('message', function(message) {
            message = message.toString()
            if (message === "{}") ws_con.send("{}") // Ping
            else this_class.emit("message", message)
        });
    });
}

function send_ws(ws_con, data, using_json, wait_json_prop_type, wait_ai_response, append_array = false, timeout_ms = 0) {
    return new Promise((resolve, reject) => {
        const temp_res = []
        let inc, timeout;
        ws_con.on("message", inc = function incoming(message) {
            message = using_json ? JSON.parse(message.toString()) : message.toString()
            if (using_json && wait_json_prop_type) {
                try {
                    if (wait_ai_response) {
                        switch(Number(wait_json_prop_type)) {
                            case 1: { // single character chat
                                if ((!message.turn.author.is_human && message.turn.candidates[0].is_final)) {
                                    if (timeout_ms != 0) clearTimeout(timeout);
                                    ws_con.removeListener("message", incoming);
                                    resolve(message)
                                }
                                break;
                            }
                            case 2: { // group chat
                                if (!message["push"].pub.data.turn.author.is_human && message["push"].pub.data.turn.candidates[0].is_final) {
                                    if (timeout_ms != 0) clearTimeout(timeout);
                                    ws_con.removeListener("message", incoming);
                                    resolve(message)
                                }
                                break;
                            }
                        }
                    } else {
                        switch(Number(wait_json_prop_type)) {
                            case 1: { // single character chat
                                if (message.turn.candidates[0].is_final) {
                                    if (timeout_ms != 0) clearTimeout(timeout);
                                    ws_con.removeListener("message", incoming);
                                    if (append_array) resolve(temp_res.concat(message));
                                    else resolve(message);
                                }
                                break;
                            }
                            case 2: { // group chat
                                if (message["push"].pub.data.turn.candidates[0].is_final) {
                                    if (timeout_ms != 0) clearTimeout(timeout);
                                    ws_con.removeListener("message", incoming);
                                    if (append_array) resolve(temp_res.concat(message));
                                    else resolve(message);
                                }
                                break;
                            }
                        }
                    }
                } catch(_) {
                    if (append_array) temp_res.push(message);
                }
            } else {
                if (timeout_ms != 0) clearTimeout(timeout);
                ws_con.removeListener("message", incoming);
                resolve(message)
            }
        })
        ws_con.send(data)
        if (timeout_ms != 0) timeout = setTimeout(() => {
            ws_con.removeListener("message", inc);
            reject("Timeout exceeded!")
        }, timeout_ms)
    })
}


/**
 * @typedef CAINode_Property
 * @property {WebSocket[]} ws
 * @property {string} token
 * @property {UserInfo} user_data
 * @property {string} current_chat_id
 * @property {string} current_char_id_chat
 * @property {string} edge_rollout
 * @property {UserSettings} user_settings
 * @property {number} join_type
 * @property {number[]} is_connected_livekit_room
 */
class CAINode_prop {
    ws = [];
    token = "";
    user_data = {};
    current_chat_id = "";
    current_char_id_chat = "";
    edge_rollout = "";
    user_settings = {};
    join_type = 0;
    is_connected_livekit_room = [0];
}

/**
 * @typedef {Object} StatusInfo
 * @property {string} status
 * @property {string} comment
*/

class User_Class {
    /**
     * @typedef {Object} UserInfo
     * @property {Object} user
     * @property {Object} user.user
     * @property {string} user.user.username
     * @property {number} user.user.id
     * @property {string} user.user.first_name
     * @property {Object} user.user.account
     * @property {string} user.user.account.name
     * @property {string} user.user.account.avatar_type
     * @property {string} user.user.account.onboarding_complete
     * @property {string} user.user.account.avatar_file_name
     * @property {string} user.user.account.mobile_onboarding_complete
     * @property {boolean} user.user.is_staff
     * @property {object | string[] | string | undefined} user.user.subscription
     * @property {boolean} user.is_human
     * @property {string} user.name
     * @property {string} user.email
     * @property {boolean} user.needs_to_acknowledge_policy
     * @property {string | undefined} user.suspended_until
     * @property {string[]} user.hidden_characters
     * @property {string[]} user.blocked_users
     * @property {string} user.bio
     * @property {Object} user.interests
     * @property {string[]} user.interests.selected
    */

    /**
     * @typedef {Object} UserSettings
     * @property {string | undefined} default_persona_id
     * @property {Record<string, string> | undefined} voiceOverrides
     * @property {Record<string, string> | undefined} personaOverrides
     * @property {boolean} voiceOverridesMigrated
     * @property {boolean} proactiveDmOptedOut
     * @property {Object} outputStylePreferences
     * @property {Set<string>} outputStylePreferences.bannedWords
    */

    /**
     * @typedef {Object} UserPublicInfo
     * @property {Object} public_user
     * @property {string[]} public_user.characters
     * @property {string} public_user.username
     * @property {string} public_user.name
     * @property {number} public_user.num_following
     * @property {number} public_user.num_followers
     * @property {string} public_user.avatar_file_name
     * @property {string} public_user.subscription_type
     * @property {string} public_user.bio
     * @property {string | undefined} public_user.creator_info
    */

    /**
     * @typedef {Object} UserPublicFollowInfo
     * @property {Object} users
     * @property {string} users[].username
     * @property {string} users[].account__avatar_file_name
     * @property {string} users[].account__bio
     * @property {boolean} has_next_page
    */

    /**
     * @typedef {Object} UserLikedCharacter
     * @property {Object[]} characters
     * @property {string} characters[].external_id
     * @property {string} characters[].title
     * @property {string} characters[].description
     * @property {string} characters[].greeting
     * @property {string} characters[].avatar_file_name
     * @property {string} characters[].visibility
     * @property {boolean} characters[].copyable
     * @property {string} characters[].definition
     * @property {string} characters[].participant__name
     * @property {string} characters[].user__id
     * @property {string} characters[].user__username
     * @property {boolean} characters[].img_gen_enabled
     * @property {number} characters[].participant__num_interactions
     * @property {number} characters[].upvotes
    */

    /**
     * @typedef {Object} UserSearch
     * @property {Object[]} creators
     * @property {string} creators[].visibility
     * @property {number} creators[].score
     * @property {string} creators[].name
    */

    /**
     * @typedef {Object} UserPublicInfoArray
     * @property {Object[]} public_users
     * @property {string} public_users[].username
     * @property {string} public_users[].account__avatar_file_name
     * @property {Object} public_users[].character_info
     * @property {number} public_users[].character_info.num_characters
     * @property {number} public_users[].character_info.num_interactions
     * @property {Object} public_users[].character_info.top_1_char
     * @property {string} public_users[].character_info.top_1_char.character_name
     * @property {number} public_users[].character_info.top_1_char.interactions
     * @property {string} public_users[].character_info.top_1_char.avatar_file_name
     * @property {string} public_users[].character_info.top_1_char.external_id
     * @property {Object} public_users[].character_info.top_2_char
     * @property {string} public_users[].character_info.top_2_char.character_name
     * @property {number} public_users[].character_info.top_2_char.interactions
     * @property {string} public_users[].character_info.top_2_char.avatar_file_name
     * @property {string} public_users[].character_info.top_2_char.external_id
     * 
    */

    /**
     * @typedef {Object} UserBirthdayStatus
     * @property {string} status
     * @property {string} message
     * @property {boolean} date_of_birth_collected
     * @property {boolean} meets_age_requirements
    */

    /**
     * @typedef {Object} CreatedCharactersUserInfo
     * @property {Object[]} characters
     * @property {string} characters[].external_id
     * @property {string} characters[].title
     * @property {string} characters[].greeting
     * @property {string} characters[].description
     * @property {string} characters[].definition
     * @property {string} characters[].avatar_file_name
     * @property {string} characters[].visibility
     * @property {boolean} characters[].copyable
     * @property {string} characters[].participant__name
     * @property {number} characters[].participant__num_interactions
     * @property {number} characters[].user__id
     * @property {string} characters[].user__username
     * @property {boolean} characters[].img_gen_enabled
     * @property {string} characters[].default_voice_id
     * @property {number} characters[].remix_count
     * @property {number} characters[].upvotes
    */

    /**
     * @type {CAINode_Property}
     */
    #prop;
    constructor(prop) {
        this.#prop = prop
    }

    /**
     * Get current information account.  
     *   
     * Example: `console.log(library_name.user.info)`
     * 
     * @returns {UserInfo}
    */
    get info() {
        return !this.#prop.token ? (() => {throw "Please login first."})() : this.#prop.user_data;
    }

    /**
     * Get current settings account.  
     *   
     * Example: `console.log(library_name.user.settings)`
    */
    get settings() {
        return !this.#prop.token ? (() => {throw "Please login first."})() : this.#prop.user_settings;
    }

    /**
     * Get user public information account.  
     *   
     * Example  
     * - Get someone public info: `await library_name.user.public_info("username")`  
     * - Get your own info: `await library_name.user.public_info()`
     * 
     * @param {string | undefined} username
     * @returns {Promise<UserPublicInfo>}
    */
    async public_info(username) {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch("https://plus.character.ai/chat/user/public/", "POST", {"Authorization": `Token ${this.#prop.token}`, "Content-Type": "application/json"}, JSON.stringify({"username": username ? username : this.#prop.user_data.user.user.username}))).json()
    }

    /**
     * Get user public information account. same like `public_info()`, but this function have less information.  
     * This function allow to fetch more than one usernames. Using array.  
     * 
     * @param {Array | string} usernames
     * @returns {Promise<UserPublicInfoArray>}
    */
    async public_info_array(usernames) {
        if (!this.#prop.token) throw "Please login first."
        if (!usernames) throw "Parameter named 'usernames' cannot be empty."

        return await (await https_fetch("https://plus.character.ai/chat/anon/users/public/", "POST", {"Authorization": `Token ${this.#prop.token}`, "Content-Type": "application/json"}, JSON.stringify({
            "usernames": typeof usernames === "string" ? [usernames] : usernames
        }))).json();
    }

    /**
     * Change current information account.  
     *   
     * Example: `library_name.user.change_info("username", "name", "avatar_rel_path", "bio")`  
     * - Warning: avatar_rel_path image link must be generated/uploaded to Character.AI server.
     * 
     * @param {string | undefined} username
     * @param {string | undefined} name
     * @param {string | undefined} avatar_rel_path
     * @param {string | undefined} bio
     * 
     * @returns {Promise<StatusInfo>}
    */
    async change_info(username = "", name = "", avatar_rel_path = "", bio = "") {
        if (!this.#prop.token) throw "Please login first.";

        return await (await https_fetch("https://plus.character.ai/chat/user/update/", "POST", {"Authorization": `Token ${this.#prop.token}`}, JSON.stringify({
            "username": username && username !== this.#prop.user_data.user.user.username ? (() => {
                this.#prop.user_data.user.user.username = username
                return username
            })() : this.#prop.user_data.user.user.username,
            "name": name && name !== this.#prop.user_data.user.user.account.name ? (() => {
                this.#prop.user_data.user.user.account.name = name
                return name
            })() : this.#prop.user_data.user.user.account.name,
            "avatar_type": "UPLOADED",
            "avatar_rel_path": avatar_rel_path && avatar_rel_path !== this.#prop.user_data.user.user.account.avatar_file_name ? (() => {
                this.#prop.user_data.user.user.account.avatar_file_name = avatar_rel_path
                return avatar_rel_path
            })() : this.#prop.user_data.user.user.account.avatar_file_name,
            "bio": bio && bio !== this.#prop.user_data.user.bio ? (() => {
                this.#prop.user_data.user.bio = bio
                return bio
            })() : this.#prop.user_data.user.bio
        }))).json()
    }

    /**
     * Refresh settings. also it will returns the current of the settings.  
     * no need to do `library_name.user.settings` after call this function.  
     *   
     * Example: `await library_name.user.refresh_settings()`
     * 
     * @returns {Promise<UserSettings>}
    */
    async refresh_settings() {
        if (!this.#prop.token) throw "Please login first."
        this.#prop.user_settings = await (await https_fetch("https://plus.character.ai/chat/user/settings/", "GET", {"Authorization": `Token ${this.#prop.token}`})).json();
        if ((typeof this.#prop.user_settings.outputStylePreferences) !== "object") this.#prop.user_settings.outputStylePreferences = {};
        this.#prop.user_settings.outputStylePreferences.bannedWords = new Set(Array.isArray(this.#prop.user_settings.outputStylePreferences.bannedWords) ? this.#prop.user_settings.outputStylePreferences.bannedWords : [])        
        return this.#prop.user_settings
    }

    /**
     * Update user settings by your own settings.  
     *   
     * Example: `await library_name.user.change_settings()`
     * 
     * @param {UserSettings | Object} settings_object
     * @returns {Promise<UserSettings | Object>}
    */
    async update_settings(settings_object) {
        if (!this.#prop.token) throw "Please login first.";

        const result = await (await https_fetch("https://plus.character.ai/chat/user/update_settings/", "POST", {
            "Authorization": `Token ${this.#prop.token}`,
            "Content-Type": "application/json"
        }, JSON.stringify(settings_object))).json();

        await this.refresh_settings();
        return result;
    }
    
    /**
     * Get public user following list.  
     *   
     * Example  
     * - Get someone public user following list: `await library_name.user.public_following_list("Username", page_param)`  
     * - Get your own user following list: `await library_name.user.public_following_list("", page_param)`
     * 
     * @param {string | undefined} username
     * @param {number | undefined} page_param
     * 
     * @returns {Promise<UserPublicFollowInfo>}
    */
    async public_following_list(username, page_param = 1) {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch("https://plus.character.ai/chat/user/public/following/", "POST", {"Authorization": `Token ${this.#prop.token}`, "Content-Type": "application/json"}, JSON.stringify({
            "username":username ? username : this.#prop.user_data.user.user.username, "pageParam": page_param
        }))).json()
    }

    /**
     * Check are you following this user account or not.  
     *   
     * Example: `await library_name.user.following_check("Username")`
     * 
     * @param {string} username 
     * @returns {Promise<{"followStatus": Record<string, boolean>}>}
     */
    async following_check(username) {
        if (!this.#prop.token) throw "Please login first.";

        return await (await https_fetch("https://neo.character.ai/external/users/following/check", "POST", {
            "Authorization": `Token ${this.#prop.token}`,
            "Content-Type": "application/json"
        }, JSON.stringify({
            "usernames_to_check": [username]
        }))).json()
    }
    
    /**
     * Get public user followers list.  
     *   
     * Example  
     * - Get someone public user followers list: `await library_name.user.public_followers_list("Username", page_param)`  
     * - Get your own user followers list: `await library_name.user.public_followers_list("", page_param)`
     * 
     * @param {string | undefined} username
     * @param {number | undefined} page_param
     * 
     * @returns {Promise<UserPublicFollowInfo>}
    */
    async public_followers_list(username, page_param = 1) {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch("https://plus.character.ai/chat/user/public/followers/", "POST", {"Authorization": `Token ${this.#prop.token}`, "Content-Type": "application/json"}, JSON.stringify({
            "username":username ? username : this.#prop.user_data.user.user.username, "pageParam": page_param
        }))).json()
    }

    /**
     * Get account following name list.  
     *   
     * Example: `await library_name.user.following_list_name()`
     * 
     * @returns {Promise<{following: string[]}>}
    */
    async following_list_name() {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch("https://plus.character.ai/chat/user/following/", "GET", {"Authorization": `Token ${this.#prop.token}`})).json()
    }

    /**
     * Get account followers name list.  
     *   
     * Example: `await library_name.user.followers_list_name()`
     * 
     * @returns {Promise<{following: string[]}>}
    */
    async followers_list_name() {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch("https://plus.character.ai/chat/user/followers/", "GET", {"Authorization": `Token ${this.#prop.token}`})).json()
    }

    /**
     * Follow user account.  
     *   
     * Example: `await library_name.user.follow("Username")`
     * 
     * @param {string} username
     * @returns {Promise<StatusInfo>}
    */
    async follow(username) {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch("https://plus.character.ai/chat/user/follow/", POST, {"Authorization": `Token ${this.#prop.token}`, "Content-Type": "application/json"}, JSON.stringify({
            "username": username
        }))).json()
    }
    
    /**
     * Unfollow user account.  
     *   
     * Example: `await library_name.user.unfollow("Username")`
     * 
     * @param {string} username
     * @returns {Promise<StatusInfo>}
    */
    async unfollow(username) {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch("https://plus.character.ai/chat/user/unfollow/", POST, {"Authorization": `Token ${this.#prop.token}`, "Content-Type": "application/json"}, JSON.stringify({
            "username": username
        }))).json()
    }

    /**
     * Get account liked character list.  
     *   
     * Example: `await library_name.user.liked_character_list()`
     * 
     * @returns {Promise<UserLikedCharacter>}
    */
    async liked_character_list() {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch("https://plus.character.ai/chat/user/characters/upvoted/", "GET", {"Authorization": `Token ${this.#prop.token}`})).json()
    }

    /**
     * Add muted words.  
     *   
     * Example  
     * - Using array: `await library_name.user.add_muted_words(["hello", "world"])`  
     * - Using string: `await library_name.user.add_muted_words("hello world")`
     * @param {string[] | string} words
     * @returns {Promise<{status: boolean, settings: UserSettings}>}
    */
    async add_muted_words(words) {
        if (!this.#prop.token) throw "Please login first."
        
        if (Array.isArray(words)) {
            for (let a = 0; a < words.length; a++) {
                if (!words[a]) throw `word at index ${a} cannot be empty.`
                if (words[a].includes(' ')) throw `this word ('${words[a]}') must be single word.`
                this.#prop.user_settings.outputStylePreferences.bannedWords.add(words[a])
            }
        } else {
            words = words.split(' ');
            for (let a = 0; a < words.length; a++) {
                if (!words[a]) throw `word at index ${a} cannot be empty.`
                this.#prop.user_settings.outputStylePreferences.bannedWords.add(words[a])
            }
        }

        return await this.update_settings({"outputStylePreferences": {
            "bannedWords": [...this.#prop.user_settings.outputStylePreferences.bannedWords]
        }});
    }

    /**
     * Remove muted word.  
     *   
     * Example  
     * - Using array: `await library_name.user.remove_muted_word(["hello", "world"])`  
     * - Using string: `await library_name.user.remove_muted_word("hello world")`
     * 
     * @param {string[] | string} words
     * @returns {Promise<{status: boolean, settings: UserSettings}>}
    */
    async remove_muted_words(words) {
        if (!this.#prop.token) throw "Please login first."
        
        if (Array.isArray(words)) {
            for (let a = 0; a < words.length; a++) {
                if (!words[a]) throw `word at index ${a} cannot be empty.`
                if (words[a].includes(' ')) throw `this word ('${words[a]}') must be single word.`
                this.#prop.user_settings.outputStylePreferences.bannedWords.delete(words[a])
            }
        } else {
            words = words.split(' ');
            for (let a = 0; a < words.length; a++) {
                if (!words[a]) throw `word at index ${a} cannot be empty.`
                this.#prop.user_settings.outputStylePreferences.bannedWords.delete(words[a])
            }
        }
        
        return await this.update_settings({"outputStylePreferences": {
            "bannedWords": [...this.#prop.user_settings.outputStylePreferences.bannedWords]
        }});
    }

    /**
     * Clear muted words.  
     *   
     * Example: `await library_name.user.clear_muted_words()`
     * 
     * @returns {Promise<{status: boolean, settings: UserSettings}>}
    */
    async clear_muted_words() {
        if (!this.#prop.token) throw "Please login first."
        return await this.update_settings({"outputStylePreferences":{"bannedWords":[]}})
    }

    /** 
     * check if the user age meets agreement (17+ i guess?)  
     *   
     * Example: `await library_name.user.birthday_status()`
     * 
     * @returns {Promise<{UserBirthdayStatus}>}
     */
    async birthday_status() {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch("https://plus.character.ai/chat/user/get-user-birthday-status/", "GET", {
            "Authorization": `Token ${this.#prop.token}`
        })).json()
    }

    /**
     * Get all list characters created by this current user.  
     *   
     * Example: `await library_name.user.get_characters_created()`
     * 
     * @returns {Promise<CreatedCharactersUserInfo>}
     */
    async get_characters_created() {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch("https://neo.character.ai/character/v1/get_characters_created_by_user", "GET", {
            "Authorization": `Token ${this.#prop.token}`
        })).json()
    }
}

class Image_Class {
    #prop;
    constructor(prop) {
        this.#prop = prop;
    }

    /**
     * Generate avatar image using prompt.  
     *   
     * Example: `await library_name.image.generate_avatar("your prompt")`
     * 
     * @param {string} prompt_name
     * @returns {Promise<{ result: [{ prompt: string, url: string }] }>}
    */
    async generate_avatar(prompt_name) {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch("https://plus.character.ai/chat/character/generate-avatar-options", "POST", {"Authorization": `Token ${this.#prop.token}`, "Content-Type": "application/json"}, JSON.stringify({
            "prompt":prompt_name,
            "num_candidates":4,
            "model_version":"v1"
        }))).json()
    }

    /**
     * Generate image using prompt.  
     *   
     * Example: `await library_name.image.generate_image("your prompt")`
     * 
     * @param {string} prompt_name
     * @returns {Promise<{ image_rel_path: string }>}
    */
    async generate_image(prompt_name) {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch("https://plus.character.ai/chat/generate-image/", "POST", {"Authorization": `Token ${this.#prop.token}`, "Content-Type": "application/json"}, JSON.stringify({"image_description":prompt_name}))).json()
    }
}

// Persona Class
class Persona_Class {
    /**
     * @typedef {Object} Persona
     * @property {string} external_id
     * @property {string} title
     * @property {string} name
     * @property {string} visibility
     * @property {boolean} copyable
     * @property {string} greeting
     * @property {string} description
     * @property {string} identifier
     * @property {string} avatar_file_name
     * @property {string[]} songs
     * @property {boolean} img_gen_enabled
     * @property {string} base_img_prompt
     * @property {string} img_prompt_regex
     * @property {boolean} strip_img_prompt_from_msg
     * @property {string} definition
     * @property {string} default_voice_id
     * @property {object | undefined} starter_prompts
     * @property {string[]} starter_prompts.phrases
     * @property {boolean} comments_enabled
     * @property {string[]} categories
     * @property {string} user__username
     * @property {string} participant__name
     * @property {string} participant__user__username
     * @property {number} num_interactions
     * @property {string} voice_id
    */

    /**
     * @typedef {Object} PersonaList
     * @property {string} external_id
     * @property {string} title
     * @property {string} greeting
     * @property {string} description
     * @property {string} definition
     * @property {string} avatar_file_name
     * @property {string} visibility
     * @property {boolean} copyable
     * @property {string} participant__name
     * @property {number} participant__num_interactions
     * @property {number} user__id
     * @property {string} user__username
     * @property {boolean} img_gen_enabled
     * @property {string} default_voice_id
     * @property {boolean} is_persona
    */

    #prop;
    constructor(prop) {
        this.#prop = prop;
    }

    /**
     * Create your personality for your character.  
     *   
     * Example: `await library_name.persona.create("Persona Name", "Description")`
     * 
     * @param {string} name
     * @param {string} description
     * @returns {Promise<{status: string, persona: Persona}>}
    */
    async create(name, description) {
        if (!this.#prop.token) throw "Please login first."
        if (!name && !description) throw "Please fill name and description argument."
        return await (await https_fetch("https://plus.character.ai/chat/persona/create/", "POST", {"Authorization": `Token ${this.#prop.token}`, "Content-Type": "application/json"}, JSON.stringify({
            "title": name,
            "name": name,
            "identifier": "id:" + generateRandomUUID(),
            "categories": [],
            "visibility": "PRIVATE",
            "copyable": false,
            "description": "This is my persona.",
            "greeting": "Hello! This is my persona",
            "definition": description,
            "avatar_rel_path": "",
            "img_gen_enabled": false,
            "base_img_prompt": "",
            "avatar_file_name": "",
            "voice_id": "",
            "strip_img_prompt_from_msg": false
        }))).json()
    }

    /**
     * Get your personality information.  
     *   
     * Example: `await library_name.persona.info("Your External Persona ID")`
     * 
     * @param {string} external_persona_id
     * @returns {Promise<{error: string, persona: Persona}>}
    */
    async info(external_persona_id) {
        if (!this.#prop.token) throw "Please login first."
        if (!external_persona_id) throw "Please fill external_persona_id."
        return await (await https_fetch(`https://plus.character.ai/chat/persona/?id=${external_persona_id}`, "GET", {"Authorization": `Token ${this.#prop.token}`})).json()
    }

    /**
     * Set your default personality specifically.  
     *   
     * Example  
     * - Set: `await library_name.persona.set_default("Your External Persona ID")`  
     * - Unset: `await library_name.persona.set_default()`
     * 
     * @param {string | undefined} external_persona_id
     * @returns {Promise<{error: string, persona: Persona}>}
    */
    async set_default(external_persona_id = "") {
        if (!this.#prop.token) throw "Please login first."

        if ((await this.info(external_persona_id)).error) return false;
        const result = await (await https_fetch("https://plus.character.ai/chat/user/settings/", "GET", {"Authorization": `Token ${this.#prop.token}`})).json()
        if (external_persona_id) result["default_persona_id"] = external_persona_id
        else delete result.default_persona_id
        await https_fetch("https://plus.character.ai/chat/user/update_settings/", "POST", {"Authorization": `Token ${this.#prop.token}`, "Content-Type": "application/json"}, JSON.stringify(result))
        return true;
    }

    /**
     * Get all your personality data.  
     *   
     * Example: `await library_name.persona.list()`
     * 
     * @returns {Promise<PersonaList>}
    */
    async list() {
        if (!this.#prop.token) throw "Pleae login first"
        return await (await https_fetch(`https://plus.character.ai/chat/personas/?force_refresh=1`, "GET", {"Authorization": `Token ${this.#prop.token}`})).json()
    }

    /**
     * Update your personality specifically.  
     *   
     * Example: `await library_name.persona.update("Your External Persona ID", "Name", "Description")`
     * 
     * @param {string} external_persona_id
     * @param {string} name
     * @param {string} description
     * @returns {Promise<{status: string, persona: Persona}>}
    */
    async update(external_persona_id, name, description) {
        if (!this.#prop.token) throw "Please login first."

        if (!external_persona_id) throw "Please fill external_persona_id."
        if ((await this.info(external_persona_id)).error) return {"status": "ERR_NOT_FOUND", persona:{}}

        const get_info = await this.info(external_persona_id)
        return await (await https_fetch(`https://plus.character.ai/chat/persona/update/`, "POST", {"Authorization": `Token ${this.#prop.token}`, "Content-Type": "application/json"}, JSON.stringify({
            "external_id": external_persona_id,
            "title": get_info.persona.title,
            "greeting": "Hello! This is my persona",
            "description": "This is my persona.",
            "definition": description ? description : get_info.persona.definition,
            "avatar_file_name": get_info.persona.avatar_file_name,
            "visibility": "PRIVATE",
            "copyable": false,
            "participant__name": get_info.persona.participant__name,
            "participant__num_interactions": 0,
            "user__id": this.#prop.user_data.user.user.id,
            "user__username": get_info.persona.user__username,
            "img_gen_enabled": false,
            "default_voice_id": "",
            "is_persona": true,
            "name": name ? name : get_info.persona.name,
            "avatar_rel_path": get_info.persona.avatar_file_name,
            "enabled": false
        }))).json()
    }

    /**
     * Delete your personality spesifically.  
     *   
     * Example: `await library_name.persona.delete("Your External Persona ID")`
     * 
     * @param {string} external_persona_id
     * @returns {Promise<{status: string, persona: Persona}>}
    */
    async delete(external_persona_id) {
        if (!this.#prop.token) throw "Please login first."
        
        if (!external_persona_id) throw "Please fill external_persona_id."
        if ((await this.info(external_persona_id)).error) return {status: "ERR_NOT_FOUND", persona: {}}

        const result_setting = await (await https_fetch("https://plus.character.ai/chat/user/settings/", "GET", {"Authorization": `Token ${this.#prop.token}`})).json()
        delete result_setting.personaOverrides[external_persona_id]
        await https_fetch("https://plus.character.ai/chat/user/update_settings/", "POST", {"Authorization": `Token ${this.#prop.token}`, "Content-Type": "application/json"}, JSON.stringify(result_setting))

        const get_info = await this.info(external_persona_id)
        return await (await https_fetch(`https://plus.character.ai/chat/persona/update/`, "POST", {"Authorization": `Token ${this.#prop.token}`, "Content-Type": "application/json"}, JSON.stringify({
            "external_id": external_persona_id,
            "title": get_info.persona.title,
            "greeting": "Hello! This is my persona",
            "description": "This is my persona.",
            "definition": get_info.persona.definition,
            "avatar_file_name": get_info.persona.avatar_file_name,
            "visibility": "PRIVATE",
            "copyable": false,
            "participant__name": get_info.persona.participant__name,
            "participant__num_interactions": 0,
            "user__id": this.#prop.user_data.user.user.id,
            "user__username": get_info.persona.user__username,
            "img_gen_enabled": false,
            "default_voice_id": "",
            "is_persona": true,
            "archived": true,
            "name": get_info.persona.name
        }))).json()
    }

    /**
     * Set a custom personality for your character specifically.  
     *   
     * Example  
     * - Set: `await library_name.persona.set_character("Your Character ID", "Your External Persona ID")`  
     * - Unset: `await library_name.persona.set_character("Your Character ID")`
     * 
     * @param {string} character_id
     * @param {string | undefined} external_persona_id
     * @returns {Promise<boolean>}
    */
    async set_character(character_id, external_persona_id = "") {
        if (!this.#prop.token) throw "Please login first."

        if (!character_id) throw "Please fill character_id."
        if ((await this.info(external_persona_id)).error) return false;
            
        const result = await (await https_fetch("https://plus.character.ai/chat/user/settings/", "GET", {"Authorization": `Token ${this.#prop.token}`})).json()

        if (external_persona_id) {
            if (!Object.values(result.personaOverrides).length) result.personaOverrides = {}
            result.personaOverrides[character_id] = external_persona_id
        } else delete result.personaOverrides[character_id]

        await https_fetch("https://plus.character.ai/chat/user/update_settings/", "POST", {"Authorization": `Token ${this.#prop.token}`, "Content-Type": "application/json"}, JSON.stringify(result))

        return true;
    }
}

// Explore Class
class Explore_Class {
    /**
     * @typedef {Object} ExploreCharacter
     * @property {Object[]} characters
     * @property {string} characters[].external_id
     * @property {string} characters[].name
     * @property {string} characters[].participant__name
     * @property {number} characters[].participant__num_interactions
     * @property {string} characters[].title
     * @property {string} characters[].description
     * @property {string} characters[].greeting
     * @property {string} characters[].visibility
     * @property {string} characters[].avatar_file_name
     * @property {boolean} characters[].img_gen_enabled
     * @property {string} characters[].user__username
     * @property {Object} characters[].translations
     * @property {Object} characters[].translations.name
     * @property {string} characters[].translations.name.ko
     * @property {string} characters[].translations.name.ru
     * @property {string} characters[].translations.name.ja_JP
     * @property {string} characters[].translations.name.zh_CN
     * @property {Object} characters[].translations.title
     * @property {string} characters[].translations.title.es
     * @property {string} characters[].translations.title.ko
     * @property {string} characters[].translations.title.ru
     * @property {string} characters[].translations.title.ja_JP
     * @property {string} characters[].translations.title.pt_BR
     * @property {string} characters[].translations.title.zh_CN
     * @property {Object} characters[].translations.greeting
     * @property {string} characters[].translations.greeting.es
     * @property {string} characters[].translations.greeting.ko
     * @property {string} characters[].translations.greeting.ru
     * @property {string} characters[].translations.greeting.ja_JP
     * @property {string} characters[].translations.greeting.pt_BR
     * @property {string} characters[].translations.greeting.zh_CN
     * @property {string | undefined} characters[].default_voice_id
     * @property {string} characters[].short_hash
    */

    /**
     * @typedef {Object} CharacterCategoriesInformation
     * @property {string} external_id
     * @property {string} title
     * @property {string} greeting
     * @property {string} avatar_file_name
     * @property {boolean} copyable
     * @property {string} participant__name
     * @property {string} user__username
     * @property {number} participant__num_interactions
     * @property {boolean} img_gen_enabled
     * @property {number} priority
     * @property {string | undefined} default_voice_id
     * @property {number} upvotes
    */

    /**
     * @typedef {{
     * "Helpers": CharacterCategoriesInformation[]
     * "Anime Game Characters": CharacterCategoriesInformation[]
     * "Games": CharacterCategoriesInformation[]
     * "Anime": CharacterCategoriesInformation[]
     * "Game Characters": CharacterCategoriesInformation[]
     * "Movies & TV": CharacterCategoriesInformation[]
     * "Comedy": CharacterCategoriesInformation[]
     * "Books": CharacterCategoriesInformation[]
     * "VTuber": CharacterCategoriesInformation[]
     * "Image Generating": CharacterCategoriesInformation[]
     * "Discussion": CharacterCategoriesInformation[]
     * "Famous People": CharacterCategoriesInformation[]
     * "Language Learning": CharacterCategoriesInformation[]
     * "Religion": CharacterCategoriesInformation[]
     * "History": CharacterCategoriesInformation[]
     * "Animals": CharacterCategoriesInformation[]
     * "Philosophy": CharacterCategoriesInformation[]
     * "Politics": CharacterCategoriesInformation[]
     * "Chinese": CharacterCategoriesInformation[]
     * }} CharacterCategories
    */

    /**
     * @typedef {{
     * "Helpers": CharacterCategoriesInformation[]
     * "Anime Game Characters": CharacterCategoriesInformation[]
     * "Games": CharacterCategoriesInformation[]
     * "Anime": CharacterCategoriesInformation[]
     * "Game Characters": CharacterCategoriesInformation[]
     * "Movies & TV": CharacterCategoriesInformation[]
     * "Comedy": CharacterCategoriesInformation[]
     * "Books": CharacterCategoriesInformation[]
     * "VTuber": CharacterCategoriesInformation[]
     * "Image Generating": CharacterCategoriesInformation[]
     * "Discussion": CharacterCategoriesInformation[]
     * "Famous People": CharacterCategoriesInformation[]
     * "Language Learning": CharacterCategoriesInformation[]
     * "Religion": CharacterCategoriesInformation[]
     * "History": CharacterCategoriesInformation[]
     * "Animals": CharacterCategoriesInformation[]
     * "Philosophy": CharacterCategoriesInformation[]
     * "Politics": CharacterCategoriesInformation[]
     * "Chinese": CharacterCategoriesInformation[]
     * }} CharacterCategories
    */

    /**
     * @typedef {{voices: [{
     * id: string,
     * name: string,
     * description: string,
     * gender: string,
     * visibility: string,
     * creatorInfo: {id: string, source: string, username: string},
     * audioSourceType: string,
     * previewText: string,
     * previewAudioURI: string,
     * backendProvider: string,
     * backendId: string,
     * internalStatus: string,
     * lastUpdateTime: string
     * }]}} FeaturedVoices
   */
    #prop;
    constructor(prop) {
        this.#prop = prop;
    }

    /**
     * Get a list of characters displayed by the Character.AI server.  
     *   
     * Example: `await library_name.explore.featured()`
     * 
     * @returns {Promise<ExploreCharacter>}
    */
    async featured() {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch("https://neo.character.ai/recommendation/v1/featured", "GET", {"Authorization": `Token ${this.#prop.token}`})).json()
    }

    /**
     * Get a list of simillar character from ID character.  
     *   
     * Example: `await library_name.explore.simillar_char(char_id)`
     * 
     * @returns {Promise<ExploreCharacter>}
    */
    async simillar_char(char_id) {
        if (!this.#prop.token) throw "Please login first.";
        if (!char_id) throw "Character ID cannot be empty! Please input the Character ID.";
        return await (await https_fetch(`https://neo.character.ai/recommendation/v1/character/${char_id}`, "GET", {"Authorization": `Token ${this.#prop.token}`})).json();
    }

    /**
     * Get a list of characters recommended by the Character.AI server.  
     *   
     * Example: `await library_name.explore.for_you()`
     * 
     * @returns {Promise<ExploreCharacter>}
    */
    async for_you() {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch("https://neo.character.ai/recommendation/v1/user", "GET", {"Authorization": `Token ${this.#prop.token}`})).json()
    }

    /**
     * Get a list of discovery tags by the Character.AI server.  
     *   
     * Example: `await library_name.explore.discovery_tags()`
     * 
     * @returns {Promise<{tags: String[]}>}
     */
    async discovery_tags() {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch("https://neo.character.ai/recommendation/v1/discovery_tags", "GET", {
            "Authorization": `Token ${this.#prop.token}`
        })).json()
    }

    /**
     * Get a list of characters by tags.  
     *   
     * Example: `await library_name.explore.character_with_tags()`
     * 
     * @param {string} tag
     * @returns {Promise<{tags: String[]}>}
     */
    async characters_with_tag(tag) {
        if (!this.#prop.token) throw "Please login first."
        if (typeof tag != "string") throw "Parameter 'name' is inavlid. Please fill it correctly."
        
        return await (await https_fetch(`https://neo.character.ai/recommendation/v1/characters_with_tag/${tag}`, "GET", {
            "Authorization": `Token ${this.#prop.token}`
        })).json()
    }

    /**
     * Get a list of characters from the character category exploration.  
     *   
     * Example: `await library_name.explore.character_categories()`
     * 
     * @returns {Promise<CharacterCategories>}
    */
    async character_categories() {
        return (await (await https_fetch("https://plus.character.ai/chat/curated_categories/characters/", "GET", {"Authorization": `Token ${this.#prop.token}`})).json()).characters_by_curated_category
    }

    /**
     * Get a list of featured voices.  
     *   
     * Example: `await library_name.explore.featured_voices()`
     * 
     * @returns {Promise<FeaturedVoices>}
    */
    async featured_voices() {
        return (await (await https_fetch("https://neo.character.ai/multimodal/api/v1/voices/featured", "GET", {"Authorization": `Token ${this.#prop.token}`})).json())
    }
}

class Character_Class {
    /**
     * @typedef {Object} CharactersSearchInfo
     * @property {Object[]} characters
     * @property {string} characters[].title
     * @property {string} characters[].greeting
     * @property {string} characters[].description
     * @property {string} characters[].external_id
     * @property {number} characters[].priority
     * @property {string} characters[].avatar_file_name
     * @property {string} characters[].visibility
     * @property {string} characters[].tag_id
     * @property {string} characters[].tag
     * @property {number} characters[].created_at
     * @property {number} characters[].updated_at
     * @property {number} characters[].num_likes
     * @property {number} characters[].num_interactions_last_day
     * @property {number} characters[].score
     * @property {string} characters[].participant__name
     * @property {string} characters[].user__username
     * @property {number} characters[].participant__num_interactions
     * @property {string} uuid
     * @property {Object[]} tags
     * @property {string} tags.id
     * @property {string} tags.name 
     * @property {boolean} safety_filtered
    */

    /**
     * @typedef {Object} CharacterInformation
     * @property {Object} character
     * @property {string} character.external_id
     * @property {string} character.title
     * @property {string} character.name
     * @property {string} character.visibility
     * @property {string} character.copyable
     * @property {string} character.greeting
     * @property {string} character.description
     * @property {string} character.identifier
     * @property {string} character.avatar_file_name
     * @property {[]} character.songs
     * @property {boolean} character.img_gen_enabled
     * @property {string} character.base_img_prompt
     * @property {string} character.img_prompt_regex
     * @property {boolean} character.strip_img_prompt_from_msg
     * @property {string | undefined} character.default_voice_id
     * @property {object | undefined} character.starter_prompts
     * @property {string[] | undefined} character.starter_prompts.phrases
     * @property {string} character.user__username
     * @property {string} character.participant__name
     * @property {number} character.participant__num_interactions
     * @property {string} character.participant__user__username
     * @property {string} character.voice_id
     * @property {string} character.usage
     * @property {string} character.upvotes
     * @property {string} status
    */

    /**
     * @typedef {Object} CharacterRecentList
     * @property {Object[]} chats
     * @property {string} chats.chat_id
     * @property {string} chats.create_time
     * @property {string} chats.creator_id
     * @property {string} chats.character_id
     * @property {string} chats.state
     * @property {string} chats.type
     * @property {string} chats.visibility
     * @property {string} chats.character_name
     * @property {string} chats.character_avatar_uri
     * @property {string} chats.character_visibility
     * @property {Object} chats.character_translations
     * @property {string | undefined} chats.default_voice_id
     * @property {Object} chats.streak
     * @property {number} chats.streak.user_id
     * @property {number} chats.streak.character_id
     * @property {number} chats.streak.streak
     * @property {string} chats.streak.last_chat_date
     * @property {string} chats.streak.last_chat_timestamp
     * @property {string} chats.streak.updated_at
     * @property {string} chats.streak.updated_date
    */

    /**
     * @typedef {Object} SingleCharacterChatInfo
     * @property {Object} turn
     * @property {Object} turn.turn_key
     * @property {string} turn.turn_key.chat_id
     * @property {string} turn.turn_key.turn_id
     * @property {string} turn.create_time
     * @property {string} turn.last_update_time
     * @property {string} turn.state
     * @property {Object} turn.author
     * @property {string} turn.author.author_id
     * @property {string} turn.author.name
     * @property {boolean} turn.author.is_human
     * @property {Object[]} turn.candidates
     * @property {string} turn.candidates[].candidate_id
     * @property {string} turn.candidates[].create_time
     * @property {string} turn.candidates[].raw_content
     * @property {string} turn.candidates[].tti_image_rel_path
     * @property {Object} turn.candidates[].editor
     * @property {string} turn.candidates[].editor.author_id
     * @property {string} turn.candidates[].editor.name
     * @property {boolean} turn.candidates[].is_final
     * @property {string} turn.candidates[].base_candidate_id
     * @property {string} turn.primary_candidate_id
    */

    #prop;
    constructor(prop) {
        this.#prop = prop
    }

    /**
     * Get character vote information.  
     *   
     * Example: `await library_name.character.votes("Character ID")`
     * 
     * @param {string} character_id
     * @returns {Promise<{status: string, votes: number}>}
    */
    async votes(character_id) {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch(`https://plus.character.ai/chat/character/${character_id}/votes/`, "GET", {"Authorization": `Token ${this.#prop.token}`})).json();
    }

    /**
     * Get character vote information in array.  
     *   
     * Example: `await library_name.character.votes_array("Character ID")`
     * 
     * @param {string} character_id
     * @returns {Promise<{status: string, upvotes_per_character: Record<string, number>}>}
    */
    async votes_array(character_id) {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch(`https://plus.character.ai/chat/characters/votes/`, "POST", {"Authorization": `Token ${this.#prop.token}`}, JSON.stringify({"character_ids": character_id}))).json();
    }

    /**
     * Used for vote the character.  
     *   
     * Example  
     * - Like: `await library_name.character.vote("Character ID", true)`  
     * - Dislike: `await library_name.character.vote("Character ID", false)`  
     * - Cancel (neither both): `await library_name.character.vote("Character ID", null)` or `library_name.character.vote("Character ID")`
     * 
     * @param {string} character_id
     * @param {boolean | null} vote
     * @returns {Promise<void>}
    */
    async vote(character_id, vote = null) {
        if (!this.#prop.token) throw "Please login first."
        await (await https_fetch(`https://plus.character.ai/chat/character/vote/`, "POST", {"Authorization": `Token ${this.#prop.token}`}, JSON.stringify({
            "external_id":character_id,
            "vote":vote
        }))).json();
    }

    /**
     * Get detailed information about characters.  
     *   
     * Example: `await library_name.character.info("Character ID")`
     * 
     * @param {string} char_id
     * @returns {Promise<CharacterInformation>}
    */
    async info(char_id) {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch("https://plus.character.ai/chat/character/info/", "POST", {
            'Authorization': `Token ${this.#prop.token}`,
            "Content-Type": "application/json"
        }, JSON.stringify({
            "external_id": char_id
        }))).json()
    }

    /**
     * Get tags info by Character ID (i guess?)  
     *   
     * Example: `await library_name.character.tags_info()`
     * 
     * @param {String[] | string} char_ids
     * @returns {Promise<{ranked_tags: String[], character_id_to_tags: String[]}>}
     */
    async tags_info(char_ids) {
        if (!this.#prop.token) throw "Please login first.";

        if (typeof char_ids == "string") {
            return await (await https_fetch("https://neo.character.ai/character/v1/characters_tags_info", "POST", {
                'Authorization': `Token ${this.#prop.token}`,
                "Content-Type": "application/json"
            }, JSON.stringify({"external_ids": [char_ids]}))).json()
        } else if (Array.isArray(char_ids)) {
            return await (await https_fetch("https://neo.character.ai/character/v1/characters_tags_info", "POST", {
                'Authorization': `Token ${this.#prop.token}`,
                "Content-Type": "application/json"
            }, JSON.stringify({"external_ids": char_ids}))).json()
        } else throw "Paramater 'char_ids' type must be string or array."
    }

    /**
     * Get a list of recent chat activity.  
     *   
     * Example: `await library_name.character.recent_list()`  
     * 
     * @returns {Promise<CharacterRecentList>}
    */
    async recent_list() {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch("https://neo.character.ai/chats/recent/", "GET", {
            'Authorization': `Token ${this.#prop.token}`
        })).json()
    }

    /**
     * Connect client to character chat.  
     *   
     * Example  
     * - Connect to character you already talk or new character: `await library_name.character.connect("Character ID")`  
     * - Connect to the new character and without greeting: `await library_name.character.connect("Character ID", false)`  
     * 
     * @param {string} char_id 
     * @param {boolean} is_greeting
     * @returns {Promise<CharacterRecentList>}
    */
    async connect(char_id, is_greeting = true) {
        if (!this.#prop.token) throw "Please login first."
        if (this.#prop.join_type) throw "You're already connectetd to another chat or group chat, please disconnect first"
        let res = await (await https_fetch(`https://neo.character.ai/chats/recent/${char_id}`, "GET", {
            'Authorization': `Token ${this.#prop.token}`
        })).json()

        if (!res.chats) {
            this.#prop.current_chat_id = generateRandomUUID();
            await send_ws(this.#prop.ws[1], JSON.stringify({
                "command": "create_chat",
                "request_id": generateRandomUUID().slice(0, -12) + char_id.slice(char_id.length - 12),
                "payload": {
                    "chat": {
                        "chat_id": this.#prop.current_chat_id,
                        "creator_id": `${this.#prop.user_data.user.user.id}`,
                        "visibility": "VISIBILITY_PRIVATE",
                        "character_id": char_id,
                        "type": "TYPE_ONE_ON_ONE"
                    },
                    "with_greeting": is_greeting
                }
            }), true, 1, false, true)

            res = await (await https_fetch(`https://neo.character.ai/chats/recent/${char_id}`, "GET", {
                'Authorization': `Token ${this.#prop.token}`
            })).json()
        }
        
        await https_fetch(`https://neo.character.ai/chat/${res.chats[0].chat_id}/resurrect`, "GET", {
            'Authorization': `Token ${this.#prop.token}`
        });

        this.#prop.current_chat_id = res.chats[0].chat_id
        this.#prop.join_type = 1;
        this.#prop.current_char_id_chat = char_id

        return res;
    }
    
    /**
     * Disconnecting client from character chat.  
     *   
     * Example: `await library_name.character.disconnect()`
     * 
     * @returns {Promise<boolean>}
    */
    async disconnect() {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.join_type || this.#prop.join_type != 1) throw "This function only works when you're connected on Single Character Chat."

        this.#prop.current_chat_id = "";
        this.#prop.current_char_id_chat = "";
        this.#prop.join_type = 0;

        return true;
    }

    /**
     * Send message to character.  
     *   
     * - Example (Default and if you're using `character.connect()` to connect to the Single Character.)  
     *      - Without manual turn
     *          ```js
     *          await library_name.character.send_message("Your Message", false, "URL Link (you can empty it if you don't want to send it)")
     *          ```  
     *      - With manual turn
     *          ```
     *          await library_name.character.send_message("Your Message", true, "URL Link (you can empty it if you don't want to send it)")
     *          ```
     *   
     * - Example (Manual input Character ID and Chat ID)  
     *      - Wtihout manual turn  
     *          ```js
     *          await library_name.character.send_message("Your Message", false, "URL Link (you can empty it if you don't want to send it)", {
     *              char_id: "Input your Character ID here.",
     *              chat_id: "Input your Chat ID here."
     *              timeout_ms: 0 // if you wanna using timeout. (default 0: no timeout)
     *          })
     *          ```  
     *      - With manual turn  
     *          ```js
     *          await library_name.character.send_message("Your Message", true, "URL Link (you can empty it if you don't want to send it)", {
     *              char_id: "Input your Character ID here.",
     *              chat_id: "Input your Chat ID here."
     *              timeout_ms: 0 // if you wanna using timeout. (default 0: no timeout)
     *          })
     *          ```
     * 
     * @param {string | undefined} message
     * @param {boolean | undefined} manual_turn
     * @param {string | undefined} image_url_path
     * @param {{char_id: string, chat_id: string, timeout_ms: number} | undefined} manual_opt
     * @returns {Promise<SingleCharacterChatInfo>}
    */
    async send_message(message = "", manual_turn = false, image_url_path = "", manual_opt = {
        char_id: this.#prop.current_char_id_chat,
        chat_id: this.#prop.current_chat_id,
        timeout_ms: 0
    }) {
        if (!this.#prop.token) throw "Please login first."

        if (typeof manual_opt != "object") {
            manual_opt = {
                char_id: this.#prop.current_char_id_chat,
                chat_id: this.#prop.current_chat_id,
                timeout_ms: 0
            }
        }
        if (!manual_opt.char_id) {
            if (this.#prop.current_char_id_chat) manual_opt.char_id = this.#prop.current_char_id_chat
            else throw "Character ID cannot be empty! please input Character ID correctly, or connect to the character by using character.connect() function."
        }
        if (!manual_opt.chat_id) {
            if (this.#prop.current_chat_id) manual_opt.chat_id = this.#prop.current_chat_id
            else throw "Chat ID cannot be empty! please input Chat ID correctly, or connect to the character by using character.connect() function."
        }
        if (typeof manual_opt.timeout_ms != "number") throw "Timeout input must be number."
        if (manual_opt.timeout_ms < 0) manual_opt.timeout_ms = 0;

        const turn_key = this.#prop.join_type ? generateRandomUUID() : ""

        return await send_ws(this.#prop.ws[1], JSON.stringify({
            "command": manual_turn ? "create_turn" : "create_and_generate_turn",
            "request_id": generateRandomUUID().slice(0, -12) + this.#prop.current_char_id_chat.slice(this.#prop.current_char_id_chat.length - 12),
            "payload": {
                "num_candidates": 1,
                "tts_enabled": true,
                "selected_language": "",
                "character_id": manual_opt.char_id,
                "user_name": this.#prop.user_data.user.user.username,
                "turn": {
                    "turn_key": {
                        "turn_id": turn_key,
                        "chat_id": manual_opt.chat_id
                    },
                    "author": {
                        "author_id": `${this.#prop.user_data.user.user.id}`,
                        "is_human": true,
                        "name": this.#prop.user_data.user.user.username
                    },
                    "candidates": [{
                        "candidate_id": turn_key,
                        "raw_content": message,
                        ...image_url_path ? { tti_image_rel_path: image_url_path } : {}
                    }],
                    "primary_candidate_id": turn_key
                },
                "previous_annotations": {
                    "boring": 0,
                    "not_boring": 0,
                    "inaccurate": 0,
                    "not_inaccurate": 0,
                    "repetitive": 0,
                    "not_repetitive": 0,
                    "out_of_character": 0,
                    "not_out_of_character": 0,
                    "bad_memory": 0,
                    "not_bad_memory": 0,
                    "long": 0,
                    "not_long": 0,
                    "short": 0,
                    "not_short": 0,
                    "ends_chat_early": 0,
                    "not_ends_chat_early": 0,
                    "funny": 0,
                    "not_funny": 0,
                    "interesting": 0,
                    "not_interesting": 0,
                    "helpful": 0,
                    "not_helpful": 0
                }
            },
            "origin_id": "Android"
        }), true, Number(!manual_turn), !manual_turn, false, manual_opt.timeout_ms)
    }

    /**
     * Generating message response from character.  
     *   
     * Example: `await library_name.character.generate_turn()`
     * 
     * @param {{char_id: string, chat_id: string, timeout_ms: number} | undefined} manual_opt
     * @returns {Promise<SingleCharacterChatInfo>}
    */
    async generate_turn(manual_opt = {
        char_id: this.#prop.current_char_id_chat,
        chat_id: this.#prop.current_chat_id,
        timeout_ms: 0
    }) {
        return await this.send_message("", "", "", manual_opt);
    }

    /**
     * Regenerate character message.  
     *   
     * Example: `await library_name.character.generate_turn_candidate("Turn ID")`
     * 
     * @param {string} turn_id
     * @param {{char_id: string, chat_id: string} | undefined} manual_opt
     * @returns {Promise<SingleCharacterChatInfo>}
    */
    async generate_turn_candidate(turn_id, manual_opt = {
        char_id: this.#prop.current_char_id_chat,
        chat_id: this.#prop.current_chat_id,
        timeout_ms: 0
    }) {
        if (!this.#prop.token) throw "Please login first."
        
        if (typeof manual_opt != "object") {
            manual_opt = {
                char_id: this.#prop.current_char_id_chat,
                chat_id: this.#prop.current_chat_id,
                timeout_ms: 0
            }
        }
        if (!manual_opt.char_id) {
            if (this.#prop.current_char_id_chat) manual_opt.char_id = this.#prop.current_char_id_chat
            else throw "Character ID cannot be empty! please input Character ID correctly, or connect to the character by using character.connect() function."
        }
        if (!manual_opt.chat_id) {
            if (this.#prop.current_chat_id) manual_opt.chat_id = this.#prop.current_chat_id
            else throw "Chat ID cannot be empty! please input Chat ID correctly, or connect to the character by using character.connect() function."
        }
        if (typeof manual_opt.timeout_ms != "number") throw "Timeout input must be number."
        if (manual_opt.timeout_ms < 0) manual_opt.timeout_ms = 0;
        
        return await send_ws(this.#prop.ws[1], JSON.stringify({
            "command": "generate_turn_candidate",
            "request_id": generateRandomUUID().slice(0, -12) + this.#prop.current_char_id_chat.slice(this.#prop.current_char_id_chat.length - 12),
            "payload": {
                "tts_enabled": this.#prop.is_connected_livekit_room[0] ? true : false,
                "selected_language": "",
                "character_id": manual_opt.char_id,
                "user_name": this.#prop.user_data.user.user.username,
                "turn_key": {
                    "turn_id": turn_id,
                    "chat_id": manual_opt.chat_id
                },
                "previous_annotations": {
                    "boring": 0,
                    "not_boring": 0,
                    "inaccurate": 0,
                    "not_inaccurate": 0,
                    "repetitive": 0,
                    "not_repetitive": 0,
                    "out_of_character": 0,
                    "not_out_of_character": 0,
                    "bad_memory": 0,
                    "not_bad_memory": 0,
                    "long": 0,
                    "not_long": 0,
                    "short": 0,
                    "not_short": 0,
                    "ends_chat_early": 0,
                    "not_ends_chat_early": 0,
                    "funny": 0,
                    "not_funny": 0,
                    "interesting": 0,
                    "not_interesting": 0,
                    "helpful": 0,
                    "not_helpful": 0
                }
            },
            "origin_id": "Android"
        }), true, 1, true)
    }

    /**
     * it will create a new conversation and your current conversation will save on the history.  
     *   
     * Example  
     * - With greeting: `await library_name.character.create_new_conversation()`  
     * - Without greeting: `await library_name.character.create_new_conversation(false)`
     * 
     * @param {boolean} with_greeting
     * @param {{char_id: string} | undefined} manual_opt
     * @returns {Promise<SingleCharacterChatInfo>}
    */
    async create_new_conversation(with_greeting = true, manual_opt = {
        char_id: this.#prop.current_char_id_chat
    }) {
        if (!this.#prop.token) throw "Please login first."

        if (!manual_opt.char_id) {
            if (this.#prop.current_char_id_chat) manual_opt.char_id = this.#prop.current_char_id_chat
            else throw "Character ID cannot be empty! please input Character ID correctly, or connect to the character by using character.connect() function."
        }
        
        const result = await send_ws(this.#prop.ws[1], JSON.stringify({
            "command": "create_chat",
            "request_id": generateRandomUUID().slice(0, -12) + manual_opt.char_id.slice(manual_opt.char_id.length - 12),
            "payload": {
                "chat": {
                    "chat_id": generateRandomUUID(),
                    "creator_id": `${this.#prop.user_data.user.user.id}`,
                    "visibility": "VISIBILITY_PRIVATE",
                    "character_id": manual_opt.char_id,
                    "type": "TYPE_ONE_ON_ONE"
                },
                "with_greeting": with_greeting
            },
            "origin_id": "Android"
        }), true, with_greeting, false, with_greeting)

        if (this.#prop.join_type == 1) {
            if (with_greeting) this.#prop.current_chat_id = result[0].chat.chat_id
            else this.#prop.current_chat_id = result.chat.chat_id
        }
        
        return result
    }

    /**
     * Delete character message.  
     *   
     * Example: `await library_name.character.delete_message("Turn ID")`
     * 
     * @param {string} turn_id
     * @param {{char_id: string, chat_id: string} | undefined} manual_opt
     * @returns {Promise<boolean>}
    */
    async delete_message(turn_id, manual_opt = {
        chat_id: this.#prop.current_chat_id,
        char_id: this.#prop.current_char_id_chat
    }) {
        if (!this.#prop.token) throw "Please login first."

        if (!manual_opt.char_id) {
            if (this.#prop.current_char_id_chat) manual_opt.char_id = this.#prop.current_char_id_chat
            else throw "Character ID cannot be empty! please input Character ID correctly, or connect to the character by using character.connect() function."
        }
        if (!manual_opt.chat_id) {
            if (this.#prop.current_chat_id) manual_opt.chat_id = this.#prop.current_chat_id
            else throw "Chat ID cannot be empty! please input Chat ID correctly, or connect to the character by using character.connect() function."
        }

        await send_ws(this.#prop.ws[1], JSON.stringify({
            "command": "remove_turns",
            "request_id": generateRandomUUID().slice(0, -12) + manual_opt.char_id.slice(manual_opt.char_id.length - 12),
            "payload": {
                "chat_id": manual_opt.chat_id,
                "turn_ids": Array.isArray(turn_id) ? turn_id : [turn_id]
            },
            "origin_id": "Android"
        }), false, 0, false)
        return true;
    }

    /**
     * Edit the character message.  
     *   
     * Example: `await library_name.character.edit_message("Candidate ID", "Turn ID", "New Message")`
     * 
     * @param {string} candidate_id
     * @param {string} turn_id
     * @param {string} new_message
     * @param {{char_id: string, chat_id: string} | undefined} manual_opt
     * @returns {Promise<SingleCharacterChatInfo>}
    */
    async edit_message(candidate_id, turn_id, new_message, manual_opt = {
        chat_id: this.#prop.current_chat_id,
        char_id: this.#prop.current_char_id_chat
    }) {
        if (!this.#prop.token) throw "Please login first."

        if (!manual_opt.char_id) {
            if (this.#prop.current_char_id_chat) manual_opt.char_id = this.#prop.current_char_id_chat
            else throw "Character ID cannot be empty! please input Character ID correctly, or connect to the character by using character.connect() function."
        }
        if (!manual_opt.chat_id) {
            if (this.#prop.current_chat_id) manual_opt.chat_id = this.#prop.current_chat_id
            else throw "Chat ID cannot be empty! please input Chat ID correctly, or connect to the character by using character.connect() function."
        }

        const result = await send_ws(this.#prop.ws[1], JSON.stringify({
            "command": "edit_turn_candidate",
            "request_id": generateRandomUUID().slice(0, -12) + manual_opt.char_id.slice(manual_opt.char_id.length - 12),
            "payload": {
                "turn_key": {
                    "chat_id": manual_opt.chat_id,
                    "turn_id": turn_id
                },
                "current_candidate_id": candidate_id,
                "new_candidate_raw_content": new_message
            },
            "origin_id": "Android"
        }), true, 1, false)

        if (!result.turn.author.is_human) {
            await send_ws(this.#prop.ws[1], JSON.stringify({
                "command": "update_primary_candidate",
                "payload": {
                    "candidate_id": candidate_id,
                    "turn_key": {
                        "chat_id": manual_opt.chat_id,
                        "turn_id": turn_id
                    }
                },
                "origin_id": "Android"
            }), false, 0, false)
        }
        return result;
    }

    /**
     * Generate text messages from character to voice audio.  
     *   
     * Example:
     * - if you have Voice ID: `await library_name.character.replay_tts("Turn ID", "Candidate ID", "fill the Voice Character ID here")`  
     * - if you don't have Voice ID and want to use Voice Query instead: `await library_name.character.replay_tts("Turn ID", "Candidate ID", "fill the Voice Query here", true)`
     * 
     * @param {string} turn_id
     * @param {string} candidate_id
     * @param {string} voice_id_or_query
     * @param {boolean} using_voice_query
     * @param {{chat_id: string} | undefined} manual_opt
     * @returns {Promise<{replayUrl: string}>}
    */
    async replay_tts(turn_id, candidate_id, voice_id_or_query = "", using_voice_query = false, manual_opt = {
        chat_id: this.#prop.current_chat_id
    }) {
        if (!this.#prop.token) throw "Please login first."

        if (!turn_id && !candidate_id) throw "Please fill Turn ID and Candidate ID."
        if (!voice_id_or_query) throw "Please fill Voice query or Voice ID."

        if (!manual_opt.chat_id) {
            if (this.#prop.current_chat_id) manual_opt.chat_id = this.#prop.current_chat_id
            else throw "Chat ID cannot be empty! please input Chat ID correctly, or connect to the character by using character.connect() function."
        }

        return await (await https_fetch("https://neo.character.ai/multimodal/api/v1/memo/replay", "POST", {
            "Authorization": `Token ${this.#prop.token}`,
            "Content-Type": "application/json"
        }, JSON.stringify({
            "roomId": manual_opt.chat_id,
            "turnId": turn_id,
            "candidateId": candidate_id,
            ...(using_voice_query ? {
                "voiceId": "",
                "voiceQuery": voice_id_or_query
            } : {
                "voiceId": voice_id_or_query,
                "voiceQuery": ""
            }),
        }))).json()
    }

    /**
     * Get character current voice info.  
     *   
     * Example:  
     * - Auto (you must already connected with character): `await library_name.character.current_voice()`  
     * - Manual: `await library_name.character.current_voice("Character ID")`
     * 
     * @param {string | undefined} character_id  
     * @returns {Promise<{character_external_id: string, voice_id: string}>}
    */
    async current_voice(character_id = "") {
        if (!this.#prop.token) throw "Please login first."
        if (!character_id && !this.#prop.current_char_id_chat) throw "Please input character ID."
        return await (await https_fetch(`https://plus.character.ai/chat/character/${character_id ? character_id : this.#prop.current_char_id_chat}/voice_override/`, "GET", {
            "Authorization": `Token ${this.#prop.token}`
        })).json()
    }
    
    /**
     * Get category used of the character.  
     *   
     * Example: `await library_name.character.get_category("Character ID")`
     * 
     * @param {string} character_id
     * @returns {Promise<{categories: []}>}
    */
    async get_category(character_id) {
        if (!this.#prop.token) throw "Please login first."
        if (!character_id) throw "Please input Character ID."

        return await (await https_fetch(`https://neo.character.ai/character/v1/categories/${character_id}`, "GET", {
            "Authorization": `Token ${this.#prop.token}`
        })).json()
    }

    /**
     * Get detailed information of the character about.  
     * REMEMBER: Specific Character only. if the character have an "about" feature, then you can use this function.  
     * Otherwise, it return noindex: true, or it means it empty.
     *   
     * Example: `await library_name.character.about("Short Hash of the character")`
     * 
     * @param {string} short_hash
     * @returns {Promise<{
     * about_character: {
     *     external_id: string,
     *     is_person_name: string,
     *     language: string,
     *     description: string,
     *     expertise: string,
     *     personality_question: string,
     *     personality_question_answer: string,
     *     slug: string,
     *     icebreakers: []
     *     noindex: boolean
     * }
     * }>}
     */
    async about(short_hash) {
        if (!this.#prop.token) throw "Please login first."
        if (!short_hash) throw "Please input Character ID."

        return await (await https_fetch(`https://neo.character.ai/character/v1/character/about/${short_hash}`, "GET", {
            "Authorization": `Token ${this.#prop.token}`
        })).json()
    }

    /**
     * Get detailed of the character. but, it will give you a FULL detailed of the Character, including character definition.  
     * REMMEBER: If the character defined turned to public, then you can use this function.  
     * Otherwise, it return an empty character data and the status says "do not have permission to view this Character".  
     * 
     * @param {string} char_id
     * @returns {Promise<{
     *      character: {
     *          id: number,
     *          external_id: string,
     *          name: string,
     *          participant__id: string,
     *          participant__name: string,
     *          participant__num_interactions: number,
     *          title: string,
     *          description: string,
     *          definition: string,
     *          sanitized_definition: string,
     *          greeting: string,
     *          user_id: number,
     *          voice_id: string | null,
     *          visibility: string,
     *          safety: string,
     *          archived: any | null,
     *          avatar_file_name: string,
     *          img_gen_enabled: boolean,
     *          base_img_prompt: string,
     *          img_gen_guidance_scale: any | null,
     *          user__username: string,
     *          is_persona: boolean,
     *          translations: {},
     *          default_voice_id: string,
     *          short_hash: string,
     *          identifier: string,
     *          img_prompt_regex: string,
     *          strip_img_prompt_from_msg: boolean,
     *          copyable: boolean,
     *          starter_prompts: {phrases: []} | null,
     *          comments_enabled: boolean,
     *          updated: string,
     *          categories: [{
     *              name: string,
     *              priority: number,
     *              description: string,
     *          }]
     *      }
     *      status: string | undefined
     * }>}
    */
    async info_detailed(char_id) {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch("https://plus.character.ai/chat/character/", "POST", {
            "Authorization": `Token ${this.#prop.token}`,
            "Content-Type": "application/json"
        }, JSON.stringify({
            "external_id": char_id
        }))).json()
    }
}

class Search_Class {
    #prop
    constructor(prop) {
        this.#prop = prop; 
    }

    /**
     * Get list of tags.  
     *   
     * Example: `await library_name.search.list_tags()`
     * 
     * @returns {Promise<>}
     */
    async list_tags() {
        if (!this.#prop.token) throw "Please login first.";

        return await (await https_fetch("https://neo.character.ai/search/v1/tags", "GET", {
            'Authorization': `Token ${this.#prop.token}`
        })).json()
    }

    /**
     * Search users by name.  
     *   
     * Example: `await library_name.search.users("Name user", "popular") // sorted by popular`
     * 
     * @template {"popular" | "followers"} T
     * @param {string} name
     * @param {T | "" | undefined} sorted_by
     * @returns {Promise<UserSearch>}
    */
    async users(name, sorted_by) {
        if (!this.#prop.token) throw "Please login first."
        if (typeof name != "string") throw "Parameter 'name' is inavlid. Please fill it correctly."
        if (typeof sorted_by != "string") throw "Parameter 'sorted_by' is invalid. Please fill it correctly."

        return await (await https_fetch(`https://neo.character.ai/search/v1/creator?query=${name}&sortedBy=${sorted_by}`, "GET", {
            "Authorization": `Token ${this.#prop.token}`
        })).json();
    }

    /**
     * Search scenes by query.  
     *   
     * Example: `await library_name.search.scenes("Query")`
     * 
     * @param {string} query
     * @returns {Promise<{"scenes": [], "uuid": string}>}
     */
    async scenes(query) {
        if (!this.#prop.token) throw "Please login first.";

        return await (await https_fetch(`https://neo.character.ai/search/v1/scene?query=${query}`, "GET", {
            'Authorization': `Token ${this.#prop.token}`
        })).json();
    }

    /**
     * Search for a characters by name.  
     *   
     * Example: `await library_name.search.characters("Character Name")`
     * 
     * @template {"relevance" | "likes" | "popular" | "newest"} T
     * @param {string} name
     * @param {T | "" | undefined} sorted_by
     * @returns {Promise<CharactersSearchInfo>}
    */
    async characters(name, sorted_by = "relevance") {
        if (!this.#prop.token) throw "Please login first."
        if (typeof name != "string") throw "Parameter 'name' is inavlid. Please fill it correctly."
        if (typeof sorted_by != "string") throw "Parameter 'sorted_by' is invalid. Please fill it correctly."
        
        return await (await https_fetch(`https://neo.character.ai/search/v1/character?query=${name}&sortedBy=${sorted_by}`, "GET", {
            'Authorization': `Token ${this.#prop.token}`
        })).json()
    }

    /**
     * Search for a voices by name.  
     *   
     * Example: `await library_name.search.voices("Name voice")`
     * 
     * @param {string} name
     * @returns {Promise<{ voices: VoiceInfo[] }>}
    */
    async voices(name) {
        return await (await https_fetch(`https://neo.character.ai/multimodal/api/v1/voices/search?characterName=${name}`, "GET", {
            "Authorization": `Token ${this.#prop.token}`
        })).json()
    }

    /**
     * Get popular search.  
     *   
     * Example: `await library_name.search.popular()`
     * 
     * @returns {Promise<String[]>}
    */
    async popular() {
        if (!this.#prop.token) throw "Please login first."

        return await (await https_fetch(`https://neo.character.ai/search/v1/query/popular`, "GET", {
            'Authorization': `Token ${this.#prop.token}`
        })).json()
    }

    /**
     * Get trending search.  
     *   
     * Example: `await library_name.search.trending()`
     * 
     * @returns {Promise<String[]>}
    */
    async trending() {
        if (!this.#prop.token) throw "Please login first."
        
        return await (await https_fetch(`https://neo.character.ai/search/v1/query/trending`, "GET", {
            'Authorization': `Token ${this.#prop.token}`
        })).json()
    }

    /**
     * Get autocomplete search.  
     *   
     * Example: `await library_name.search.autocomplete("Search")`
     * 
     * @param {string} query 
     * @returns {Promise<{"search_autocomplete": String[]}>}
     */
    async autocomplete(query) {
        if (!this.#prop.token) throw "Please login first.";

        return await (await https_fetch(`https://neo.character.ai/search/v1/query/autocomplete?query_prefix=${query}`, "GET", {
            'Authorization': `Token ${this.#prop.token}`
        })).json();
    }
    
    /** Get languages list.  
     *   
     * Example: `await library_name.search.languages()`
     * 
     * @returns {Promise<{languages: [{"id": string, "name": string, "localized_name": string, "code": string}]}>}
     */
    async languages() {
        if (!this.#prop.token) throw "Please login first.";

        return await (await https_fetch("https://neo.character.ai/search/v1/languages", "GET", {
            'Authorization': `Token ${this.#prop.token}`
        })).json();
    }
}

class GroupChat_Class {
    /**
     * @typedef {Object} GroupChatListInfo
     * @property {Object[]} rooms
     * @property {string} rooms[].id
     * @property {string} rooms[].title
     * @property {string} rooms[].description
     * @property {string} rooms[].visibility
     * @property {string} rooms[].picture
     * @property {Object[]} rooms[].characters
     * @property {string} rooms[].characters[].id
     * @property {string} rooms[].characters[].name
     * @property {string} rooms[].characters[].url
     * @property {Object[]} rooms[].users
     * @property {string} rooms[].users[].id
     * @property {string} rooms[].users[].username
     * @property {string} rooms[].users[].avatar_url
     * @property {string} rooms[].users[].role
     * @property {string} rooms[].users[].state
     * @property {[]} rooms[].permissions
     * @property {Object} rooms[].preview_turns
     * @property {[]} rooms[].preview_turns.turns
     * @property {Object} rooms[].preview_turns.meta
     * @property {string} rooms[].preview_turns.meta.next_token
     * @property {Object} rooms[].settings
     * @property {boolean} rooms[].settings.anyone_can_join
     * @property {boolean} rooms[].settings.require_approval
     * @property {boolean} rooms[].settings.auto_smart_reply
     * @property {boolean} rooms[].settings.smart_reply_timer
     * @property {string} rooms[].settings.join_token
     * @property {number} rooms[].settings.user_limit
     * @property {number} rooms[].settings.character_limit
     * @property {string} rooms[].settings.push_notification_mode
    */

    /**
     * @typedef {Object} GroupChatConnectInfo
     * @property {number} id
     * @property {string} error
     * @property {Object} subscribe
     * @property {boolean} subscribe.recoverable
     * @property {string} subscribe.epoch
     * @property {boolean} subscribe.positioned
    */

    /**
     * @typedef {Object} GroupChatDisconnectInfo
     * @property {number} id
     * @property {Object} subscribe
    */

    /**
     * @typedef {Object} GroupChatCreateInfo
     * @property {string} id
     * @property {string} title
     * @property {string} description
     * @property {string} visibility
     * @property {string} picture
     * @property {number} last_updated
     * @property {Object[]} characters
     * @property {string} characters[].id
     * @property {string} characters[].name
     * @property {string} characters[].avatar_url
     * @property {Object[]} users
     * @property {string} users[].id
     * @property {string} users[].username
     * @property {string} users[].name
     * @property {string} users[].avatar_url
     * @property {string} users[].role
     * @property {string} users[].state
     * @property {[]} permissions
     * @property {Object[]} preview_turns
     * @property {Object} preview_turns[].turns
     * @property {Object} preview_turns[].turns.turn_key
     * @property {string} preview_turns[].turns.turn_key.chat_id
     * @property {string} preview_turns[].turns.turn_key.turn_id
     * @property {string} preview_turns[].turns.create_time
     * @property {string} preview_turns[].turns.last_update_time
     * @property {string} preview_turns[].turns.state
     * @property {Object} preview_turns[].turns.author
     * @property {string} preview_turns[].turns.author.author_id
     * @property {string} preview_turns[].turns.author.name
     * @property {Object[]} preview_turns[].turns.candidates
     * @property {string} preview_turns[].turns.candidates[].candidate_id
     * @property {string} preview_turns[].turns.candidates[].create_time
     * @property {string} preview_turns[].turns.candidates[].raw_content
     * @property {Object} preview_turns[].turns.candidates[].editor
     * @property {string} preview_turns[].turns.candidates[].editor.author_id
     * @property {string} preview_turns[].turns.candidates[].editor.name
     * @property {boolean} preview_turns[].turns.candidates[].is_final
     * @property {string} preview_turns[].turns.primary_candidate_id
     * @property {string} preview_turns[].turns.primary_candidate_id
     * @property {Object} preview_turns[].meta
     * @property {string} preview_turns[].meta.next_token
     * @property {Object} settings
     * @property {boolean} settings.anyone_can_join
     * @property {boolean} settings.require_approval
     * @property {boolean} settings.auto_smart_reply
     * @property {boolean} settings.smart_reply_timer
     * @property {string} settings.join_token
     * @property {number} settings.user_limit
     * @property {number} settings.character_limit
     * @property {string} settings.push_notification_mode
    */

    /**
     * @typedef {Object} GroupChatDeleteInfo
     * @property {string} id
     * @property {string} command
    */

    /**
     * @typedef {Object} GroupChatActivityInfo
     * @property {string} id
     * @property {Object} users
     * @property {[]} users.added
     * @property {[]} users.removed
     * @property {Object} characters
     * @property {[]} characters.removed
     * @property {[]} characters.removed
     * @property {string} title
     * @property {string} command
    */

    /**
     * @typedef {Object} GroupChatInfo
     * @property {Object} push
     * @property {string} push.channel
     * @property {Object} push.pub
     * @property {Object} push.pub.data
     * @property {Object} push.pub.data.turn
     * @property {Object} push.pub.data.turn.turn_key
     * @property {string} push.pub.data.turn.turn_key.chat_id
     * @property {string} push.pub.data.turn.turn_key.turn_key
     * @property {string} push.pub.data.turn.create_time
     * @property {string} push.pub.data.turn.last_update_time
     * @property {string} push.pub.data.turn.state
     * @property {Object} push.pub.data.turn.author
     * @property {string} push.pub.data.turn.author.author_id
     * @property {string} push.pub.data.turn.author.is_human
     * @property {string} push.pub.data.turn.author.name
     * @property {Object[]} push.pub.data.turn.candidates
     * @property {string} push.pub.data.turn.candidates[].candidate_id
     * @property {string} push.pub.data.turn.candidates[].create_time
     * @property {string} push.pub.data.turn.candidates[].raw_content
     * @property {string} push.pub.data.turn.candidates[].tti_image_rel_path
     * @property {string} push.pub.data.turn.candidates[].base_candidate_id
     * @property {Object} push.pub.data.turn.candidates[].editor
     * @property {string} push.pub.data.turn.candidates[].editor.author_id
     * @property {boolean} push.pub.data.turn.candidates[].is_final
     * @property {string} push.pub.data.turn.primary_candidate_id
     * @property {Object} push.pub.data.chat_info
     * @property {string} push.pub.data.chat_info.type
     * @property {string} push.pub.data.command
     * @property {string} push.pub.data.request_id
     * @property {number} push.pub.offset
    */

    #prop;
    constructor(prop) {
        this.#prop = prop;
    }

    /**
     * Get all list available group chat in account.  
     *   
     * Example: `await library_name.group_chat.list()`
     * 
     * @returns {Promise<GroupChatListInfo>}
    */
    async list() {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch("https://neo.character.ai/murooms/?include_turns=false", "GET", {
            'Authorization': `Token ${this.#prop.token}`
        })).json()
    }

    /**
     * Connecting to group chat by the Room ID.  
     *   
     * Example: `await library_name.group_chat.connect("Room ID")`
     * 
     * @param {string} room_id
     * @returns {Promise<GroupChatConnectInfo>}
    */
    async connect(room_id) {
        if (!this.#prop.token) throw "Please login first."
        if (this.#prop.join_type == 2) throw "You are already connected from the room"

        const res = await send_ws(this.#prop.ws[0], `{"subscribe":{"channel":"room:${room_id}"},"id":1}`, true, 0, false)
        if (res.error) return res;
        this.#prop.current_chat_id = room_id;
        this.#prop.join_type = 2;
        return res;
    }

    /**
     * Disconnecting from group chat by the Room ID.  
     *   
     * Example: `await library_name.group_chat.disconnect()`
     * 
     * @returns {Promise<GroupChatDisconnectInfo>}
    */
    async disconnect() {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.join_type || this.#prop.join_type != 2) throw "This function only works when you're connected on Group Chat."
        
        const res = await send_ws(this.#prop.ws[0], `{"unsubscribe":{"channel":"room:${this.#prop.current_chat_id}"},"id":1}`, true, 0, false)

        this.#prop.join_type = 0;
        this.#prop.current_chat_id = "";
        return res;
    }

    /**
     * Create group chat.  
     *   
     * Example  
     * - 1 character: `await library_name.group_chat.create("Title Room", "Character ID")`  
     * - more than 1 character: `await library_name.group_chat.create("Title Room", ["Character ID 1", "Character ID 2", ...])`
     * 
     * @param {string} title_room
     * @param {string | string[]} char_id
     * @returns {Promise<GroupChatCreateInfo>}
    */
    async create(title_room, char_id) {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch("https://neo.character.ai/muroom/create", "POST", {'Authorization': `Token ${this.#prop.token}`}, JSON.stringify({
            "characters": Array.isArray(char_id) ? char_id : [char_id],
            "title": title_room,
            "settings": {
                "anyone_can_join": true,
                "require_approval": false
            },
            "visibility": "VISIBILITY_UNLISTED",
            "with_greeting": true
        }))).json()
    }

    /**
     * Delete group chat.  
     *   
     * Example: `await library_name.group_chat.delete("Room ID")`
     * 
     * @param {string} room_id 
     * @returns {Promise<GroupChatDeleteInfo>}
    */
    async delete(room_id) {
        if (!this.#prop.token) throw "Please login first."
        if (this.#prop.join_type == 2) await send_ws(this.#prop.ws[0], `{"unsubscribe":{"channel":"room:${this.#prop.current_chat_id}"},"id":1}`, true, 0, false)
        return await (await https_fetch(`https://neo.character.ai/muroom/${this.#prop.join_type == 2 ? this.#prop.current_chat_id : room_id}/`, "DELETE", {'Authorization': `Token ${this.#prop.token}`})).json()
    }
    
    /**
     * Rename group chat.  
     *   
     * Example: 
     * - Automatic (must be connected to the group chat): `await library_name.group_chat.rename("New Name")`  
     * - Input group_id manually: `await library_name.group_chat.rename("New Name", "Room ID")`  
     *   
     * NOTE: You can also rename another group chat if you're already connected to the current group chat. (group_id prioritize)
     * 
     * @param {string} new_name
     * @param {string | undefined} group_id
     * @returns {Promise<GroupChatActivityInfo>}
    */
    async rename(new_name, group_id = this.#prop.current_chat_id) {
        if (!this.#prop.token) throw "Pleae login first"

        if (!group_id && !this.#prop.current_chat_id) {
            if (!this.#prop.current_candidate_id) throw "Please at least input group_id or connect to the group chat first.";
            else group_id = this.#prop.current_chat_id
        }

        return await (await https_fetch(`https://neo.character.ai/muroom/${group_id}/`, "PATCH", {'Authorization': `Token ${this.#prop.token}`}, JSON.stringify([
            {
                "op": "replace",
                "path": `/muroom/${group_id}`,
                "value": {
                    "title": `${new_name}`
                }
            }
        ]))).json()
    }

    /**
     * Joining group chat using invite code.  
     *   
     * Example: `await library_name.group_chat.join_group_invite("Group Chat Invite Code")`
     * 
     * @param {string} invite_code
     * @returns {Promise<GroupChatCreateInfo & {command: string}>}
    */
    async join_group_invite(invite_code) {
        if (!this.#prop.token) throw "Please login first."
        await https_fetch(`https://neo.character.ai/muroom/?join_token=${invite_code}`, "GET", {'Authorization': `Token ${this.#prop.token}`})
        return await (await https_fetch("https://neo.character.ai/muroom/join", "POST", {'Authorization': `Token ${this.#prop.token}`}, `{"join_token":"${invite_code}"}`)).json()
    }

    /**
     * Add a character with Character ID to the group chat.  
     *   
     * Example (Connected to current Group Chat): `await library_name.group_chat.char_add("Character ID")`  
     * Example (targeting to another Group chat): `await library_name.group_chat.char_add("Character ID", {groupchat_id: "Group Chat ID"})`  
     *   
     * NOTE: You can also add a character to another group chat even if you're already connected to the current group chat. (group_id prioritize)
     * 
     * @param {string} char_id
     * @param {{groupchat_id: string, timeout_ms: number} | undefined} manual_opt
     * @returns {Promise<GroupChatActivityInfo>}
    */
    async char_add(char_id, manual_opt = {groupchat_id: this.#prop.current_chat_id, timeout_ms: 0}) {
        if (!this.#prop.token) throw "Please login first."

        if (typeof manual_opt != "object") manual_opt = {groupchat_id: this.#prop.current_chat_id, timeout_ms: 0}
        if (typeof manual_opt.groupchat_id != "string" || !manual_opt.groupchat_id) manual_opt.groupchat_id = this.#prop.current_chat_id
        if (typeof manual_opt.timeout_ms != "number" || manual_opt.timeout_ms < 0) manual_opt.timeout_ms = 0;

        if (!manual_opt.groupchat_id) throw "Group Chat ID cannot be empty, or at least connect to the Group Chat first.";

        if (Array.isArray(char_id)) {
            return await (await https_fetch(`https://neo.character.ai/muroom/${manual_opt.groupchat_id}/`, "PATCH", {
                'Authorization': `Token ${this.#prop.token}`
            }, JSON.stringify(char_id.map(id => {
                return {
                    "op": "add",
                    "path": `/muroom/${manual_opt.groupchat_id}/characters`,
                    "value": {
                        "id": id
                    }
                };
            })))).json()
        } else {
            if (typeof char_id !== "string") throw "Please provide a valid character id."
            return await (await https_fetch(`https://neo.character.ai/muroom/${manual_opt.groupchat_id}/`, "PATCH", {
                'Authorization': `Token ${this.#prop.token}`
            }, JSON.stringify([{
                "op": "add",
                "path": `/muroom/${manual_opt.groupchat_id}/characters`,
                "value": {
                    "id": char_id
                }
            }]))).json()
        }
    }

    /**
     * Remove a character with Character ID from the group chat.  
     *   
     * Example  
     * Example (Connected to current Group Chat): `await library_name.group_chat.char_remove("Character ID")`  
     * Example (targeting to another Group chat): `await library_name.group_chat.char_remove("Character ID", {groupchat_id: "Group Chat ID"})`  
     *   
     * NOTE: You can also remove the character to another group chat even if you're already connected to the current group chat. (group_id prioritize)
     * 
     * @param {string} char_id
     * @param {{groupchat_id: string, timeout_ms: number} | undefined} manual_opt
     * @returns {Promise<GroupChatActivityInfo>}
    */
    async char_remove(char_id, manual_opt = {groupchat_id: this.#prop.current_chat_id, timeout_ms: 0}) {
        if (!this.#prop.token) throw "Please login first."

        if (typeof manual_opt != "object") manual_opt = {groupchat_id: this.#prop.current_chat_id, timeout_ms: 0}
        if (typeof manual_opt.groupchat_id != "string" || !manual_opt.groupchat_id) manual_opt.groupchat_id = this.#prop.current_chat_id
        if (typeof manual_opt.timeout_ms != "number" || manual_opt.timeout_ms < 0) manual_opt.timeout_ms = 0;

        if (!manual_opt.groupchat_id) throw "Group Chat ID cannot be empty, or at least connect to the Group Chat first.";

        if (Array.isArray(char_id)) {
            return await (await https_fetch(`https://neo.character.ai/muroom/${manual_opt.groupchat_id}/`, "PATCH", {
                'Authorization': `Token ${this.#prop.token}`
            }, JSON.stringify(char_id.map(id => {
                return {
                    "op": "remove",
                    "path": `/muroom/${manual_opt.groupchat_id}/characters`,
                    "value": {
                        "id": id
                    }
                };
            })))).json()
        } else {
            return await (await https_fetch(`https://neo.character.ai/muroom/${manual_opt.groupchat_id}/`, "PATCH", {
                'Authorization': `Token ${this.#prop.token}`
            }, JSON.stringify([{
                "op": "remove",
                "path": `/muroom/${manual_opt.groupchat_id}/characters`,
                "value": {
                    "id": char_id
                }
            }]))).json()
        }
    }

    /**
     * Send message to group chat.  
     *   
     * Example (Connected to the Group chat)  
     * - Default (Without Image): `await library_name.group_chat.send_message("Your Message")`  
     * - With Image: `await library_name.group_chat.send_message("Your Message", "URL Image")`  
     *   
     * Example (Manually connect to the Group chat)  
     * - Default (Without Image)
     * ```
     * await library_name.group_chat.send_message("Your Message", null, {
     *     groupchat_id: "Group Chat ID"
     * })
     * ```  
     * - With Image
     * ```
     * await library_name.group_chat.send_message("Your Message", "URL Image", {
     *      groupchat_id: "Group Chat ID"
     * })
     * ```
     * 
     * @param {string} message
     * @param {string | undefined} image_url_path
     * @param {{groupchat_id: string, timeout_ms: number} | undefined} manual_opt
     * @returns {Promise<GroupChatInfo>}
    */
    async send_message(message, image_url_path = "", manual_opt = {groupchat_id: this.#prop.current_chat_id, timeout_ms: 0}) {
        if (!this.#prop.token) throw "Please login first."

        if (typeof manual_opt != "object") manual_opt = {groupchat_id: this.#prop.current_chat_id, timeout_ms: 0}
        if (typeof manual_opt.groupchat_id != "string" || !manual_opt.groupchat_id) manual_opt.groupchat_id = this.#prop.current_chat_id
        if (typeof manual_opt.timeout_ms != "number" || manual_opt.timeout_ms < 0) manual_opt.timeout_ms = 0;

        if (!manual_opt.groupchat_id) throw "Group Chat ID cannot be empty, or at least connect to the Group Chat first.";

        const turn_key = generateRandomUUID();
        return await send_ws(this.#prop.ws[0], JSON.stringify({
            "rpc": {
                "method": "unused_command",
                "data": {
                    "command": "create_turn",
                    "request_id": generateRandomUUID().slice(0, -12) + manual_opt.groupchat_id.split("-")[4],
                    "payload": {
                        "chat_type": "TYPE_MU_ROOM",
                        "num_candidates": 1,
                        "user_name": this.#prop.user_data.user.user.username,
                        "turn": {
                            "turn_key": {
                                "turn_id": turn_key,
                                "chat_id": manual_opt.groupchat_id
                            },
                            "author": {
                                "author_id": `${this.#prop.user_data.user.user.id}`,
                                "is_human": true,
                                "name": this.#prop.user_data.user.user.username
                            },
                            "candidates": [{
                                "candidate_id": turn_key,
                                "raw_content": message,
                                ...image_url_path ? { tti_image_rel_path: image_url_path } : {}
                            }],
                            "primary_candidate_id": turn_key
                        }
                    }
                }
            },
            "id": 1
        }), true, 2, false, null, manual_opt.timeout_ms)
    }

    /**
     * Generating message response character from group chat.  
     *   
     * Example (Connected to the Group Chat): `await library_name.group_chat.generate_turn()`  
     * Example (Manually connect to the Group chat)  
     * ```
     * await library_name.group_chat.generate_turn({
     *      groupchat_id: "Your Group Chat ID"
     * })
     * ```
     * 
     * @param {{groupchat_id: string, timeout_ms: number} | undefined} manual_opt
     * @returns {Promise<GroupChatInfo>}
    */
    async generate_turn(manual_opt = {groupchat_id: this.#prop.current_chat_id, timeout_ms: 0}) {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.join_type || this.#prop.join_type != 2) throw "This function only works when you're connected on Group Chat."
        
        if (typeof manual_opt != "object") manual_opt = {groupchat_id: this.#prop.current_chat_id, timeout_ms: 0}
        if (typeof manual_opt.groupchat_id != "string" || !manual_opt.groupchat_id) manual_opt.groupchat_id = this.#prop.current_chat_id
        if (typeof manual_opt.timeout_ms != "number" || manual_opt.timeout_ms < 0) manual_opt.timeout_ms = 0;

        if (!manual_opt.groupchat_id) throw "Group Chat ID cannot be empty, or at least connect to the Group Chat first.";

        return await send_ws(this.#prop.ws[0], JSON.stringify({
            "rpc": {
                "method": "unused_command",
                "data": {
                    "command": "generate_turn",
                    "request_id": generateRandomUUID().slice(0, -12) + manual_opt.groupchat_id.split("-")[4],
                    "payload": {
                        "chat_type": "TYPE_MU_ROOM",
                        "chat_id": manual_opt.groupchat_id,
                        "user_name": this.#prop.user_data.user.user.username,
                        "smart_reply": "CHARACTERS",
                        "smart_reply_delay": 0
                    },
                    "origin_id":"Android"
                }
            },
            "id": 1
        }), true, 2, true, null, manual_opt.timeout_ms)
    }

    /**
     * Regenerate character message.  
     *   
     * Example (Connected to current Group Chat): `await library_name.group_chat.generate_turn_candidate("Turn ID", "Character ID")`  
     * Example (targeting to another Group chat)  
     * ```
     * await library_name.group_chat.generate_turn_candidate("Turn ID", "Character ID", {
     *      groupchat_id: "Your Group Chat ID"
     * })
     * ```
     * 
     * @param {string} turn_id
     * @param {string} char_id
     * @param {{groupchat_id: string, timeout_ms: number} | undefined} manual_opt
     * @returns {Promise<GroupChatInfo>}
    */
    async generate_turn_candidate(turn_id, char_id, manual_opt = {groupchat_id: this.#prop.current_chat_id, timeout_ms: 0}) {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.join_type || this.#prop.join_type != 2) throw "This function only works when you're connected on Group Chat."
        
        if (typeof manual_opt != "object") manual_opt = {groupchat_id: this.#prop.current_chat_id, timeout_ms: 0}
        if (typeof manual_opt.groupchat_id != "string" || !manual_opt.groupchat_id) manual_opt.groupchat_id = this.#prop.current_chat_id
        if (typeof manual_opt.timeout_ms != "number" || manual_opt.timeout_ms < 0) manual_opt.timeout_ms = 0;

        if (!manual_opt.groupchat_id) throw "Group Chat ID cannot be empty, or at least connect to the Group Chat first.";

        return await send_ws(this.#prop.ws[0], JSON.stringify({
            "rpc": {
                "method": "unused_command",
                "data": {
                    "command": "generate_turn_candidate",
                    "request_id": generateRandomUUID().slice(0, -12) + manual_opt.groupchat_id.split("-")[4],
                    "payload": {
                        "chat_type": "TYPE_MU_ROOM",
                        "character_id": char_id,
                        "user_name": this.#prop.user_data.user.user.username,
                        "turn_key": {
                            "turn_id": turn_id,
                            "chat_id": manual_opt.groupchat_id
                        }
                    }
                }
            },
            "id": 1
        }), true, 2, true, null, manual_opt.timeout_ms)
    }

    /**
     * Reset conversation in group chat.  
     *   
     * Example (Connected to current Group Chat): `await library_name.group_chat.reset_conversation()`  
     * Example (targeting to another Group chat): `await library_name.group_chat.reset_conversation({groupchat_id: "Group Chat ID"})`
     * 
     * @param {{groupchat_id: string, timeout_ms: number}} manual_opt
     * @returns {Promise<GroupChatInfo>}
    */
    async reset_conversation(manual_opt = {groupchat_id: this.#prop.current_chat_id, timeout_ms: 0}) {
        if (!this.#prop.token) throw "Please login first."

        if (typeof manual_opt != "object") manual_opt = {groupchat_id: this.#prop.current_chat_id, timeout_ms: 0}
        if (typeof manual_opt.groupchat_id != "string" || !manual_opt.groupchat_id) manual_opt.groupchat_id = this.#prop.current_chat_id
        if (typeof manual_opt.timeout_ms != "number" || manual_opt.timeout_ms < 0) manual_opt.timeout_ms = 0;

        if (!manual_opt.groupchat_id) throw "Group Chat ID cannot be empty, or at least connect to the Group Chat first.";

        const turn_key = generateRandomUUID()
        return await send_ws(this.#prop.ws[0], JSON.stringify({
            "rpc": {
                "method": "unused_command",
                "data": {
                    "command": "create_turn",
                    "request_id": generateRandomUUID().slice(0, -12) + manual_opt.groupchat_id.split("-")[4],
                    "payload": {
                        "chat_type": "TYPE_MU_ROOM",
                        "num_candidates": 1,
                        "user_name": this.#prop.user_data.user.user.username,
                        "turn": {
                            "context_reset": true,
                            "turn_key": {
                                "turn_id": turn_key,
                                "chat_id": manual_opt.groupchat_id
                            },
                            "author": {
                                "author_id": `${this.#prop.user_data.user.user.id}`,
                                "is_human": true,
                                "name": this.#prop.user_data.user.user.username
                            },
                            "candidates": [{
                                "candidate_id": turn_key,
                                "raw_content": "restart"
                            }],
                            "primary_candidate_id": turn_key
                        }
                    }
                }
            },
            "id": 1
        }), true, 2, false, false, manual_opt.timeout_ms)
    }

    /**
     * Delete user/character message.  
     *   
     * Example (Connected to current Group Chat): `await library_name.group_chat.delete_message("Turn ID")`  
     * Example (targeting to another Group chat): `await library_name.group_chat.delete_message("Turn ID", {groupchat_id: "Group Chat ID"})`
     * 
     * @param {string} turn_id
     * @param {{groupchat_id: string, timeout_ms: number}} manual_opt
     * @returns {Promise<boolean>}
    */
    async delete_message(turn_id, manual_opt = {groupchat_id: this.#prop.current_chat_id, timeout_ms: 0}) {
        if (!this.#prop.token) throw "Please login first."

        if (typeof manual_opt != "object") manual_opt = {groupchat_id: this.#prop.current_chat_id, timeout_ms: 0}
        if (typeof manual_opt.groupchat_id != "string" || !manual_opt.groupchat_id) manual_opt.groupchat_id = this.#prop.current_chat_id
        if (typeof manual_opt.timeout_ms != "number" || manual_opt.timeout_ms < 0) manual_opt.timeout_ms = 0;

        if (!manual_opt.groupchat_id) throw "Group Chat ID cannot be empty, or at least connect to the Group Chat first.";
        if (typeof turn_id !== "string") throw "Please provide a valid turn_id.";

        await send_ws(this.#prop.ws[1], JSON.stringify({
            "command": "remove_turns",
            "request_id": generateRandomUUID().slice(0, -12) + manual_opt.groupchat_id.split("-")[4],
            "payload": {
                "chat_id": manual_opt.groupchat_id,
                "turn_ids": Array.isArray(turn_id) ? turn_id : [turn_id]
            },
            "origin_id": "Android"
        }), false, 0, false, false, manual_opt.timeout_ms)
        return true;
    }

    /**
     * Edit user/character message.  
     *   
     * Example (Connected to current Group Chat): `await library_name.group_chat.edit_message("Candidate ID", "Turn ID", "New Message")`  
     * Example (targeting to another Group chat): `await library_name.group_chat.edit_message("Candidate ID", "Turn ID", "New Message", {groupchat_id: "Group Chat ID"})`
     * 
     * @param {string} candidate_id
     * @param {string} turn_id
     * @param {string} new_message
     * @param {{groupchat_id: string, timeout_ms: number}} manual_opt
     * 
     * @returns {Promise<GroupChatInfo>}
    */
    async edit_message(candidate_id, turn_id, new_message, manual_opt = {groupchat_id: this.#prop.current_chat_id, timeout_ms: 0}) {
        if (!this.#prop.token) throw "Please login first."
        
        if (typeof manual_opt != "object") manual_opt = {groupchat_id: this.#prop.current_chat_id, timeout_ms: 0}
        if (typeof manual_opt.groupchat_id != "string" || !manual_opt.groupchat_id) manual_opt.groupchat_id = this.#prop.current_chat_id
        if (typeof manual_opt.timeout_ms != "number" || manual_opt.timeout_ms < 0) manual_opt.timeout_ms = 0;

        if (!manual_opt.groupchat_id) throw "Group Chat ID cannot be empty, or at least connect to the Group Chat first.";

        if (typeof candidate_id !== "string") throw "Please provide a valid candidate_id.";
        if (typeof turn_id !== "string") throw "Please provide a valid turn_id.";
        
        const result = await send_ws(this.#prop.ws[0], JSON.stringify({
            "rpc": {
                "method": "unused_command",
                "data": {
                    "command": "edit_turn_candidate",
                    "request_id": generateRandomUUID().slice(0, -12) + manual_opt.groupchat_id.split("-")[4],
                    "payload": {
                        "turn_key": {
                            "chat_id": manual_opt.groupchat_id,
                            "turn_id": turn_id
                        },
                        "current_candidate_id": candidate_id,
                        "new_candidate_raw_content": new_message
                    }
                }
            },
            "id": 1
        }), true, 2, false, false, manual_opt.timeout_ms)

        if (!result.push.pub.data.turn.author.is_human) {
            await send_ws(this.#prop.ws[1], JSON.stringify({
                "command": "update_primary_candidate",
                "payload": {
                    "candidate_id": candidate_id,
                    "turn_key": {
                        "chat_id": this.#prop.current_chat_id,
                        "turn_id": turn_id
                    }
                },
                "origin_id": "Android"
            }), false, 0, false, manual_opt.timeout_ms)
        }
        return result;
    }

    /**
     * Select the turn of character chat by yourself.  
     *   
     * Example (Connected to current Group Chat): `await library_name.group_chat.select_turn("Character ID", "Turn ID")`  
     * Example (targeting to another Group chat): `await library_name.group_chat.select_turn("Character ID", {groupchat_id: "Group Chat ID"})`
     * 
     * @param {string} char_id
     * @param {{groupchat_id: string, timeout_ms: number}} manual_opt
     * @returns {Promise<GroupChatInfo>}
    */
    async select_turn(char_id, manual_opt = {groupchat_id: this.#prop.current_chat_id, timeout_ms: 0}) {
        if (!this.#prop.token) throw "Please login first."

        if (typeof manual_opt != "object") manual_opt = {groupchat_id: this.#prop.current_chat_id, timeout_ms: 0}
        if (typeof manual_opt.groupchat_id != "string" || !manual_opt.groupchat_id) manual_opt.groupchat_id = this.#prop.current_chat_id
        if (typeof manual_opt.timeout_ms != "number" || manual_opt.timeout_ms < 0) manual_opt.timeout_ms = 0;

        if (!manual_opt.groupchat_id) throw "Group Chat ID cannot be empty, or at least connect to the Group Chat first.";

        if (typeof char_id !== "string") throw "Please provide a valid char_id.";
        
        return await send_ws(this.#prop.ws[0], JSON.stringify({
            "rpc": {
                "method": "unused_command",
                "data": {
                    "command": "generate_turn",
                    "request_id": generateRandomUUID().slice(0, -12) + manual_opt.groupchat_id.split("-")[4],
                    "payload": {
                        "chat_type": "TYPE_MU_ROOM",
                        "character_id": char_id,
                        "chat_id": manual_opt.groupchat_id
                    }
                }
            },
            "id": 1
        }), true, 2, true, false, timeout_ms)
    }
}

class Chat_Class {
    /**
     * @typedef {Object} HistoryChatTurnsInfo
     * @property {Object[]} turns
     * @property {Object} turns[].turn_key
     * @property {string} turns[].turn_key.chat_id
     * @property {string} turns[].turn_key.turn_id
     * @property {string} turns[].create_time
     * @property {string} turns[].last_update_time
     * @property {string} turns[].state
     * @property {Object} turns[].author
     * @property {string} turns[].author.author_id
     * @property {string} turns[].author.name
     * @property {boolean} turns[].author.is_human
     * @property {Object[]} turns[].candidates
     * @property {string} turns[].candidates[].candidate_id
     * @property {string} turns[].candidates[].create_time
     * @property {string} turns[].candidates[].raw_content
     * @property {boolean} turns[].candidates[].is_final
     * @property {string} turns[].primary_candidate_id
     * @property {Object} meta
     * @property {string} meta.next_token
    */

    /**
     * @typedef {Object} HistoryArchiveConversationInfo
     * @property {Object[]} chats
     * @property {string} chats[].chat_id
     * @property {string} chats[].create_time
     * @property {string} chats[].creator_id
     * @property {string} chats[].character_id
     * @property {string} chats[].state
     * @property {string} chats[].type
     * @property {string} chats[].visibility
     * @property {string} chats[].name
    */

    /**
     * @typedef {Object} PinMessageInfo
     * @property {Object} turn
     * @property {Object} turn.turn_key
     * @property {string} turn.turn_key.chat_id
     * @property {string} turn.turn_key.turn_id
     * @property {string} turn.create_time
     * @property {string} turn.last_update_time
     * @property {string} turn.state
     * @property {Object} turn.author
     * @property {string} turn.author.author_id
     * @property {string} turn.author.name
     * @property {boolean} turn.author.is_human
     * @property {Object[]} turn.candidates
     * @property {string} turn.candidates[].candidate_id
     * @property {string} turn.candidates[].create_time
     * @property {string} turn.candidates[].raw_content
     * @property {string} turn.candidates[].tti_image_rel_path
     * @property {Object} turn.candidates[].editor
     * @property {string} turn.candidates[].editor.author_id
     * @property {string} turn.candidates[].editor.name
     * @property {boolean} turn.candidates[].is_final
     * @property {string} turn.candidates[].base_candidate_id
     * @property {string} turn.primary_candidate_id
     * @property {boolean} turn.is_pinned
     * @property {Object} chat_info
     * @property {string} chat_info.type
     * @property {string} command
     * @property {string} request_id
    */

    /**
     * @typedef {Object} ListPinnedMessageInfo
     * @property {Object[]} turns
     * @property {Object} turns[].turn_key
     * @property {string} turns[].turn_key.chat_id
     * @property {string} turns[].turn_key.turn_id
     * @property {string} turns[].create_time
     * @property {string} turns[].last_update_time
     * @property {string} turns[].state
     * @property {Object} turns[].author
     * @property {string} turns[].author.author_id
     * @property {string} turns[].author.name
     * @property {Object[]} turns[].candidates
     * @property {string} turns[].candidates[].candidate_id
     * @property {string} turns[].candidates[].create_time
     * @property {string} turns[].candidates[].raw_content
     * @property {boolean} turns[].candidates[].is_final
     * @property {string} turns[].primary_candidate_id
     * @property {boolean} turns[].is_pinned
     * @property {Object} meta
     * @property {string} meta.next_token
    */

    /** 
     * @typedef {Object} ConversationInfo
     * @property {Object} chat
     * @property {string} chat.chat_id
     * @property {string} chat.create_time
     * @property {string} chat.creator_id
     * @property {string} chat.character_id
     * @property {string} chat.state
     * @property {string} chat.type
     * @property {string} chat.visibility
    */

    #prop;
    constructor(prop) {
        this.#prop = prop;
    }

    /**
     * Get a history chat from group or single chat.  
     *   
     * Character.AI history chat loads 50 message, so if you want to load the previous 50 message, you must fill next_token (in the second parameter)  
     * 
     * Example  
     * - Already connected to the Group/Single chat: `await library_name.chat.history_chat_turns()`  
     * - Manual: `await library_name.chat.history_chat_turns("Chat ID")`  
     *   
     * Example (if you want to load previous 50 message)  
     * - Already connected to the Group/Single chat: `await library_name.chat.history_chat_turns("", "fill your next_token here")`  
     * - Manual: `await library_name.chat.history_chat_turns("Chat ID", "fill your next_token here")`
     * 
     * @param {string | undefined} chat_id
     * @param {string | undefined} next_token
     * @returns {Promise<HistoryChatTurnsInfo>}
    */
    async history_chat_turns(chat_id = "", next_token = "") {
        if (!this.#prop.token) throw "Please login first."

        return await (await https_fetch(`https://neo.character.ai/turns/${chat_id ? chat_id : this.#prop.current_chat_id}${next_token ? (`?next_token=${next_token}`) : ""}`, "GET", {
            'Authorization': `Token ${this.#prop.token}`
        })).json()
    }

    /**
     * Get converastion information.  
     *   
     * Example: `await library_name.chat.conversation_info("Chat ID")`
     * 
     * @param {string} chat_id
     * @returns {Promise<ConversationInfo>}
    */
    async conversation_info(chat_id) {
        if (!this.#prop.token) throw "Please login first."

        return await (await https_fetch(`https://neo.character.ai/chat/${chat_id}/`, "GET", {
            'Authorization': `Token ${this.#prop.token}`
        })).json()
    }

    /**
     * Get list of your history conversation from character. This function is for Single character only.  
     *   
     * Example
     * - Auto (Already connected to the Single character chat): `await library_name.chat.history_conversation_list()`  
     * - Manual: `await library_name.chat.history_conversation_list("Character ID")`
     * 
     * @param {string} character_id
     * @returns {Promise<HistoryArchiveConversationInfo>}
    */
    async history_conversation_list(character_id = "") {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.current_char_id_chat && !character_id) throw "Please input the Character ID, or you must connected to the single character chat."
        
        return await (await https_fetch(`https://neo.character.ai/chats/?character_ids=${character_id ? character_id : this.#prop.current_char_id_chat}`, "GET", {
            'Authorization': `Token ${this.#prop.token}`
        })).json()
    }

    /**
     * Set conversation chat, and bring the history chat into current chat. This function is for Single character only.  
     *   
     * Example: `await library_name.chat.set_conversation_chat("Chat ID")`
     * 
     * @param {string} chat_id 
     * @returns {Promise<void>}
     */
    async set_conversation_chat(chat_id) {
        if (!this.#prop.token) throw "Please login first."
        if (!chat_id) throw "Please input target Chat ID."

        if ((await (await https_fetch(`https://neo.character.ai/chat/${chat_id}/resurrect`, "GET", {
            'Authorization': `Token ${this.#prop.token}`
        })).json()).command === "neo_error") throw result.comment

        if (this.#prop.current_char_id_chat && (await this.conversation_info(chat_id)).chat.character_id === this.#prop.current_char_id_chat) this.#prop.current_chat_id = chat_id
    }

    /**
     * Pin message. This function is for Single character only.  
     *   
     * - if you set the second parameter false, it will unpin the message.  
     * - if you set the second parameter true, it will pin the message.  
     *   
     * Example  
     * - Auto (if your're already connected to the single character): `await library_name.chat.pin_message("turn ID")`  
     * - Manual: `await library_name.chat.pin_message("turn ID", true, "Chat ID")`
     * 
     * @param {string} turn_id
     * @param {boolean} pinned
     * @param {string} chat_id
     * 
     * @returns {Promise<PinMessageInfo>}
    */
    async pin_message(turn_id, pinned = true, chat_id = this.#prop.current_chat_id) {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.current_chat_id && !chat_id) throw "Please fill the chat_id or you must connected to the single character."
        
        return await send_ws(this.#prop.ws[1], JSON.stringify({
            "command": "set_turn_pin",
            "request_id": generateRandomUUID().slice(0, -12) + chat_id.slice(this.#prop.current_char_id_chat.length - 12),
            "payload": {
                "turn_key": {
                    "chat_id": chat_id ? chat_id : this.#prop.current_chat_id,
                    "turn_id": turn_id
                },
                "is_pinned": pinned
            }
        }), true, 0, false)
    }

    /**
     * Get list pinned message from chat. This function works only for single character chat.  
     *   
     * Example: `await library_name.chat.list_pinned_message("Chat ID")`
     * 
     * @param {string} chat_id
     * @returns {Promise<ListPinnedMessageInfo>}
    */
    async list_pinned_message(chat_id) {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.current_chat_id || !chat_id) throw "Please input the Chat ID, or you must connected to the single character chat."

        return await (await https_fetch(`https://neo.character.ai/turns/${chat_id ? chat_id : this.#prop.current_chat_id}/?pinned_only=true`, "GET", {
            'Authorization': `Token ${this.#prop.token}`
        })).json()
    }

    /**
     * Archive your conversation. This function works only for single character chat.  
     *   
     * Example  
     * - If you want archive the conversation: `await library_name.chat.archive_conversation("Chat ID", true)`  
     * - If you want unarchive the conversation: `await library_name.chat.archive_conversation("Chat ID", false)`
     * 
     * @param {string} chat_id
     * @param {boolean} set_archive
     * @returns {Promise<object>}
    */
    async archive_conversation(chat_id, set_archive = true) {
        if (!this.#prop.token) throw "Please login first."

        return await (await https_fetch(`https://neo.character.ai/chat/${chat_id}/${set_archive ? "archive" : "unarchive"}`, "PATCH", {
            'Authorization': `Token ${this.#prop.token}`
        })).json()
    }

    /**
     * Duplicate your conversation. This function works only for single character chat.  
     *   
     * Example: `await library_name.chat.duplicate_conversation("Chat ID", "Turn ID")`
     * 
     * @param {string} chat_id
     * @param {string} turn_id
     * @returns {Promise<{"new_chat_id": string}>}
     */
    async duplicate_conversation(chat_id, turn_id) {
        if (!this.#prop.token) throw "Please login first."

        return await (await https_fetch(`https://neo.character.ai/chat/${chat_id}/copy`, "POST", {
            'Authorization': `Token ${this.#prop.token}`,
            "Content-Type": "application/json"
        }, JSON.stringify({
            "end_turn_id": turn_id
        }))).json()
    }

    /**
     * Rename your conversation title. This function works only for single character chat.  
     *   
     * Example: `await library_name.chat.rename_conversation("Chat ID", "Custom Name")`
     * 
     * @param {string} chat_id
     * @param {string} name
     * @returns {Promise<void>}
     */
    async rename_conversation(chat_id, name) {
        if (!this.#prop.token) throw "Please login first."

        return await (await https_fetch(`https://neo.character.ai/chat/${chat_id}/update_name`, "PATCH", {
            'Authorization': `Token ${this.#prop.token}`,
            "Content-Type": "application/json"
        }, JSON.stringify({
            "name": name
        }))).json()
    }

    /**
     * i dont know what is this. but maybe this is for getting the facts of your conversation, i guess...?  
     * if you know this thing, please lemme know or you can do pull request if you want to.  
     *   
     * Example: `await library_name.chat.conversation_facts("Chat ID")`
     * 
     * @param {string} chat_id
     * @returns {Promise<{}>}
     */
    async conversation_facts(chat_id) {
        if (!this.#prop.token) throw "Please login first.";

        return await (await https_fetch(`https://neo.character.ai/chat/${chat_id}/conversation-facts`, "GET", {
            'Authorization': `Token ${this.#prop.token}`,
        })).json()
    }
}

class Notification_Class {
    /**
     * @typedef {Object[]} NotificationInfo
     * @property {string} id
     * @property {string} channel
     * @property {string} sent_at
     * @property {string} title
     * @property {string} body
     * @property {string} user_status
     * @property {Object} payload
     * @property {string} payload.type
     * @property {string} payload.id
     * @property {string} payload.notification_id
    */
    
    /**
     * @typedef {Object[]} NotificationInfoV2
     * @property {string} id
     * @property {string} channel
     * @property {string} sent_at
     * @property {string} title
     * @property {string} body
     * @property {string} user_status
     * @property {Object} payload
     * @property {string} payload.type
     * @property {string} payload.id
     * @property {string} payload.notification_id
     * @property {Object} payload.extra_metadata
     * @property {string} next_cursor
    */

    #prop;
    constructor(prop) {
        this.#prop = prop;
    }

    /**
     * Get all of the history notification.  
     *   
     * Example: `await library_name.notification.history()`
     * 
     * @returns {Promise<NotificationInfo>}
     */
    async history() {
        if (!this.#prop.token) throw "Please login first.";
        
        return await (await https_fetch("https://neo.character.ai/notifications/history", "GET", {
            'Authorization': `Token ${this.#prop.token}`
        })).json();
    }
    
    /**
     * Get all of the history notification (Version 2).  
     * In this Version 2, it has an extra metadata.  
     *   
     * Example: `await library_name.notification.history_v2()`
     * 
     * @returns {Promise<NotificationInfoV2>}
     */
    async history_v2() {
        if (!this.#prop.token) throw "Please login first.";
        
        return await (await https_fetch("https://neo.character.ai/v2/notifications/history", "GET", {
            'Authorization': `Token ${this.#prop.token}`
        })).json();
    }
}

class Livekit_Class extends EventEmitter {
    /**
     * Livekit variable list (when you're connected to the character voice)
     * - `is_character_speaking`: Check is Character is speaking or not.  
     *    
     * Livekit function list (when you're connected to the character voice)  
     *   
     * - `on()` event:  
     *   - "dataReceived": Receive Character.AI Livekit data events.  
     *   - "frameReceived": Receive audio stream from Livekit Server.  
     *   - "disconnected": Notify when the Voice is disconnect.  
     * - `input_write()`: Send audio PCM raw data to the Livekit Server.  
     * - `is_speech()`: this function checking is the PCM buffer frame is silence or not.  
     * - `interrupt_call()`: Interrupt while character talking.  
     * - `disconnect()`: Disconnect from voice character.
    */

    /**
     * @type {{
     *      cai_token: string
     *      livekit: import("@livekit/rtc-node"),
     *      livekit_room: import("@livekit/rtc-node").Room,
     *      audioSource: import("@livekit/rtc-node").AudioSource,
     *      audioStream: import("@livekit/rtc-node").AudioStream,
     *      opts: {chat_id: string, char_id: string, sample_rate: number, channel: number},
     *      interval_loop: setInterval,
     *      current_candidate_id: string,
     *      is_char_speaking: boolean
     * }}
    */
    #livekit_opt = {
        cai_token: null,
        livekit: null,
        livekit_room: null,
        audioSource: null,
        audioStream: null,
        opts: {chat_id: null, char_id: null, sample_rate: 0, channel: 0},
        interval_loop: null,
        current_candidate_id: null,
        is_char_speaking: false
    }

    /**
     * @param {string} cai_token
     * @param {import("@livekit/rtc-node")} lkit
     * @param {import("@livekit/rtc-node").Room} room
     * @param {{sample_rate: number, channel: number, chat_id: string, char_id: string}} opts
     * @param {number} using_mic
     * @param {any} track
    */
    constructor(cai_token, lkit, room, opts, using_mic, track) {
        super()
        this.#livekit_opt = {
            "cai_token": cai_token,
            "livekit": lkit,
            "livekit_room": room,
            "opts": opts,
            "audioStream": new lkit.AudioStream(track)
        }

        if (using_mic) {
            this.#livekit_opt.audioSource = new this.#livekit_opt.livekit.AudioSource(opts.sample_rate, opts.channel);
            this.#livekit_opt.livekit_room.localParticipant.publishTrack(
                this.#livekit_opt.livekit.LocalAudioTrack.createAudioTrack('audio', this.#livekit_opt.audioSource),
                new this.#livekit_opt.livekit.TrackPublishOptions({
                    source: this.#livekit_opt.livekit.TrackSource.SOURCE_MICROPHONE
                })
            );
        }

        this.#livekit_opt.interval_loop = setInterval(async () => {
            this.emit("frameReceived", await this.#livekit_opt.audioStream.next())
        }, 0)
        room.on("dataReceived", data => {
            data = JSON.parse(textDecoder.decode(data))
            switch(data.event) {
                case "speechStarted": {
                    this.#livekit_opt.current_candidate_id = data.candidateId
                    this.#livekit_opt.is_char_speaking = true;
                    break;
                }
                case "speechEnded": {
                    this.#livekit_opt.current_candidate_id = null;
                    this.#livekit_opt.is_char_speaking = false;
                    break;
                }
            }
            this.emit("dataReceived", data);
        }).on("disconnected", async () => {
            this.emit("disconnected")
            await this.disconnect()
        })
    }

    /**
     * @typedef {Object} EventPayloads
     * @property {{
     *      callId: string,
     *      candidateId: string,
     *      participantId: string,
     *      event: string,
     *      timestamp: string,
     * }} dataReceived
     * @property {IteratorResult<import("@livekit/rtc-node").AudioFrame, any>} frameReceived
     * @property {{hello: string}} disconnected
    */

    /**
     * Get Character.AI Voices (Livekit) data events.  
     *   
     * - `dataReceived`: Receive Character.AI Livekit data events.  
     * - `frameReceived`: Receive audio stream from Livekit Server.  
     * - `disconnected`: Notify when the Voice is disconnect.
     * 
     * @template {"dataReceived" | "frameReceived" | "disconnected"} T
     * @param {T} event_name
     * @param {(args: EventPayloads[T]) => void} listener
     * @returns {this}
    */
    on(event_name, listener) {
        return super.on(event_name, listener)
    }

    /**
     * Check is Character is speaking or not.
     * @returns {boolean}
    */
    get is_character_speaking() {
        return this.#livekit_opt.is_char_speaking;
    }

    /**
     * this function checking is the PCM buffer frame is silence or not.  
     * if the PCM Buffer is silence, it will return false. if not, it will return true  
     *   
     * Threshold default: 1000  
     *   
     * Credit: https://github.com/ashishbajaj99/mic/blob/master/lib/silenceTransform.js  
     * 
     * @param {Buffer} chunk 
     * @param {number} threshold 
     * @returns {boolean}
    */
    is_speech(chunk, threshold = 1000) {
        let consecutiveSilence = 0, speechSample;
        
        for (let i = 0; i < chunk.length; i += 2) {
            if (chunk[i + 1] > 128) speechSample = (chunk[i + 1] - 256) * 256;
            else speechSample = chunk[i + 1] * 256;
            speechSample += chunk[i];

            if (Math.abs(speechSample) > threshold) return true;
            else consecutiveSilence++;
        }

        if (consecutiveSilence >= chunk.length / 2) return false;
        return true;
    }

    /**
     * Send audio PCM raw data to the Livekit Server.  
     *   
     * Example  
     * ```js
     * let test = await library_name.voice.connect("Sonic the Hedgehog", true);
     * test.input_write(pcm_data);
     * ```
     * @param {Buffer} pcm_data
     * @returns {Promise<void>}
    */
    async input_write(pcm_data) {
        if (this.#livekit_opt.audioSource) {
            pcm_data = new Int16Array(pcm_data.buffer, pcm_data.byteOffset, pcm_data.length / 2);
            await this.#livekit_opt.audioSource.captureFrame(
                new this.#livekit_opt.livekit.AudioFrame(
                    pcm_data,
                    this.#livekit_opt.opts.sample_rate,
                    this.#livekit_opt.opts.channel,
                    pcm_data.length
                )
            )
        }
    }

    /**
     * Interrupt while character talking.  
     *   
     * Example  
     * ```js
     * let test = await library_name.voice.connect("Sonic the Hedgehog", true);
     * await test.interrupt_call()
     * ```
     * @returns {Promise<object>}
    */
    async interrupt_call() {
        if (!this.#livekit_opt.current_candidate_id) return "Character is still not talking."
        const result = await https_fetch("https://neo.character.ai/multimodal/api/v1/sessions/discardCandidate", "POST", {
            "Authorization": `Token ${this.#livekit_opt.cai_token}`,
            "Content-Type": "application/json"
        }, JSON.stringify({
            "roomId": this.#livekit_opt.opts.chat_id,
            "characterId": this.#livekit_opt.opts.char_id,
            "candidateId": this.#livekit_opt.current_candidate_id
        }))
        this.#livekit_opt.current_candidate_id = null;
        return result;
    }

    /**
     * Disconnect from voice character.  
     *   
     * Example  
     * ```js
     * let test = await library_name.voice.connect("Sonic the Hedgehog", true);
     * await test.disconnect()
     * ```
     * @returns {Promise<void>}
    */
    async disconnect() {
        clearInterval(this.#livekit_opt.interval_loop)
        this.#livekit_opt.audioStream.close()
        await this.#livekit_opt.livekit_room.disconnect();
        await this.#livekit_opt.livekit.dispose();

        this.removeAllListeners();
        delete this.#livekit_opt.livekit;
        delete this.#livekit_opt.livekit_room;
        this.#livekit_opt = null
    }
}

class Voice_Class {
    /**
     * @typedef {Object} VoiceInfo
     * @property {string} id
     * @property {string} name
     * @property {string} description
     * @property {string} gender
     * @property {string} visibility
     * @property {Object} creatorInfo
     * @property {string} creatorInfo.id
     * @property {string} creatorInfo.source
     * @property {string} creatorInfo.username
     * @property {string} audioSourceType
     * @property {string} previewText
     * @property {string} previewAudioURI
     * @property {string} backendProvider
     * @property {string} backendId
     * @property {string} internalStatus
     * @property {string} lastUpdateTime
    */

    #prop;
    constructor(prop) {
        this.#prop = prop;
    }

    /**
     * Get list of user created voice information.  
     *   
     * Example
     * - Get your own created voice list: `await library_name.voice.user_list()`
     * - Get user created voice list: `await library_name.voice.user_list("username")`
     * 
     * @param {string | undefined} username
     * @returns {Promise<{ voices: VoiceInfo[] }>}
    */
    user_created_list(username = "") {
        return username ? (async () => {
            return await (await https_fetch(`https://neo.character.ai/multimodal/api/v1/voices/search?creatorInfo.username=${username}`, "GET", {
                "Authorization": `Token ${this.#prop.token}`
            })).json()
        })() : (async () => {
            return await (await https_fetch("https://neo.character.ai/multimodal/api/v1/voices/user", "GET", {
                "Authorization": `Token ${this.#prop.token}`
            })).json()
        })()
    }

    /**
     * Get a voice information.  
     *   
     * Example: `await library_name.voice.info("Voice ID")`
     * 
     * @param {string} voice_id
     * @returns {Promise<{ voice: VoiceInfo }>}
    */
    async info(voice_id) {
        return await (await https_fetch(`https://neo.character.ai/multimodal/api/v1/voices/${voice_id}?useSearch=true`, "GET", {
            "Authorization": `Token ${this.#prop.token}`
        })).json()
    }

    /**
     * Warning: This feature only supports Single character chat, not Group chat.  
     *   
     * Connect to voice character chat, and this function works only for single character chat.  
     *   
     * ---
     * Example function  
     * - Using Query: `await library_name.voice.connect("Query", true)`  
     * - Using Voice ID: `await library_name.voice.connect("Voice ID")`
     * 
     * Example to use  
     * - Without microphone
     *      ```js
     *      const Speaker = require("speaker"); // import Speaker from "speaker"
     *      const speaker = new Speaker({
     *            channels: 1,          // 1 channel
     *            bitDepth: 16,         // 16-bit samples
     *            sampleRate: 48000     // 48,000 Hz sample rate
     *      });
     *      
     *      library_name.character.connect("Character ID");
     *      let test = await library_name.voice.connect("Sonic the Hedgehog", true);
     * 
     *      console.log("Character voice ready!");
     * 
     *      test.on("frameReceived", ev => {
     *           speaker.write(Buffer.from(ev.value.data.buffer)); // PCM buffer write into speaker and you'll hear the sound.
     *      });
     *      library_name.character.generate_turn(); // Test is voice character is working or not.
     *      ```
     *   
     * - With microphone (Voice call)
     *      ```js
     *      const Speaker = require("speaker"); // import Speaker from "speaker"
     *      const { spawn } = require('child_process'); // import { spawn } from "child_process".
     *      //for microphone, I'll using sox. so Ineed child_process
     *      
     *      const speaker = new Speaker({
     *            channels: 1,          // 1 channel
     *            bitDepth: 16,         // 16-bit samples
     *            sampleRate: 48000     // 48,000 Hz sample rate
     *      });
     *      
     *      const recordMic = spawn('sox', [
     *           '-q',
     *           '-t', 'waveaudio', '-d', // Windows Audio Input (change parameter 3 to '-d' if you want set to default Device ID.)
     *           '-r', '48000',           // Sample rate: 48 kHz
     *           '-e', 'signed-integer',  // Encoding: signed PCM
     *           '-b', '16',              // Bit depth: 16-bit
     *           '-c', '1',               // Channel: 1 (mono)
     *           '-t', 'raw',             // Output format: raw PCM
     *           '-'                      // stdout
     *      ]);
     *      
     *      let test = await library_name.voice.connect("Sonic the Hedgehog", true, true);
     * 
     *      console.log("Voice call ready!");
     *  
     *      test.on("frameReceived", ev => {
     *           speaker.write(Buffer.from(ev.value.data.buffer)); // PCM buffer write into speaker and you'll hear the sound.
     *      });
     *      
     *      recordMic.on("data", data => {
     *           if (test.is_speech(data)) test.input_write(data); // Mic PCM Buffer output send it to Livekit server.
     *      });
     *      ```
     *   
     * Or, if you just wanted to get the Livekit information only: 
     * ```js
     * console.log(await library_name.voice.connect("Sonic the Hedgehog", true, false, null, {return_livekit_information_only: true}))
     * ```  
     * ---
     * Livekit variable list (when you're connected to the character voice)  
     * - `is_character_speaking`: Check is Character is speaking or not.  
     *    
     * Livekit function list (when you're connected to the character voice)  
     *   
     * - `on()` event:  
     *   - "dataReceived": Receive Character.AI Livekit data events.  
     *   - "frameReceived": Receive audio stream from Livekit Server.  
     *   - "disconnected": Notify when the Voice is disconnect.  
     * - `input_write()`: Send audio PCM raw data to the Livekit Server.  
     * - `is_speech()`: this function checking is the PCM buffer frame is silence or not.  
     * - `interrupt_call()`: Interrupt while character talking.  
     * - `disconnect()`: Disconnect from voice character.
     * 
     * @param {string} voice_query_or_id
     * @param {boolean} using_voice_query
     * @param {boolean} using_mic
     * @param {{sample_rate: number, channel: number} | undefined} mic_opt
     * @param {{char_id: string, chat_id: string, return_livekit_information_only: boolean} | undefined} manual_opt
     * @returns {Promise<Livekit_Class>}
    */
    async connect(voice_query_or_id, using_voice_query = false, using_mic = false, mic_opt = {"sample_rate": 48000, "channel": 1}, manual_opt = {
        char_id: this.#prop.current_char_id_chat,
        chat_id: this.#prop.current_chat_id,
        return_livekit_information_only: false
    }) {
        if (!this.#prop.token) throw "Please login first."
        if (this.#prop.is_connected_livekit_room[0]) throw "You're already connected to Livekit room!"

        if (typeof mic_opt != "object") {
            mic_opt = {
                sample_rate: 48000,
                channel: 1
            }
        }
        if (typeof mic_opt.sample_rate != "number" || !mic_opt.sample_rate) mic_opt.sample_rate = 48000
        if (typeof mic_opt.channel != "number" || !mic_opt.channel) mic_opt.channel = 1

        if (typeof manual_opt != "object") {
            manual_opt = {
                char_id: this.#prop.current_char_id_chat,
                chat_id: this.#prop.current_chat_id
            }
        }

        if (typeof manual_opt.char_id != "string" || !manual_opt.char_id) {
            if (this.#prop.current_char_id_chat) manual_opt.char_id = this.#prop.current_char_id_chat
            else throw "Character ID cannot be empty! please input Character ID correctly, or connect to the character by using character.connect() function."
        }
        if (typeof manual_opt.chat_id != "string" || !manual_opt.chat_id) {
            if (this.#prop.current_chat_id) manual_opt.chat_id = this.#prop.current_chat_id
            else throw "Chat ID cannot be empty! please input Chat ID correctly, or connect to the character by using character.connect() function."
        }
        if (typeof manual_opt.return_livekit_information_only != "boolean") manual_opt.return_livekit_information_only = false

        return new Promise(async resolve => {
            const livekit = await import("@livekit/rtc-node").catch(_ => {
                throw "This function only works when you're install livekit library. (npm/bun install @livekit/rtc-node)"
            });
            const connect_result = await (await https_fetch("https://neo.character.ai/multimodal/api/v1/sessions/joinOrCreateSession", "POST", {
                "Authorization": `Token ${this.#prop.token}`,
                "Content-Type": "application/json"
            }, JSON.stringify({
                "roomId": this.#prop.current_chat_id,
                ...(using_voice_query ? {
                    "voiceQueries": {
                        [this.#prop.current_char_id_chat]: voice_query_or_id
                    }
                } : {
                    "voices": {
                        [this.#prop.current_char_id_chat]: voice_query_or_id
                    }
                }),
                "enableASR": using_mic,
                "rtcBackend": "lk",
                "userAuthToken": this.#prop.token,
                "username": this.#prop.user_data.user.user.username,
            }))).json()

            if (connect_result.message) {
                if (connect_result.message.includes("error reading voice")) throw "Error: Voice ID not found! Please input a correct Voice ID."
                else throw `Error: ${connect_result.message}`
            }
            if (manual_opt.return_livekit_information_only) resolve(connect_result)
            else {
                const livekit_room = new livekit.Room();

                livekit_room.once("trackSubscribed", track => {
                    if (track.kind == 1) {
                        /**
                         * Livekit variable list (when you're connected to the character voice)
                            * - `is_character_speaking`: Check is Character is speaking or not.  
                            *    
                            * Livekit function list (when you're connected to the character voice)  
                            *   
                            * - `on()` event:  
                            *   - "dataReceived": Receive Character.AI Livekit data events.  
                            *   - "frameReceived": Receive audio stream from Livekit Server.  
                            *   - "disconnected": Notify when the Voice is disconnect.  
                            * - `input_write()`: Send audio PCM raw data to the Livekit Server.  
                            * - `is_speech()`: this function checking is the PCM buffer frame is silence or not.  
                            * - `interrupt_call()`: Interrupt while character talking.  
                            * - `disconnect()`: Disconnect from voice character.
                        */
                        resolve(new Livekit_Class(this.#prop.token, livekit, livekit_room, {
                            sample_rate: mic_opt.sample_rate ? mic_opt.sample_rate : 48000,
                            channel: mic_opt.channel ? mic_opt.channel : 1,
                            char_id: manual_opt.char_id,
                            chat_id: manual_opt.chat_id
                        }, using_mic, track));
                    }
                });
                await livekit_room.connect(connect_result.lkUrl, connect_result.lkToken, {
                    autoSubscribe: true,
                    dynacast: true
                })
            }
        })  
    }
}

class Feed_Class {
    #prop
    constructor(prop) {
        this.#prop = prop;
    }


}

class CAINode extends EventEmitter {
    #prop = new CAINode_prop(); // Property

    /**
     * Search function list  
     *   
     * - `list_tags()`: Get list of tags.  
     * - `users()`: Search users by name.  
     * - `scenes()`: Search scenes by query.  
     * - `characters()`: Search for a characters by name.  
     * - `voices()`: Search for a voices by name.  
     * - `popular()`: Get popular search.  
     * - `trending()`: Get trending search.  
     * - `autocomplete()`: Get autocomplete search.  
    */
    search = new Search_Class(this.#prop) // Search Class

    /**
     * User variables list  
     *   
     * - `info`: contains of your current information account.  
     * - `settings`: contains of your current user settings account.  
     *   
     * User function list  
     *   
     * - `change_info()`: Change current information account.  
     * - `refresh_settings()`: Refresh current user settings.  
     * - `update_settings()`: Update user settings by your own settings.
     * - `public_following_list()`: Get public user following list.  
     * - `public_followers_list()`: Get public user followers list.  
     * - `following_check()`: Check are you following this user account or not.  
     * - `following_list_name()`: Get account following name list.  
     * - `followers_list_name()`: Get account followers name list.  
     * - `follow()`: Follow user account.  
     * - `unfollow()`: Unfollow user account.  
     * - `public_info()`: Get user public information account.  
     * - `public_info_array()`: Get user public information account. same like `public_info()`, but this function have less information.  
     * - `liked_character_list()`: Get account liked character list.  
     * - `add_muted_words()`: Add muted words.
     * - `remove_muted_words()`: Remove muted words.
     * - `clear_muted_words()`: Clear muted words.
    */
    user = new User_Class(this.#prop) // User Class
    
    /**
     * Image function list  
     *   
     * - `generate_avatar()`: Generate avatar image using prompt.  
     * - `generate_image()`: Generate image using prompt.
    */
    image = new Image_Class(this.#prop); // Image Class

    /**
     * Persona function list  
     *   
     * - `create()`: Create your personality for your character.  
     * - `info()`: Get your personality information.  
     * - `set_default()`: Set your default personality specifically.  
     * - `list()`: Get all your personality data.  
     * - `update()`: Update your personality specifically.  
     * - `delete()`: Delete your personality spesifically.  
     * - `set_character()`: Set a custom personality for your character specifically.
    */
    persona = new Persona_Class(this.#prop); // Persona Class

    /**
     * Explore function list  
     *   
     * - `featured()`: Get the list of characters displayed by the Character.AI server.  
     * - `for_you()`: Get a list of characters recommended by the Character.AI server.  
     * - `character_categories()`: Get the list of characters from the character category exploration.  
     * - `featured_voices()`: Get a list of featured voices.  
     * - `simillar_char()`: Get a list of simillar character from ID character.  
     * - `discovery_tags()`: Get a list of discovery tags by the Character.AI server.  
     * - `characters_with_tag()`: Get a list of characters by tags.
    */
    explore = new Explore_Class(this.#prop); // Explore Class

    /**
     * Character function list  
     *   
     * - `votes()`: Get character vote information.  
     * - `votes_array()`: Get character vote information in array.  
     * - `vote()`: Used for vote the character.  
     * - `info()`: Get detailed information about characters.  
     * - `tags_info()`: et tags info by Character ID. (i guess?)  
     * - `recent_list()`: Get a list of recent chat activity.  
     * - `connect()`: Connect client to character chat.  
     * - `disconnect()`: Disconnecting client from character chat.  
     * - `send_message()`: Send message to character.  
     * - `generate_turn()`: Generating message response from character.  
     * - `generate_turn_candidate()`: Regenerate character message.  
     * - `create_new_conversation()`: it will create a new conversation and your current conversation will save on the history.  
     * - `delete_message()`: Delete character message.  
     * - `edit_message()`: Edit the character message.  
     * - `replay_tts()`: Generate text messages from character to voice audio.  
     * - `current_voice()`: Get character current voice info.  
     * - `get_category()`: Get category used of the character.  
     * - `about()`: Get detailed information of the character about.  
     * - `info_detailed()`: Get detailed of the character. but, it will give you a FULL detailed of the Character, including character definition.
    */
    character = new Character_Class(this.#prop); // Character Class

    /**
     * Group chat function list  
     *   
     * - `list()`: Get all list available group chat in account.  
     * - `connect()`: Connecting to group chat by the Room ID.  
     * - `disconnect()`: Disconnecting from group chat by the Room ID.  
     * - `create()`: Create group chat.  
     * - `delete()`: Delete group chat.  
     * - `rename()`: Rename group chat.  
     * - `join_group_invite()`: Joining group chat using invite code.  
     * - `char_add()`: Add a character with Character ID to the group chat.  
     * - `char_remove()`: Remove a character with character_id from the group chat.  
     * - `send_message()`: Send message to group chat.  
     * - `generate_turn()`: Generating message response character from group chat.  
     * - `generate_turn_candidate()`: Regenerate character message.  
     * - `reset_conversation()`: Reset conversation in group chat.  
     * - `delete_message()`: Delete user/character message.  
     * - `edit_message()`: Edit user/character message.  
     * - `select_turn()`: Select the turn of character chat by yourself.
    */
    group_chat = new GroupChat_Class(this.#prop); // Group Chat Class

    /**
     * Chat function list  
     *   
     * - `history_chat_turns()`: Get a history chat from Group or Single chat.  
     * - `conversation_info()`: Get conversation info.  
     * - `history_conversation_list()`: Get list of your history conversation, and this function is for Single character only.  
     * - `set_conversation_chat()`: Set conversation chat, and bring the history chat into current chat.  
     * - `pin_message()`: Pin message, and this function works only for Single character chat.  
     * - `list_pinned_message()`: Get list pinned message from chat, and this function works only for Single character chat.  
     * - `archive_conversation()`: Archive your conversation, and this function works only for Single character chat.  
     * - `duplicate_conversation()`: Duplicate your conversation, and this function works only for Single character chat.  
     * - `rename_conversation()`: Rename your conversation, and this function works only for Single character chat.
    */
    chat = new Chat_Class(this.#prop) // Chat Class

    /**
     * Notification function list  
     *   
     * - `history()`: Get all of the history notification.
     */
    notification = new Notification_Class(this.#prop) // Notification Class

    /**
     * Voice function list  
     *   
     * - `user_list()`: Get your own voice creation list information.  
     * - `info()`: Get voice information.  
     * - `connect()`: Connect to voice character chat.  
     *   
     * Livekit variable list (when you're connected to the character voice)
     * - `is_character_speaking`: Check is Character is speaking or not.  
     *    
     * Livekit function list (when you're connected to the character voice)  
     *   
     * - `on()` event:  
     *   - "dataReceived": Receive Character.AI Livekit data events.  
     *   - "frameReceived": Receive audio stream from Livekit Server.  
     *   - "disconnected": Notify when the Voice is disconnect.  
     * - `input_write()`: Send audio PCM raw data to the Livekit Server.  
     * - `is_speech()`: this function checking is the PCM buffer frame is silence or not.  
     * - `interrupt_call()`: Interrupt while character talking.  
     * - `disconnect()`: Disconnect from voice character.
    */
    voice = new Voice_Class(this.#prop); // Voice Class

    /**
     * Get Character.AI message events.
     * 
     * @template {"data"} T
     * @param {T} event_name
     * @param {(args: string) => void} listener
     * @returns {this}
    */
    on(event_name, listener) {
        return super.on(event_name, listener)
    }

    /**
     * Start client initialization with login.  
     *   
     * Example: `await library_name.login("Character.AI Token")`
     *   
     * @see {@link https://github.com/KevinAdhaikal/CAINode?tab=readme-ov-file#login|here} for tutorial how to get Character.AI Token.
     * @param {string} token
     * @returns {Promise<boolean>}
    */
    async login(token) {
        this.#prop.edge_rollout = (await https_fetch("https://character.ai/", "GET")).headers.get("set-cookie").match(/edge_rollout=(\d+)/)
        if (this.#prop.edge_rollout !== null) this.#prop.edge_rollout = this.#prop.edge_rollout[1];
        this.#prop.user_data = await (await https_fetch("https://plus.character.ai/chat/user/", "GET", {
            'Authorization': `Token ${token}`
        })).text()

        if (this.#prop.user_data === "Unauthorized") throw "Not a valid Character.AI Token."
        this.#prop.user_data = JSON.parse(this.#prop.user_data)
        if (!this.#prop.user_data.user) throw "Not a valid Character.AI Token."

        this.#prop.ws = [
            await open_ws("wss://neo.character.ai/connection/websocket", `${this.#prop.edge_rollout !== null ? `edge_rollout=${this.#prop.edge_rollout}; ` : ""}HTTP_AUTHORIZATION="Token ${token}"`, this.#prop.user_data.user.user.id, this),
            await open_ws("wss://neo.character.ai/ws/", `${this.#prop.edge_rollout !== null ? `edge_rollout=${this.#prop.edge_rollout}; ` : ""}HTTP_AUTHORIZATION="Token ${token}"`, 0, this)
        ]
        this.#prop.token = token
        
        await this.user.refresh_settings();
        return true;
    }

    /**
     * Send Character.AI Verify code to the email.  
     * 
     * @param {string} email
    */
    async send_code(email) {
        await https_fetch("https://character.ai/api/trpc/auth.login?batch=1", "POST", {
            "Content-Type": "application/json"
        }, JSON.stringify({"0":{"json":{"email":email}}}))
    }

    /**
     * Generate your Character.AI Token by email. and you will get the token by just pressing the button when you receive the email.  
     *   
     * Parameter 2: Timeout per 2 seconds (default 30, so it means = 60 seconds or 1 minute)  
     * You can disable the Timeout by set the parameter into 0.  
     *   
     * Parameter Info  
     * - 1st parameter `email`: Target email you want to generate the token.
     * Example  
     * - Without Timer: `console.log(await library_name.generate_token_auto("your@email.com", 0))`  
     * - With Timer: `console.log(await library_name.generate_token_auto("your@email.com", 60))`
     * - With callback: `console.log(await library_name.generate_token_auto("your@email.com", 30, function() {console.log("Please check your email")}, function() {console.log("timeout!")}))`
     * 
     * @param {string} email
     * @param {number | undefined} timeout_per_2s
     * @param {Function | undefined} mail_sent_cb
     * @param {Function | undefined} timeout_cb
     * @returns {Promise<string>}
    */
    generate_token_auto(email, timeout_per_2s = 30, mail_sent_cb = null, timeout_cb = null) {
        let current_timer = 1;
        return new Promise(async resolve => {
            let res;
            const polling_uuid = (await (await https_fetch("https://character.ai/api/trpc/auth.login?batch=1", "POST", {
                "Content-Type": "application/json"
            }, JSON.stringify({"0":{"json":{"email":email}}}))).json())[0].result.data.json
            if (!polling_uuid) throw "Please input the correct email."
            if (!mail_sent_cb) console.log("Please check your email.");
            else mail_sent_cb();
            while(1) {
                await wait(1000)
                try {
                    res = await (await https_fetch(`https://character.ai/login/polling/?uuid=${polling_uuid}`, "GET")).json()
                } catch(_) {_}
                if (res && res.result === "done") {
                    res = (await (await https_fetch("https://identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink?key=AIzaSyAbLy_s6hJqVNr2ZN0UHHiCbJX1X8smTws", "POST", {
                        "Content-Type": "application/json"
                    }, JSON.stringify({"email": email,"oobCode": res.value.slice(res.value.indexOf("?") + 1).split("&")[1].split("=")[1]}))).json()).idToken
                    res = (await (await https_fetch("https://plus.character.ai/dj-rest-auth/google_idp/", "POST", {
                        "Content-Type": "application/json"
                    }, JSON.stringify({"id_token":res}))).json()).key
                    break;
                }

                if (!timeout_per_2s) continue;
                if (current_timer >= timeout_per_2s) {
                    if (!timeout_cb) throw "Timeout.";
                    else resolve(timeout_cb());
                    break;
                }
                else current_timer++;
            }
            resolve(res);
        })
    }
    
    /**
     * Generate your Character.AI Token putting the Character.AI verify link.  
     * @param {string} verify_link
     */
    async generate_token_manual(verify_link) {
        if (typeof verify_link != "string") throw "Please input the correct verify link."

        let auth_parser = (await (await https_fetch(verify_link)).text()).match(/https:\/\/auth\.character\.ai\/__\/auth\/action\?[^"]+/g)
        if (auth_parser == null) throw "Character.AI Verify code link is invalid or expired!"
        else auth_parser = auth_parser[0].split('\\u0026');

        const oob_code = auth_parser[1].slice(8)
        const email = auth_parser[3].slice(auth_parser[3].indexOf("email%3D") + 8, auth_parser[3].indexOf("%26isApp%3Dtrue%26continue%3D%252F")).replaceAll("%252540", "@")

        let res = (await (await https_fetch("https://identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink?key=AIzaSyAbLy_s6hJqVNr2ZN0UHHiCbJX1X8smTws", "POST", {
            "Content-Type": "application/json"
        }, JSON.stringify({"email": email,"oobCode": oob_code}))).json()).idToken
        res = (await (await https_fetch("https://plus.character.ai/dj-rest-auth/google_idp/", "POST", {
            "Content-Type": "application/json"
        }, JSON.stringify({"id_token":res}))).json()).key

        return res;
    }
    
    /**
     * Pings the Character AI server's health check endpoint.  
     * 
     * @returns {Promise<{"status": string}>}
    */
    async ping() {
        return await (await https_fetch("https://neo.character.ai/ping/", "GET")).json();
    }

    /**
     * Logout from the Character.AI.  
     *   
     * Example: `library_name.logout()`
     * 
     * @returns {Promise<boolean>}
    */
    async logout() {
        if (!this.#prop.ws[0] && !this.#prop.ws[1]) return false;
        
        if (this.#prop.join_type == 1) await this.character.disconnect();
        else if (this.#prop.join_type == 2) await this.group_chat.disconnect();

        await (await https_fetch("https://plus.character.ai/chat/user/logout/", "POST", {
            "Authorization": `Token ${this.#prop.token}`,
            "Content-Type": "application/json"
        }, "{}")).json()

        await this.#prop.ws[0].close()
        await this.#prop.ws[1].close()
        this.#prop.ws = []
        this.#prop.token = ""
        this.#prop.user_data = {}

        this.removeAllListeners()
        return true;
    }
}

export { CAINode }