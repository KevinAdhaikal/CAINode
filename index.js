import WebSocket from "ws";
import EventEmitter from "node:events";
const livekit = await import("@livekit/rtc-node").catch(_ => {_})

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
            if (message === "{}") ws_con.send("{}")
            else this_class.emit("message", message)
        });
    });
}

function send_ws(ws_con, data, using_json, wait_json_prop_type, wait_ai_response, append_array = false) {
    return new Promise(resolve => {
        const temp_res = []
        ws_con.on("message", function incoming(message) {
            message = using_json ? JSON.parse(message.toString()) : message.toString()
            if (using_json && wait_json_prop_type) {
                try {
                    if (wait_ai_response) {
                        switch(wait_json_prop_type) {
                            case 1: { // single character chat
                                if (!message.turn.author.is_human && message.turn.candidates[0].is_final) {
                                    ws_con.removeListener("message", incoming);
                                    resolve(message)
                                }
                                break;
                            }
                            case 2: { // group chat
                                if (!message["push"].pub.data.turn.author.is_human && message["push"].pub.data.turn.candidates[0].is_final) {
                                    ws_con.removeListener("message", incoming);
                                    resolve(message)
                                }
                                break;
                            }
                        }
                    } else {
                        switch(wait_json_prop_type) {
                            case 1: { // single character chat
                                if (message.turn.candidates[0].is_final) {
                                    ws_con.removeListener("message", incoming);
                                    if (append_array) resolve(temp_res.concat(message));
                                    else resolve(message);
                                }
                                break;
                            }
                            case 2: { // group chat
                                if (message["push"].pub.data.turn.candidates[0].is_final) {
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
                ws_con.removeListener("message", incoming);
                resolve(message)
            }
        })
        ws_con.send(data)
    })
}

class CAINode_prop {
    ws = [];
    token = "";
    user_data = {};
    current_chat_id = "";
    current_char_id_chat = "";
    edge_rollout = "";
    join_type = 0;
    livekit_room = "";
    is_connected_livekit_room = 0;
}

/**
 * @typedef {object} StatusInfo
 * @property {string} status
 * @property {string} comment
*/

// User Class
class User_Class {
    /**
     * @typedef {object} UserInfo
     * @property {object} user
     * @property {object} user.user
     * @property {string} user.user.username
     * @property {number} user.user.id
     * @property {string} user.user.first_name
     * @property {object} user.user.account
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
     * @property {object} user.interests
     * @property {string[]} user.interests.selected
    */

    /**
     * @typedef {object} UserSettings
     * @property {string | undefined} default_persona_id
     * @property {Record<string, string> | undefined} voiceOverrides
     * @property {Record<string, string> | undefined} personaOverrides
    */

    /**
     * @typedef {object} UserPublicInfo
     * @property {object} public_user
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
     * @typedef {object} UserPublicFollowInfo
     * @property {object} users
     * @property {string} users[].username
     * @property {string} users[].account__avatar_file_name
     * @property {string} users[].account__bio
     * @property {boolean} has_next_page
    */

    /**
     * @typedef {object} UserLikedCharacter
     * @property {object[]} characters
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

    #prop;
    constructor(prop) {
        this.#prop = prop
    }

    /**
     * Get current information account.  
     *   
     * Example: `library_name.user.info`
     * 
     * @returns {UserInfo}
    */
    get info() {
        return !this.#prop.token ? (() => {throw "Please login first."})() : this.#prop.user_data
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
     * Get current settings information account.  
     *   
     * Example: `await library_name.user.settings()`
     * 
     * @returns {Promise<UserSettings>}
    */
    async settings() {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch("https://plus.character.ai/chat/user/settings/", "GET", {"Authorization": `Token ${this.#prop.token}`})).json()
    }
    
    /**
     * Get public user following list.  
     *   
     * Example  
     * - Get someone public user following list: `await library_name.user.public_following_list("Username", page_param)`  
     * - Get your own user following list: `await library_name.user.public_following_list(undefined, page_param)`
     * 
     * @param {string} username
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
     * Get public user followers list.  
     *   
     * Example  
     * - Get someone public user followers list: `await library_name.user.public_followers_list("Username", page_param)`  
     * - Get your own user followers list: `await library_name.user.public_followers_list(undefined, page_param)`
     * 
     * @param {string} username
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
     * @typedef {object} Persona
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
     * @property {string | undefined} starter_prompts
     * @property {boolean} comments_enabled
     * @property {string[]} categories
     * @property {string} user__username
     * @property {string} participant__name
     * @property {string} participant__user__username
     * @property {number} num_interactions
     * @property {string} voice_id
    */

    /**
     * @typedef {object} PersonaList
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
     * @param {string | null} external_persona_id
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
     * @param {string | null} external_persona_id
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
     * @typedef {object} ExploreCharacter
     * @property {object[]} characters
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
     * @property {object} characters[].translations
     * @property {object} characters[].translations.name
     * @property {string} characters[].translations.name.ko
     * @property {string} characters[].translations.name.ru
     * @property {string} characters[].translations.name.ja_JP
     * @property {string} characters[].translations.name.zh_CN
     * @property {object} characters[].translations.title
     * @property {string} characters[].translations.title.es
     * @property {string} characters[].translations.title.ko
     * @property {string} characters[].translations.title.ru
     * @property {string} characters[].translations.title.ja_JP
     * @property {string} characters[].translations.title.pt_BR
     * @property {string} characters[].translations.title.zh_CN
     * @property {object} characters[].translations.greeting
     * @property {string} characters[].translations.greeting.es
     * @property {string} characters[].translations.greeting.ko
     * @property {string} characters[].translations.greeting.ru
     * @property {string} characters[].translations.greeting.ja_JP
     * @property {string} characters[].translations.greeting.pt_BR
     * @property {string} characters[].translations.greeting.zh_CN
     * @property {string | undefined} characters[].default_voice_id
    */

    /**
     * @typedef {object} CharacterCategoriesInformation
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

    #prop;
    constructor(prop) {
        this.#prop = prop;
    }

    /**
     * Get the list of characters displayed by the Character.AI server.  
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
     * Get the list of characters from the character category exploration.  
     *   
     * Example: `await library_name.explore.character_categories()`
     * 
     * @returns {Promise<CharacterCategories>}
    */
    async character_categories() {
        return (await (await https_fetch("https://plus.character.ai/chat/curated_categories/characters/", "GET")).json()).characters_by_curated_category
    }
}

class Character_Class {
    /**
     * @typedef {object} CharactersSearchInfo
     * @property {object[]} characters
     * @property {string} characters[].document_id
     * @property {string} characters[].external_id
     * @property {string} characters[].title
     * @property {string} characters[].greeting
     * @property {string} characters[].avatar_file_name
     * @property {string} characters[].visibility
     * @property {string} characters[].participant__name
     * @property {number} characters[].participant__num_interactions
     * @property {string} characters[].user__username
     * @property {number} characters[].priority
     * @property {number} characters[].search_score
     * @property {string} request_id
    */

    /**
     * @typedef {object} CharactersSearchSuggestInfo
     * @property {object[]} characters
     * @property {string} characters[].document_id
     * @property {string} characters[].external_id
     * @property {string} characters[].name
     * @property {string} characters[].avatar_file_name
     * @property {string} characters[].num_interactions
     * @property {string} characters[].title
     * @property {string} characters[].greeting
    */

    /**
     * @typedef {object} CharacterInformation
     * @property {object} character
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
     * @typedef {object} CharacterRecentList
     * @property {object[]} chats
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
     * @property {object} chats.character_translations
     * @property {string | undefined} chats.default_voice_id
    */

    /**
     * @typedef {object} SingleCharacterChatInfo
     * @property {object} turn
     * @property {object} turn.turn_key
     * @property {string} turn.turn_key.chat_id
     * @property {string} turn.turn_key.turn_id
     * @property {string} turn.create_time
     * @property {string} turn.last_update_time
     * @property {string} turn.state
     * @property {object} turn.author
     * @property {string} turn.author.author_id
     * @property {string} turn.author.name
     * @property {boolean} turn.author.is_human
     * @property {object[]} turn.candidates
     * @property {string} turn.candidates[].candidate_id
     * @property {string} turn.candidates[].create_time
     * @property {string} turn.candidates[].raw_content
     * @property {string} turn.candidates[].tti_image_rel_path
     * @property {object} turn.candidates[].editor
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
     * - Cancel: `await library_name.character.vote("Character ID", null)` or `library_name.character.vote("Character ID")`
     * 
     * @param {string} character_id
     * @param {boolean | null | undefined} vote
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
     * Search for a character by name.  
     *   
     * Example: `await library_name.character.search("Name")`
     * 
     * @param {string} name
     * @returns {Promise<CharactersSearchInfo>}
    */
    async search(name) {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch(`https://plus.character.ai/chat/characters/search/?query=${name}`, "GET", {
            'Authorization': `Token ${this.#prop.token}`
        })).json()
    }

    /**
     * Search character by name and suggested by Character.AI Server.  
     *   
     * Example: `await library_name.character.search_suggest("Query")`
     * 
     * @param {string} name
     * @returns {Promise<CharactersSearchSuggestInfo>}
    */
    async search_suggest(name) {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch(`https://plus.character.ai/chat/characters/suggest/?query=${name}`, "GET", {
            'Authorization': `Token ${this.#prop.token}`
        })).json()
    }

    /**
     * Get detailed information about characters.  
     *   
     * Example: `await library_name.character.info("Character External ID")`
     * 
     * @param {string} char_extern_id
     * @returns {Promise<CharacterInformation>}
    */
    async info(char_extern_id) {
        if (!this.#prop.token) throw "Please login first."
        return await (await https_fetch("https://plus.character.ai/chat/character/info/", "POST", {
            'Authorization': `Token ${this.#prop.token}`,
            "Content-Type": "application/json"
        }, JSON.stringify({
            "external_id": char_extern_id
        }))).json()
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
     * Example: `await library_name.character.connect("Character ID")`
     * 
     * @param {string} char_id 
     * @returns {Promise<CharacterRecentList>}
    */
    async connect(char_id) {
        if (!this.#prop.token) throw "Please login first."
        if (this.#prop.join_type == 2) throw "You're already connectetd in Group Chat, please disconnect first"

        const res = await (await https_fetch(`https://neo.character.ai/chats/recent/${char_id}`, "GET", {
            'Authorization': `Token ${this.#prop.token}`
        })).json()
        await https_fetch(`https://neo.character.ai/chat/${res.chats[0].chat_id}/resurrect`, "GET", {
            'Authorization': `Token ${this.#prop.token}`
        });

        this.#prop.join_type = 1;
        this.#prop.current_char_id_chat = char_id
        this.#prop.current_chat_id = res.chats[0].chat_id

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

        if (this.#prop.is_connected_livekit_room) {
            await this.#prop.livekit_room.disconnect()
            await livekit.dispose()
        }

        return true;
    }

    /**
     * Send message to character.  
     *   
     * Example (Default)  
     * - Without manual turn: `await library_name.character.send_message("Your Message")`  
     * - With manual turn: `await library_name.character.send_message("Your Message", true)`  
     *   
     * Example (With image URL)  
     * - Without manual turn: `await library_name.character.send_message("Your Message", false, "URL Link")`  
     * - With manual turn: `await library_name.character.send_message("Your Message", true, "URL Link")`
     * 
     * @param {string | undefined} message
     * @param {boolean} manual_turn
     * @param {string | undefined} image_url_path
     * @returns {Promise<SingleCharacterChatInfo>}
    */
    async send_message(message, manual_turn = false, image_url_path = "") {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.join_type || this.#prop.join_type != 1) throw "This function only works when you're connected on Single Character Chat."

        const turn_key = this.#prop.join_type ? generateRandomUUID() : ""

        return await send_ws(this.#prop.ws[1], JSON.stringify({
            "command": manual_turn ? "create_turn" : "create_and_generate_turn",
            "request_id": generateRandomUUID().slice(0, -12) + this.#prop.current_char_id_chat.slice(this.#prop.current_char_id_chat.length - 12),
            "payload": {
                "num_candidates": 1,
                "tts_enabled": this.#prop.is_connected_livekit_room ? true : false,
                "selected_language": "",
                "character_id": this.#prop.current_char_id_chat,
                "user_name": this.#prop.user_data.user.user.username,
                "turn": {
                    "turn_key": {
                        "turn_id": turn_key,
                        "chat_id": this.#prop.current_chat_id
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
        }), true, Number(!manual_turn), !manual_turn)
    }

    /**
     * Generating message response from character.  
     *   
     * Example: `await library_name.character.generate_turn()`
     * 
     * @returns {Promise<SingleCharacterChatInfo>}
    */
    async generate_turn() {
        return await this.send_message()
    }

    /**
     * Regenerate character message.  
     *   
     * Example: `await library_name.character.generate_turn_candidate("Turn ID")`
     * 
     * @param {string} turn_id
     * @returns {Promise<SingleCharacterChatInfo>}
    */
    async generate_turn_candidate(turn_id) {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.join_type || this.#prop.join_type != 1) throw "This function only works when you're connected on Single Character Chat."
        
        return await send_ws(this.#prop.ws[1], JSON.stringify({
            "command": "generate_turn_candidate",
            "request_id": generateRandomUUID().slice(0, -12) + this.#prop.current_char_id_chat.slice(this.#prop.current_char_id_chat.length - 12),
            "payload": {
                "tts_enabled": this.#prop.is_connected_livekit_room ? true : false,
                "selected_language": "",
                "character_id": this.#prop.current_char_id_chat,
                "user_name": this.#prop.user_data.user.user.username,
                "turn_key": {
                    "turn_id": turn_id,
                    "chat_id": this.#prop.current_chat_id
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
     * archive your current conversation between you and the character.  
     * it will create a new conversation and your current conversation will save on the history.  
     *   
     * Example  
     * - With greeting: `await library_name.character.archive_conversation()`  
     * - Without greeting: `await library_name.character.archive_conversation(false)`
     * 
     * @param {boolean} with_greeting
     * @returns {Promise<SingleCharacterChatInfo>}
    */
    async archive_conversation(with_greeting = true) {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.join_type || this.#prop.join_type != 1) throw "This function only works when you're connected on Single Character Chat."
        
        const result = await send_ws(this.#prop.ws[1], JSON.stringify({
            "command": "create_chat",
            "request_id": generateRandomUUID().slice(0, -12) + this.#prop.current_char_id_chat.slice(this.#prop.current_char_id_chat.length - 12),
            "payload": {
                "chat": {
                    "chat_id": generateRandomUUID(),
                    "creator_id": `${this.#prop.user_data.user.user.id}`,
                    "visibility": "VISIBILITY_PRIVATE",
                    "character_id": this.#prop.current_char_id_chat,
                    "type": "TYPE_ONE_ON_ONE"
                },
                "with_greeting": with_greeting
            },
            "origin_id": "Android"
        }), true, 1, false, true)

        this.#prop.current_chat_id = result[0].chat.chat_id
        return result[1]
    }

    /**
     * Delete character message.  
     *   
     * Example: `await library_name.character.delete_message("Turn ID")`
     * 
     * @param {string} turn_id
     * @returns {Promise<boolean>}
    */
    async delete_message(turn_id) {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.join_type || this.#prop.join_type != 1) throw "This function only works when you're connected on Single Character Chat."
        
        await send_ws(this.#prop.ws[1], JSON.stringify({
            "command": "remove_turns",
            "request_id": generateRandomUUID().slice(0, -12) + this.#prop.current_char_id_chat.slice(this.#prop.current_char_id_chat.length - 12),
            "payload": {
                "chat_id": this.#prop.current_chat_id,
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
     * @returns {Promise<SingleCharacterChatInfo>}
    */
    async edit_message(candidate_id, turn_id, new_message) {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.join_type || this.#prop.join_type != 1) throw "This function only works when you're connected on Single Character Chat."
        
        const result = await send_ws(this.#prop.ws[1], JSON.stringify({
            "command": "edit_turn_candidate",
            "request_id": generateRandomUUID().slice(0, -12) + this.#prop.current_char_id_chat.slice(this.#prop.current_char_id_chat.length - 12),
            "payload": {
                "turn_key": {
                    "chat_id": this.#prop.current_chat_id,
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
                        "chat_id": this.#prop.current_chat_id,
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
     * Example (if you have Voice ID): `await library_name.character.replay_tts("Turn ID", "Candidate ID", "fill the Voice Character ID here")`  
     * Example (if you don't have Voice ID and want to use Voice Query instead): `await library_name.character.replay_tts("Turn ID", "Candidate ID", "", "fill Voice Character Query here")`
     * 
     * @param {string} candidate_id
     * @param {string} turn_id
     * @param {string} voice_id
     * @param {string} voice_query
     * 
     * @returns {Promise<{replayUrl: string}>}
    */
    async replay_tts(turn_id, candidate_id, voice_id = "", voice_query = "") {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.join_type || this.#prop.join_type != 1) throw "This function only works when you're connected on Single Character Chat."
        if (!turn_id && !candidate_id) throw "Please fill Turn ID and Candidate ID."
        if (!voice_id || !voice_query) throw "Please fill Voice query or Voice ID."

        return await (await https_fetch("https://neo.character.ai/multimodal/api/v1/memo/replay", "GET", {
            "Authorization": `Token ${this.#prop.token}`,
            "Content-Type": "application/json"
        }, JSON.stringify({
            "roomId": this.#prop.current_chat_id,
            "turnId": turn_id,
            "candidateId": candidate_id,
            "voiceId": voice_id,
            "voiceQuery": voice_query
        }))).json()
    }

    /**
     * Get character current voice info.  
     *   
     * Example:  
     * - Auto (you must already connected with character): `library_name.character.current_voice()`  
     * - Manual: `library_name.character.current_voice("Character ID")`
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
}

class GroupChat_Class {
    /**
     * @typedef {object} GroupChatListInfo
     * @property {object[]} rooms
     * @property {string} rooms[].id
     * @property {string} rooms[].title
     * @property {string} rooms[].description
     * @property {string} rooms[].visibility
     * @property {string} rooms[].picture
     * @property {object[]} rooms[].characters
     * @property {string} rooms[].characters[].id
     * @property {string} rooms[].characters[].name
     * @property {string} rooms[].characters[].url
     * @property {object[]} rooms[].users
     * @property {string} rooms[].users[].id
     * @property {string} rooms[].users[].username
     * @property {string} rooms[].users[].avatar_url
     * @property {string} rooms[].users[].role
     * @property {string} rooms[].users[].state
     * @property {[]} rooms[].permissions
     * @property {object} rooms[].preview_turns
     * @property {[]} rooms[].preview_turns.turns
     * @property {object} rooms[].preview_turns.meta
     * @property {string} rooms[].preview_turns.meta.next_token
     * @property {object} rooms[].settings
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
     * @typedef {object} GroupChatConnectInfo
     * @property {number} id
     * @property {string} error
     * @property {object} subscribe
     * @property {boolean} subscribe.recoverable
     * @property {string} subscribe.epoch
     * @property {boolean} subscribe.positioned
    */

    /**
     * @typedef {object} GroupChatDisconnectInfo
     * @property {number} id
     * @property {object} subscribe
    */

    /**
     * @typedef {object} GroupChatCreateInfo
     * @property {string} id
     * @property {string} title
     * @property {string} description
     * @property {string} visibility
     * @property {string} picture
     * @property {number} last_updated
     * @property {object[]} characters
     * @property {string} characters[].id
     * @property {string} characters[].name
     * @property {string} characters[].avatar_url
     * @property {object[]} users
     * @property {string} users[].id
     * @property {string} users[].username
     * @property {string} users[].name
     * @property {string} users[].avatar_url
     * @property {string} users[].role
     * @property {string} users[].state
     * @property {[]} permissions
     * @property {object[]} preview_turns
     * @property {object} preview_turns[].turns
     * @property {object} preview_turns[].turns.turn_key
     * @property {string} preview_turns[].turns.turn_key.chat_id
     * @property {string} preview_turns[].turns.turn_key.turn_id
     * @property {string} preview_turns[].turns.create_time
     * @property {string} preview_turns[].turns.last_update_time
     * @property {string} preview_turns[].turns.state
     * @property {object} preview_turns[].turns.author
     * @property {string} preview_turns[].turns.author.author_id
     * @property {string} preview_turns[].turns.author.name
     * @property {object[]} preview_turns[].turns.candidates
     * @property {string} preview_turns[].turns.candidates[].candidate_id
     * @property {string} preview_turns[].turns.candidates[].create_time
     * @property {string} preview_turns[].turns.candidates[].raw_content
     * @property {object} preview_turns[].turns.candidates[].editor
     * @property {string} preview_turns[].turns.candidates[].editor.author_id
     * @property {string} preview_turns[].turns.candidates[].editor.name
     * @property {boolean} preview_turns[].turns.candidates[].is_final
     * @property {string} preview_turns[].turns.primary_candidate_id
     * @property {string} preview_turns[].turns.primary_candidate_id
     * @property {object} preview_turns[].meta
     * @property {string} preview_turns[].meta.next_token
     * @property {object} settings
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
     * @typedef {object} GroupChatDeleteInfo
     * @property {string} id
     * @property {string} command
    */

    /**
     * @typedef {object} GroupChatActivityInfo
     * @property {string} id
     * @property {object} users
     * @property {[]} users.added
     * @property {[]} users.removed
     * @property {object} characters
     * @property {[]} characters.removed
     * @property {[]} characters.removed
     * @property {string} title
     * @property {string} command
    */

    /**
     * @typedef {object} GroupChatInfo
     * @property {object} push
     * @property {string} push.channel
     * @property {object} push.pub
     * @property {object} push.pub.data
     * @property {object} push.pub.data.turn
     * @property {object} push.pub.data.turn.turn_key
     * @property {string} push.pub.data.turn.turn_key.chat_id
     * @property {string} push.pub.data.turn.turn_key.turn_key
     * @property {string} push.pub.data.turn.create_time
     * @property {string} push.pub.data.turn.last_update_time
     * @property {string} push.pub.data.turn.state
     * @property {object} push.pub.data.turn.author
     * @property {string} push.pub.data.turn.author.author_id
     * @property {string} push.pub.data.turn.author.is_human
     * @property {string} push.pub.data.turn.author.name
     * @property {object[]} push.pub.data.turn.candidates
     * @property {string} push.pub.data.turn.candidates[].candidate_id
     * @property {string} push.pub.data.turn.candidates[].create_time
     * @property {string} push.pub.data.turn.candidates[].raw_content
     * @property {string} push.pub.data.turn.candidates[].tti_image_rel_path
     * @property {string} push.pub.data.turn.candidates[].base_candidate_id
     * @property {object} push.pub.data.turn.candidates[].editor
     * @property {string} push.pub.data.turn.candidates[].editor.author_id
     * @property {boolean} push.pub.data.turn.candidates[].is_final
     * @property {string} push.pub.data.turn.primary_candidate_id
     * @property {object} push.pub.data.chat_info
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
     * Example: `await library_name.group_chat.rename("New Name", "Room ID")`
     * 
     * @param {string} new_name
     * @param {string} room_id
     * @returns {Promise<GroupChatActivityInfo>}
    */
    async rename(new_name, room_id) {
        if (!this.#prop.token) throw "Pleae login first"
        return await (await https_fetch(`https://neo.character.ai/muroom/${this.#prop.join_type == 2 ? this.#prop.current_chat_id : room_id}/`, "PATCH", {'Authorization': `Token ${this.#prop.token}`}, JSON.stringify([
            {
                "op": "replace",
                "path": `/muroom/${this.#prop.join_type == 2 ? this.#prop.current_chat_id : room_id}`,
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
     * Example: `await library_name.group_chat.char_add("Character ID")`
     * 
     * @param {string} char_id
     * @returns {Promise<GroupChatActivityInfo>}
    */
    async char_add(char_id) {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.join_type || this.#prop.join_type != 2) throw "This function only works when you're connected on Group Chat."

        if (Array.isArray(char_id)) {
            return await (await https_fetch(`https://neo.character.ai/muroom/${this.#prop.current_chat_id}/`, "PATCH", {
                'Authorization': `Token ${this.#prop.token}`
            }, JSON.stringify(char_id.map(id => {
                return {
                    "op": "add",
                    "path": `/muroom/${this.#prop.current_chat_id}/characters`,
                    "value": {
                        "id": id
                    }
                };
            })))).json()
        } else {
            return await (await https_fetch(`https://neo.character.ai/muroom/${this.#prop.current_chat_id}/`, "PATCH", {
                'Authorization': `Token ${this.#prop.token}`
            }, JSON.stringify([{
                "op": "add",
                "path": `/muroom/${this.#prop.current_chat_id}/characters`,
                "value": {
                    "id": char_id
                }
            }]))).json()
        }
    }

    /**
     * Remove a character with Character ID from the group chat.  
     *   
     * Example: `await library_name.group_chat.char_remove("Character ID")`
     * 
     * @param {string} char_id
     * @returns {Promise<GroupChatActivityInfo>}
    */
    async char_remove(char_id) {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.join_type || this.#prop.join_type != 2) throw "This function only works when you're connected on Group Chat."

        if (Array.isArray(char_id)) {
            return await (await https_fetch(`https://neo.character.ai/muroom/${this.#prop.current_chat_id}/`, "PATCH", {
                'Authorization': `Token ${this.#prop.token}`
            }, JSON.stringify(char_id.map(id => {
                return {
                    "op": "remove",
                    "path": `/muroom/${this.#prop.current_chat_id}/characters`,
                    "value": {
                        "id": id
                    }
                };
            })))).json()
        } else {
            return await (await https_fetch(`https://neo.character.ai/muroom/${this.#prop.current_chat_id}/`, "PATCH", {
                'Authorization': `Token ${this.#prop.token}`
            }, JSON.stringify([{
                "op": "remove",
                "path": `/muroom/${this.#prop.current_chat_id}/characters`,
                "value": {
                    "id": char_id
                }
            }]))).json()
        }
    }

    /**
     * Send message to group chat.  
     *   
     * Example  
     * - Default (Without Image): `await library_name.group_chat.send_message("Your Message")`  
     * - With Image: `await library_name.group_chat.send_message("Your Message", "URL Image")`
     * 
     * @param {string} message
     * @param {string | undefined} image_url_path
     * @returns {Promise<GroupChatInfo>}
    */
    async send_message(message, image_url_path = "") {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.join_type || this.#prop.join_type != 2) throw "This function only works when you're connected on Group Chat."

        const turn_key = this.#prop.join_type ? generateRandomUUID() : ""
        return await send_ws(this.#prop.ws[0], JSON.stringify({
            "rpc": {
                "method": "unused_command",
                "data": {
                    "command": "create_turn",
                    "request_id": generateRandomUUID().slice(0, -12) + this.#prop.current_chat_id.split("-")[4],
                    "payload": {
                        "chat_type": "TYPE_MU_ROOM",
                        "num_candidates": 1,
                        "user_name": this.#prop.user_data.user.user.username,
                        "turn": {
                            "turn_key": {
                                "turn_id": turn_key,
                                "chat_id": this.#prop.current_chat_id
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
        }), true, 2, false)
    }

    /**
     * Generating message response character from group chat.  
     *   
     * Example: `await library_name.group_chat.generate_turn()`
     * 
     * @returns {Promise<GroupChatInfo>}
    */
    async generate_turn() {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.join_type || this.#prop.join_type != 2) throw "This function only works when you're connected on Group Chat."

        return await send_ws(this.#prop.ws[0], JSON.stringify({
            "rpc": {
                "method": "unused_command",
                "data": {
                    "command": "generate_turn",
                    "request_id": generateRandomUUID().slice(0, -12) + this.#prop.current_chat_id.split("-")[4],
                    "payload": {
                        "chat_type": "TYPE_MU_ROOM",
                        "chat_id": this.#prop.current_chat_id,
                        "user_name": this.#prop.user_data.user.user.username,
                        "smart_reply": "CHARACTERS",
                        "smart_reply_delay": 0
                    },
                    "origin_id":"Android"
                }
            },
            "id": 1
        }), true, 2, true)
    }

    /**
     * Regenerate character message.  
     *   
     * Example: `await library_name.group_chat.generate_turn_candidate()`
     * 
     * @param {string} turn_id
     * @param {string} char_id
     * @returns {Promise<GroupChatInfo>}
    */
    async generate_turn_candidate(turn_id, char_id) {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.join_type || this.#prop.join_type != 2) throw "This function only works when you're connected on Group Chat."
        
        return await send_ws(this.#prop.ws[0], JSON.stringify({
            "rpc": {
                "method": "unused_command",
                "data": {
                    "command": "generate_turn_candidate",
                    "request_id": generateRandomUUID().slice(0, -12) + this.#prop.current_chat_id.split("-")[4],
                    "payload": {
                        "chat_type": "TYPE_MU_ROOM",
                        "character_id": char_id,
                        "user_name": this.#prop.user_data.user.user.username,
                        "turn_key": {
                            "turn_id": turn_id,
                            "chat_id": this.#prop.current_chat_id
                        }
                    }
                }
            },
            "id": 1
        }), true, 2, true)
    }

    /**
     * Reset conversation in group chat.  
     *   
     * Example: `await library_name.group_chat.reset_conversation()`
     * 
     * @returns {Promise<GroupChatInfo>}
    */
    async reset_conversation() {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.join_type || this.#prop.join_type != 2) throw "This function only works when you're connected on Group Chat."

        const turn_key = generateRandomUUID()
        return await send_ws(this.#prop.ws[0], JSON.stringify({
            "rpc": {
                "method": "unused_command",
                "data": {
                    "command": "create_turn",
                    "request_id": generateRandomUUID().slice(0, -12) + this.#prop.current_chat_id.split("-")[4],
                    "payload": {
                        "chat_type": "TYPE_MU_ROOM",
                        "num_candidates": 1,
                        "user_name": this.#prop.user_data.user.user.username,
                        "turn": {
                            "context_reset": true,
                            "turn_key": {
                                "turn_id": turn_key,
                                "chat_id": this.#prop.current_chat_id
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
        }), true, 2, false)
    }

    /**
     * Delete user/character message.  
     *   
     * Example: `await library_name.group_chat.delete_message("Turn ID")`
     * 
     * @param {string} turn_id
     * @returns {Promise<boolean>}
    */
    async delete_message(turn_id) {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.join_type || this.#prop.join_type != 2) throw "This function only works when you're connected on Group Chat."

        await send_ws(this.#prop.ws[1], JSON.stringify({
            "command": "remove_turns",
            "request_id": generateRandomUUID().slice(0, -12) + this.#prop.current_chat_id.split("-")[4],
            "payload": {
                "chat_id": this.#prop.current_chat_id,
                "turn_ids": Array.isArray(turn_id) ? turn_id : [turn_id]
            },
            "origin_id": "Android"
        }), false, 0, false)
        return true;
    }

    /**
     * Edit user/character message.  
     *   
     * Example: `await library_name.group_chat.edit_message("Turn ID")`
     * 
     * @param {string} turn_id
     * @returns {Promise<GroupChatInfo>}
    */
    async edit_message(candidate_id, turn_id, new_message) {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.join_type || this.#prop.join_type != 2) throw "This function only works when you're connected on Group Chat."
        
        const result = await send_ws(this.#prop.ws[0], JSON.stringify({
            "rpc": {
                "method": "unused_command",
                "data": {
                    "command": "edit_turn_candidate",
                    "request_id": generateRandomUUID().slice(0, -12) + this.#prop.current_chat_id.split("-")[4],
                    "payload": {
                        "turn_key": {
                            "chat_id": this.#prop.current_chat_id,
                            "turn_id": turn_id
                        },
                        "current_candidate_id": candidate_id,
                        "new_candidate_raw_content": new_message
                    }
                }
            },
            "id": 1
        }), true, 2, false)

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
            }), false, 0, false)
        }
        return result;
    }

    /**
     * Select the turn of character chat by yourself.  
     *   
     * Example: `await library_name.group_chat.select_turn("Character ID")`
     * 
     * @param {string} char_id
     * @returns {Promise<GroupChatInfo>}
    */
    async select_turn(char_id) {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.join_type || this.#prop.join_type != 2) throw "This function only works when you're connected on Group Chat."

        return await send_ws(this.#prop.ws[0], JSON.stringify({
            "rpc": {
                "method": "unused_command",
                "data": {
                    "command": "generate_turn",
                    "request_id": generateRandomUUID().slice(0, -12) + this.#prop.current_chat_id.split("-")[4],
                    "payload": {
                        "chat_type": "TYPE_MU_ROOM",
                        "character_id": char_id,
                        "chat_id": this.#prop.current_chat_id
                    }
                }
            },
            "id": 1
        }), true, 2, true)
    }
}

class Chat_Class {
    /**
     * @typedef {object} HistoryChatTurnsInfo
     * @property {object[]} turns
     * @property {object} turns[].turn_key
     * @property {string} turns[].turn_key.chat_id
     * @property {string} turns[].turn_key.turn_id
     * @property {string} turns[].create_time
     * @property {string} turns[].last_update_time
     * @property {string} turns[].state
     * @property {object} turns[].author
     * @property {string} turns[].author.author_id
     * @property {string} turns[].author.name
     * @property {object[]} turns[].candidates
     * @property {string} turns[].candidates[].candidate_id
     * @property {string} turns[].candidates[].create_time
     * @property {string} turns[].candidates[].raw_content
     * @property {boolean} turns[].candidates[].is_final
     * @property {string} turns[].primary_candidate_id
     * @property {object} meta
     * @property {string} meta.next_token
    */

    /**
     * @typedef {object} HistoryArchiveConversationInfo
     * @property {object[]} chats
     * @property {string} chats[].chat_id
     * @property {string} chats[].create_time
     * @property {string} chats[].creator_id
     * @property {string} chats[].character_id
     * @property {string} chats[].state
     * @property {string} chats[].type
     * @property {string} chats[].visibility
    */

    /**
     * @typedef {object} PinMessageInfo
     * @property {object} turn
     * @property {object} turn.turn_key
     * @property {string} turn.turn_key.chat_id
     * @property {string} turn.turn_key.turn_id
     * @property {string} turn.create_time
     * @property {string} turn.last_update_time
     * @property {string} turn.state
     * @property {object} turn.author
     * @property {string} turn.author.author_id
     * @property {string} turn.author.name
     * @property {boolean} turn.author.is_human
     * @property {object[]} turn.candidates
     * @property {string} turn.candidates[].candidate_id
     * @property {string} turn.candidates[].create_time
     * @property {string} turn.candidates[].raw_content
     * @property {string} turn.candidates[].tti_image_rel_path
     * @property {object} turn.candidates[].editor
     * @property {string} turn.candidates[].editor.author_id
     * @property {string} turn.candidates[].editor.name
     * @property {boolean} turn.candidates[].is_final
     * @property {string} turn.candidates[].base_candidate_id
     * @property {string} turn.primary_candidate_id
     * @property {boolean} turn.is_pinned
     * @property {object} chat_info
     * @property {string} chat_info.type
     * @property {string} command
     * @property {string} request_id
    */

    /**
     * @typedef {object} ListPinnedMessageInfo
     * @property {object[]} turns
     * @property {object} turns[].turn_key
     * @property {string} turns[].turn_key.chat_id
     * @property {string} turns[].turn_key.turn_id
     * @property {string} turns[].create_time
     * @property {string} turns[].last_update_time
     * @property {string} turns[].state
     * @property {object} turns[].author
     * @property {string} turns[].author.author_id
     * @property {string} turns[].author.name
     * @property {object[]} turns[].candidates
     * @property {string} turns[].candidates[].candidate_id
     * @property {string} turns[].candidates[].create_time
     * @property {string} turns[].candidates[].raw_content
     * @property {boolean} turns[].candidates[].is_final
     * @property {string} turns[].primary_candidate_id
     * @property {boolean} turns[].is_pinned
     * @property {object} meta
     * @property {string} meta.next_token
    */

    /** 
     * @typedef {object} ConversationInfo
     * @property {object} chat
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
     * Get list of your history archive conversation, and this function is for Single character only.  
     *   
     * Example
     * - Auto (Already connected to the Single character chat): `await library_name.chat.history_conversation()`  
     * - Manual: `await library_name.chat.history_conversation("Character ID")`
     * 
     * @param {string} character_id
     * @returns {Promise<HistoryArchiveConversationInfo>}
    */
    async history_archive_conversation(character_id) {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.current_char_id_chat && !character_id) throw "Please input the Character ID, or you must connected to the single character chat."
        
        return await (await https_fetch(`https://neo.character.ai/chats/?character_ids=${character_id ? character_id : this.#prop.current_char_id_chat}`, "GET", {
            'Authorization': `Token ${this.#prop.token}`
        })).json()
    }

    /**
     * Set conversation chat, and bring the archive chat into current chat.  
     * 
     * @param {string} chat_id 
     * @returns {Promise<undefined>}
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
     * Pin message.  
     *   
     * - if you set the second parameter false, it will unpin the message.  
     * - if you set the second parameter true, it will pin the message.  
     *   
     * Example  
     * - Auto (if your're already connected to the single character): `await library_name.character.pin_message("turn ID")`  
     * - Manual: `await library_name.character.pin_message("turn ID", true, "Chat ID")`
     * 
     * @param {string} turn_id
     * @param {boolean} pinned
     * @param {string} chat_id
     * 
     * @returns {Promise<PinMessageInfo>}
    */
    async pin_message(turn_id, pinned = true, chat_id) {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.current_chat_id && !chat_id) throw "Please fill the chat_id or you must connected to the single character."
        
        return await send_ws(this.#prop.ws[1], JSON.stringify({
            "command": "set_turn_pin",
            "request_id": generateRandomUUID().slice(0, -12) + this.#prop.current_char_id_chat.slice(this.#prop.current_char_id_chat.length - 12),
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
     * Get list pinned message from chat, and this function works only for single character chat.  
     *   
     * Example: `await library_name.chat.list_pinned_message("chat id")`
     * 
     * @param {string} chat_id 
     * @returns {Promise<ListPinnedMessageInfo>}
    */
    async list_pinned_message(chat_id) {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.current_chat_id && !chat_id) throw "Please input the Chat ID, or you must connected to the single character chat."

        return await (await https_fetch(`https://neo.character.ai/turns/${chat_id ? chat_id : this.#prop.current_chat_id}/?pinned_only=true`, "GET", {
            'Authorization': `Token ${this.#prop.token}`
        })).json()
    }
}

class Voice_Class {
    /**
     * @typedef {object} VoiceInfo
     * @property {string} id
     * @property {string} name
     * @property {string} description
     * @property {string} gender
     * @property {string} visibility
     * @property {object} creatorInfo
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
     * Get voice information.  
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
     * Search for a voice by name.  
     *   
     * Example: `await library_name.voice.search("Name voice")`
     * 
     * @param {string} name
     * @returns {Promise<{ voices: VoiceInfo[] }>}
    */
    async search(name) {
        return await (await https_fetch(`https://neo.character.ai/multimodal/api/v1/voices/search?characterName=${name}`, "GET", {
            "Authorization": `Token ${this.#prop.token}`
        })).json()
    }

    /**
     * Warning: This feature only supports Single character chat, not Group chat.  
     *   
     * Connect to voice character chat.  
     *   
     * Example function  
     * - Using Query: `await library_name.voice.connect("Query", true)`  
     * - Using Voice ID: `await library_name.voice.connec("Voice ID")`
     * 
     * - Example to use  
     * ```js
     * let test = await library_name.voice.connect("Sonic The Hedgehog", true)
     * test.on("frameReceived", data => {
     *      console.log(data)
     * })
     * ```
     * 
     * @param {string} voice_query_or_id
     * @param {boolean} using_voice_query
     * @param {boolean} using_mic
     * @returns {Promise<import("@livekit/rtc-node").AudioStream>}
    */
    connect(voice_query_or_id, using_voice_query = false, using_mic = false) {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.join_type || this.#prop.join_type != 1) throw "This function only works when you're connected on Single Character Chat."
        if (!livekit) throw "This function only works when you're install livekit library. (npm/bun install @livekit/rtc-node)"
        if (this.#prop.is_connected_livekit_room) throw "You're already connected to Livekit room!"

        return new Promise(async resolve => {
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

            this.#prop.livekit_room = new livekit.Room()
            await this.#prop.livekit_room.connect(connect_result.lkUrl, connect_result.lkToken, {
                autoSubscribe: true,
                dynacast: true
            })
            
            this.#prop.livekit_room.on("trackSubscribed", track => {
                if (track.kind == 1) {
                    this.#prop.is_connected_livekit_room = 1;
                    resolve(new livekit.AudioStream(track));
                }
            });
        })
    }

    /**
     * Warning: This feature only supports Single character chat, not Group chat.  
     *   
     * Disconnect from voice character chat.  
     *   
     * Example: `await library_name.voice.disconnect()`
     * @returns {Promise<undefined>}
    */
    async disconnect() {
        if (!this.#prop.token) throw "Please login first."
        if (!this.#prop.join_type || this.#prop.join_type != 1) throw "This function only works when you're connected on Single Character Chat."
        if (!livekit) throw "This function only works when you're install livekit library. (npm/bun install @livekit/rtc-node)"
        if (!this.#prop.is_connected_livekit_room) throw "You're already disconnected to Livekit room!"

        await this.#prop.livekit_room.disconnect()
        await livekit.dispose();
        this.#prop.is_connected_livekit_room = 0;
    }
}


class CAINode extends EventEmitter {
    #prop = new CAINode_prop(); // Property

    /**
     * User variables list  
     *   
     * - `info`: contains of your current information account.  
     *   
     * User function list  
     *   
     * - `change_info()`: Change current information account.  
     * - `settings()`: Get your current settings information account.  
     * - `public_following_list()`: Get public user following list.  
     * - `public_followers_list()`: Get public user followers list.  
     * - `following_list_name()`: Get account following name list.  
     * - `followers_list_name()`: Get account followers name list.  
     * - `follow()`: Follow user account.  
     * - `unfollow()`: Unfollow user account.
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
    */
    explore = new Explore_Class(this.#prop); // Explore Class

    /**
     * Character function list  
     *   
     * - `votes()`: Get character vote information.  
     * - `votes_array()`: Get character vote information in array.  
     * - `vote()`: Used for vote the character.  
     * - `search()`: Search for a character by name.  
     * - `search_suggest()`: Search character by name and suggested by Character.AI Server.  
     * - `info()`: Get detailed information about characters.  
     * - `recent_list()`: Get a list of recent chat activity.  
     * - `connect()`: Connect client to character chat.  
     * - `disconnect()`: Disconnecting client from character chat.  
     * - `send_message()`: Send message to character.  
     * - `generate_turn()`: Generating message response from character.  
     * - `generate_turn_candidate()`: Regenerate character message.  
     * - `reset_conversation()`: Reset the conversation between you and the character.  
     * - `delete_message()`: Delete character message.  
     * - `edit_message()`: Edit the character message.
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
     * - `history_chat_turns()`: Get a history chat from group or single chat.  
     * - `conversation_info()`: Get conversation info.  
     * - `history_archive_conversation()`: Get list of your history archive conversation, and this function is for Single character only.  
     * - `set_conversation_chat()`: Set conversation chat, and bring the archive chat into current chat.  
     * - `pin_message()`: Pin message.  
     * - `list_pinned_message()`: Get list pinned message from chat, and this function works only for single character chat.
    */
    chat = new Chat_Class(this.#prop) // Chat Class

    /**
     * Voice function list  
     *   
     * - `user_list()`: Get your own voice creation list information.  
     * - `info()`: Get voice information.  
     * - `search()`: Search for a voice by name.  
     * - `connect()`: Connect to voice character chat.  
     * - `disconnect()`: Disconnect from voice character chat.  
    */
    voice = new Voice_Class(this.#prop); // Voice Class

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
        this.#prop.edge_rollout = (await https_fetch("https://character.ai/", "GET")).headers.get("set-cookie").match(/edge_rollout=(\d+)/)[1]
        this.#prop.user_data = await (await https_fetch("https://plus.character.ai/chat/user/", "GET", {
            'Authorization': `Token ${token}`
        })).text()

        if (this.#prop.user_data === "Unauthorized") throw "Not a valid Character.AI Token."
        this.#prop.user_data = JSON.parse(this.#prop.user_data)
        if (!this.#prop.user_data.user) throw "Not a valid Character.AI Token."

        this.#prop.ws = [
            await open_ws("wss://neo.character.ai/connection/websocket", `edge_rollout=${this.#prop.edge_rollout}; HTTP_AUTHORIZATION="Token ${token}"`, this.#prop.user_data.user.user.id, this),
            await open_ws("wss://neo.character.ai/ws/", `edge_rollout=${this.#prop.edge_rollout}; HTTP_AUTHORIZATION="Token ${token}"`, 0, this)
        ]
        this.#prop.token = token
        return true;
    }

    /**
     * Generate your Character.AI Token by email.  
     *   
     * Example: `console.log(await library_name.generate_token("your@email.com"))`
     * @param {string} email 
     * @returns {Promise<string>}
    */
    generate_token(email) {
        return new Promise(async resolve => {
            let res;
            const polling_uuid = (await (await https_fetch("https://character.ai/api/trpc/auth.login?batch=1", "POST", {
                "Content-Type": "application/json"
            }, JSON.stringify({"0":{"json":{"email":email}}}))).json())[0].result.data.json
            if (!polling_uuid) throw "Please input the correct email."
            console.log("Please check your email")
            while(1) {
                await wait(2000)
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
            }
            resolve(res);
        })
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

        this.removeAllListeners("message")
        return true;
    }
}

export { CAINode }
