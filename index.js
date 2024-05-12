const WebSocket = require("ws")
const events = require('events');

async function https_fetch(url, method, headers, body) {
    if (body) headers["Content-Length"] = body.length
    return await fetch(url, {
        method: method,
        headers: {
            "User-Agent": "Character.AI/1.8.6 (React Native; Android)",
            "DNT": "1",
            "Sec-GPC": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "TE": "trailers",
            "Connection": "close",
            ...headers
        },
        body
    })
}

function generateRandomUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function open_ws(url, cookie, userid, this_class) {
    return new Promise((resolve, reject) => {
        let ws_con = new WebSocket(url, {
            headers: {
                Cookie: cookie
            }
        })
        ws_con.once('open', function() {
            if (userid) ws_con.send(`{"connect":{"name":"js"},"id":1}{"subscribe":{"channel":"user#${userid}"},"id":1}`)
            resolve(ws_con)
        })
        ws_con.on('message', async function(message) {
            message = message.toString()
            if (message === "{}") ws_con.send("{}")
            else this_class.emit("message", message)
        });
    });
}

function send_ws(ws_con, data, using_json, wait_json_prop_type) {
    return new Promise((resolve, reject) => {
        ws_con.on("message", function incoming(message) {
            message = using_json ? JSON.parse(message.toString()) : message.toString()
            if (using_json && wait_json_prop_type) {
                try {
                    switch(wait_json_prop_type) {
                        case 1: { // single character chat
                            if (message.turn.candidates[0].is_final) {
                                ws_con.removeListener("message", incoming);
                                resolve(message)
                            }
                            break;
                        }
                        case 2: { // group chat
                            if (message["push"].pub.data.turn.candidates[0].is_final) {
                                ws_con.removeListener("message", incoming);
                                resolve(message)
                            }
                            break;
                        }
                    }
                }
                catch(e) {}
            } else {
                ws_con.removeListener("message", incoming);
                resolve(using_json ? JSON.parse(message.toString()) : message.toString())
            } //* nah silahkan coba coba lagi, masih memory leak atau enggak :3
        })
        ws_con.send(data)
    })
}

function close_ws(ws_con) {
    return new Promise((resolve, reject) => {
        ws_con.close();
        ws_con.once("close", () => resolve())
    })
}

class CAINode extends events.EventEmitter {
    //private variable
    #ws = []
    #token = "";
    #user_data = "";
    #current_chat_id = "";
    #edge_rollout = "";
    #join_type = 0;
    #current_char_id_chat = "";

    constructor() {
        super()
        this.user = {
            /**
             * Get user information Account  
             *   
             * Example code `console.log(library_name.user.info())`
             * 
             * @typedef {object} user
             * @property {object} user
             * @property {string} user.username
             * @property {number} user.id
             * @property {string} user.first_name
             * @property {object} user.account
             * @property {string} user.account.name
             * @property {string} user.account.avatar_type
             * @property {string} user.account.onboarding_complete
             * @property {string} user.account.avatar_file_name
             * @property {string} user.account.mobile_onboarding_complete
             * @property {boolean} user.is_staff
             * @property {any} user.subscription
             * 
             * @returns {user}
            */
            info: () => {
                return !this.#token ? (() => {
                    throw "Please login first"
                })() : this.#user_data.user
            },
        }

        this.character = {
            /**
             * @typedef {object} single_character_object
             * 
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
             * @property {object[]} turn.candidates
             * @property {string} turn.candidates[].candidate_id
             * @property {string} turn.candidates[].create_time
             * @property {string} turn.candidates[].raw_content
             * @property {boolean} turn.candidates[].is_final
             * @property {string} turn.primary_candidate_id
             * @property {object} chat_info
             * @property {string} chat_info.type
             * @property {string} command
             * @property {string} request_id
            */

            /**
             * @typedef {object} single_character_edit_message_object
             * 
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
             * @property {object[]} turn.candidates
             * @property {string} turn.candidates[].candidate_id
             * @property {string} turn.candidates[].create_time
             * @property {string} turn.candidates[].raw_content
             * @property {object} turn.candidates[].editor
             * @property {string} turn.candidates[].editor.author_id
             * @property {string} turn.candidates[].editor.name
             * @property {boolean} turn.candidates[].is_final
             * @property {string} turn.candidates[].base_candidate_id
             * @property {string} turn.primary_candidate_id
             * @property {object} chat_info
             * @property {string} chat_info.type
             * @property {string} command
             * @property {string} request_id
            */

            /**
             * Search character by name  
             *   
             * Example code `console.log(await library_name.character.search("Character Name"))`
             * @param {string} name
             * 
             * @typedef {object} char1
             * @property {object[]} characters[]
             * @property {string} characters[].document_id
             * @property {string} characters[].external_id
             * @property {string} characters[].title
             * @property {string} characters[].greeting
             * @property {string} characters[].avatar_file_name
             * @property {string} characters[].visibility
             * @property {string} characters[].participant__name
             * @property {number} characters[].participant__num__interactions
             * @property {string} characters[].user__username
             * @property {number} characters[].priority
             * @property {number} characters[].search_score
             * 
             * @returns {Promise<char1>}
            */
            search: async (name) => {
                return !this.#token ? (() => {
                    throw "Please login first"
                })() : await (await https_fetch(`https://beta.character.ai/chat/characters/search/?query=${name}`, "GET", {
                    'Authorization': `Token ${this.#token}`
                })).json()
            },

            /**
             * Search character by name and suggested by Character.AI Server  
             *   
             * Example usage: `console.log(await library_name.character.search_suggest("Character Name"))`
             * @param {string} name
             *
             * @typedef {object} char2
             * @property {object[]} characters[]
             * @property {string} characters[].document_id
             * @property {string} characters[].external_id
             * @property {string} characters[].name
             * @property {string} characters[].avatar_file_name
             * @property {string} characters[].num_interactions
             * @property {string} characters[].title
             * @property {string} characters[].greeting
             * 
             * @returns {Promise<char2>}
            */
            serach_suggest: async (name) => {
                return !this.#token ? (() => {
                    throw "Please login first"
                })() : await (await https_fetch(`https://beta.character.ai/chat/characters/suggest/?query=${name}`, "GET", {
                    'Authorization': `Token ${this.#token}`
                })).json()
            },

            /**
             * Get Character Information  
             *   
             * Example usage: `console.log(await library_name.character.info("external_id"))`
             * @param {string} external_id
             *
             * @typedef {object} char3
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
             * @property {array} character.songs
             * @property {boolean} character.img_gen_enabled
             * @property {string} character.base_img_prompt
             * @property {string} character.img_prompt_regex
             * @property {boolean} character.strip_img_prompt_from_msg
             * @property {any} character.default_voice_id
             * @property {any} character.starter_prompts
             * @property {string} character.user__username
             * @property {string} character.participant__name
             * @property {number} character.participant__num_interactions
             * @property {string} character.participant__user__username
             * @property {string} character.voice_id
             * @property {string} character.usage
             * @property {string} character.upvotes
             * @property {string} status
             * 
             * @returns {Promise<char3>}
            */
            info: async (char_extern_id) => {
                return !this.#token ? (() => {
                    throw "Please login first"
                })() : await (await https_fetch("https://beta.character.ai/chat/character/info/", "POST", {
                    'Authorization': `Token ${this.#token}`,
                    "Content-Type": "application/json"
                }, JSON.stringify({
                    "external_id": char_extern_id
                }))).json()
            },

            /**
             * Get Recent Character List  
             *   
             * Example usage: `console.log(await library_name.character.recent_list())`
             * 
             * @typedef {object} char_list
             * @property {object[]} chats[]
             * @property {string} chats[].chat_id
             * @property {string} chats[].create_time
             * @property {string} chats[].creator_id
             * @property {string} chats[].character_id
             * @property {string} chats[].state
             * @property {string} chats[].type
             * @property {string} chats[].visibility
             * @property {string} chats[].character_name
             * @property {string} chats[].character_avatar_uri
             * @property {string} chats[].character_visibility
             * @property {object} chats[].character_translations
             * @property {any} chats[].default_voice_id
             * 
             * @returns {Promise<char_list>}
            */
            recent_list: async () => {
                return !this.#token ? (() => {
                    throw "Please login first"
                })() : await (await https_fetch("https://neo.character.ai/chats/recent/", "GET", {
                    'Authorization': `Token ${this.#token}`
                })).json()
            },

            /**
             * Connect to Single Character Chat  
             *   
             * Example usage: `console.log(await library_name.character.connect("character_id"))`  
             * 
             * @typedef {object} character_connect_object
             * @property {object[]} chats[]
             * @property {string} chats[].chat_id
             * @property {string} chats[].create_time
             * @property {string} chats[].creator_id
             * @property {string} chats[].character_id
             * @property {string} chats[].state
             * @property {string} chats[].type
             * @property {string} chats[].visibility
             * @property {string} chats[].character_name
             * @property {string} chats[].character_avatar_uri
             * @property {string} chats[].character_visibility
             * @property {object} chats[].character_translations
             * @property {object} chats[].character_translations.name
             * @property {string} chats[].character_translations.name.ko
             * @property {string} chats[].character_translations.name.ru
             * @property {string} chats[].character_translations.name.ja_JP
             * @property {string} chats[].character_translations.name.zh_CN
             * @property {string} chats[].default_voice_id
             * @returns {Promise<character_connect_object>}
            */
            connect: async (char_id) => {
                if (!this.#token) throw "Please login first"
                if (this.#join_type == 2) throw "You're already connectetd in Group Chat, please disconnect first"

                let res = await (await https_fetch(`https://neo.character.ai/chats/recent/${char_id}`, "GET", {
                    'Authorization': `Token ${this.#token}`
                })).json()
                await https_fetch(`https://neo.character.ai/chat/${res.chats[0].chat_id}/resurrect`, "GET", {
                    'Authorization': `Token ${this.#token}`
                });

                this.#join_type = 1;
                this.#current_char_id_chat = char_id
                this.#current_chat_id = res.chats[0].chat_id

                return res;
            },
            /**
             * Disconnect from Single Character Chat  
             *   
             * Example Usage: `await library_name.character.disconnect()`
             *
             * @returns {Promise<boolean>}
            */
            disconnect: async () => {
                if (!this.#token) throw "Please login first"
                if (!this.#join_type) throw "You're not connected from Single character Chat"
                if (this.#join_type == 2) throw "You're connectetd in Group Chat, not Single Character Chat"

                this.#current_chat_id = "";
                this.#current_char_id_chat = "";
                this.#join_type = 0;
                return true;
            },

            /**
             * Send Message to Single Character  
             *   
             * Warning: If you want turn manually, you can set manual_turn to true  
             *   
             * Example Usage (automatic turn): `await library_name.character.send_message("Hello World")`  
             * Example Usage (manual turn): `await library_name.character.send_message("Hello World", false)`  
             * @param {string} message 
             * @param {boolean} manual_turn 
             * @returns {Promise<single_character_object>}
            */
            send_message: async (message, manual_turn) => {
                if (!this.#token) throw "Please login first"
                if (!this.#join_type) throw "You're not connected from Single character Chat"
                if (this.#join_type == 2) throw "You're connectetd in Group Chat, not Single Character Chat"

                let turn_key = this.#join_type ? generateRandomUUID() : ""

                return await send_ws(this.#ws[1], JSON.stringify({
                    "command": manual_turn ? "create_turn" : "create_and_generate_turn",
                    "request_id": generateRandomUUID().slice(0, -12) + this.#current_char_id_chat.slice(this.#current_char_id_chat.length - 12),
                    "payload": {
                        "num_candidates": 1,
                        "tts_enabled": false,
                        "selected_language": "",
                        "character_id": this.#current_char_id_chat,
                        "user_name": this.#user_data.user.user.username,
                        "turn": {
                            "turn_key": {
                                "turn_id": turn_key,
                                "chat_id": this.#current_chat_id
                            },
                            "author": {
                                "author_id": `${this.#user_data.user.user.id}`,
                                "is_human": true,
                                "name": this.#user_data.user.user.username
                            },
                            "candidates": [{
                                "candidate_id": turn_key,
                                "raw_content": message
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
                }), true, Number(!manual_turn))
            },
            /**
             * Character will response your message  
             *   
             * Usage example: `await library_name.character.generate_turn()`  
             * 
             * @returns {Promise<single_character_object>}
            */
            generate_turn: async() => {
                if (!this.#join_type) throw "you must be connected to single chat"
                if (this.#join_type == 1) {
                    return await send_ws(this.#ws[1], JSON.stringify({
                        "command": "generate_turn",
                        "request_id": generateRandomUUID().slice(0, -12) + this.#current_char_id_chat.slice(this.#current_char_id_chat.length - 12),
                        "payload": {
                            "chat_type": "TYPE_ONE_ON_ONE",
                            "chat_id": this.#current_chat_id,
                            "character_id": this.#current_char_id_chat,
                            "user_name": this.#user_data.user.user.username
                        },
                        "origin_id": "Android"
                    }), true, 1)
                    
                } else throw "This function only works when you're connected on Single Chat, not Group chat"
            },

            /**
             * It will regenerate message for Character  
             *   
             * Usage example: `await library_name.character.generate_turn_candidate("turn_id")`
             * 
             * @param {string} turn_id
             * @returns {Promise<single_character_object>}
            */
            generate_turn_candidate: async(turn_id) => {
                if (this.#join_type != 1) throw "You're not connected to Single Character Chat"
                return await send_ws(this.#ws[1], JSON.stringify({
                    "command": "generate_turn_candidate",
                    "request_id": generateRandomUUID().slice(0, -12) + this.#current_char_id_chat.slice(this.#current_char_id_chat.length - 12),
                    "payload": {
                        "tts_enabled": false,
                        "selected_language": "",
                        "character_id": this.#current_char_id_chat,
                        "user_name": this.#user_data.user.user.username,
                        "turn_key": {
                            "turn_id": turn_id,
                            "chat_id": this.#current_chat_id
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
                }), true, 1)
            },

            /**
             * It will reset conversation and start to new conversation  
             *   
             * Usage example: `await library_name.character.reset_conversation()`
             * 
             * @returns {Promise<single_character_object>}
            */
            reset_conversation: async () => {
                return await send_ws(this.#ws[1], JSON.stringify({
                    "command": "create_chat",
                    "request_id": generateRandomUUID().slice(0, -12) + this.#current_char_id_chat.slice(this.#current_char_id_chat.length - 12),
                    "payload": {
                        "chat": {
                            "chat_id": generateRandomUUID(),
                            "creator_id": `${this.#user_data.user.user.id}`,
                            "visibility": "VISIBILITY_PRIVATE",
                            "character_id": this.#current_char_id_chat,
                            "type": "TYPE_ONE_ON_ONE"
                        },
                        "with_greeting": true
                    },
                    "origin_id": "Android"
                }), true, 1)
            },

            /**
             * Delete Message  
             *   
             * Usage Example (single message): `await library_name.character.delete_message("turn_id")`  
             * Usage Example (multi message): `await library_name.character.delete_message(["turn_id_1", "turn_id_2", ...])`  
             * 
             * @param {string|array} turn_id
             * @returns {Promise<boolean>}
            */
            delete_message: async (turn_id) => {
                if (!this.#token) throw "Please login first"
                await send_ws(this.#ws[1], JSON.stringify({
                    "command": "remove_turns",
                    "request_id": generateRandomUUID().slice(0, -12) + this.#current_char_id_chat.slice(this.#current_char_id_chat.length - 12),
                    "payload": {
                        "chat_id": this.#current_chat_id,
                        "turn_ids": Array.isArray(turn_id) ? turn_id : [turn_id]
                    },
                    "origin_id": "Android"
                }), 0, 0)
                return true;
            },

            /**
             * Edit message (you can edit user message or character message)  
             *   
             * Usage example (single message): `await library_name.character.edit_message("candidate_id", "turn_id", "Edit message")`  
             * 
             * @param {string} candidate_id
             * @param {string} turn_id
             * @param {string} new_message
             * 
             * @returns {Promise<single_character_edit_message_object>}
            */
            edit_message: async(candidate_id, turn_id, new_message) => {
                if (!this.#token) throw "Please login first"
                let result = await send_ws(this.#ws[1], JSON.stringify({
                    "command": "edit_turn_candidate",
                    "request_id": generateRandomUUID().slice(0, -12) + this.#current_char_id_chat.slice(this.#current_char_id_chat.length - 12),
                    "payload": {
                        "turn_key": {
                            "chat_id": this.#current_chat_id,
                            "turn_id": turn_id
                        },
                        "current_candidate_id": candidate_id,
                        "new_candidate_raw_content": new_message
                    },
                    "origin_id": "Android"
                }), true, 1)

                if (!result.turn.author.is_human) {
                    await send_ws(this.#ws[1], JSON.stringify({
                        "command": "update_primary_candidate",
                        "payload": {
                            "candidate_id": candidate_id,
                            "turn_key": {
                                "chat_id": this.#current_chat_id,
                                "turn_id": turn_id
                            }
                        },
                        "origin_id": "Android"
                    }), 0, 0)
                }
                return result;
            }
        }

        this.group_chat = {
            /**
             * @typedef group_chat_object
             * @property {string} push.channel
             * @property {object} push.pub
             * @property {object} push.pub.data
             * @property {object} push.pub.data.turn
             * @property {object} push.pub.data.turn.turn_key
             * @property {string} push.pub.data.turn.turn_key.chat_id
             * @property {string} push.pub.data.turn.turn_key.turn_id
             * @property {string} push.pub.data.turn.create_time
             * @property {string} push.pub.data.turn.last_update_time
             * @property {string} push.pub.data.turn.state
             * @property {object} push.pub.data.turn.author
             * @property {string} push.pub.data.turn.author.author_id
             * @property {boolean} push.pub.data.turn.author.is_human
             * @property {string} push.pub.data.turn.author.name
             * @property {object[]} push.pub.data.turn.candidates
             * @property {string} push.pub.data.turn.candidates[].candidate_id
             * @property {string} push.pub.data.turn.candidates[].create_time
             * @property {string} push.pub.data.turn.candidates[].raw_content
             * @property {boolean} push.pub.data.turn.candidates[].is_final
             * @property {string} push.pub.data.turn.primary_candidate_id
             * @property {object} push.pub.data.chat_info
             * @property {string} push.pub.data.chat_info.type
             * @property {string} push.pub.data.command
             * @property {string} push.pub.data.request_id
             * @property {number} push.pub.offset
            */

            /**
             * @typedef group_chat_edit_message_object
             * @property {string} push.channel
             * @property {object} push.pub
             * @property {object} push.pub.data
             * @property {object} push.pub.data.turn
             * @property {object} push.pub.data.turn.turn_key
             * @property {string} push.pub.data.turn.turn_key.chat_id
             * @property {string} push.pub.data.turn.turn_key.turn_id
             * @property {string} push.pub.data.turn.create_time
             * @property {string} push.pub.data.turn.last_update_time
             * @property {string} push.pub.data.turn.state
             * @property {object} push.pub.data.turn.author
             * @property {string} push.pub.data.turn.author.author_id
             * @property {boolean} push.pub.data.turn.author.is_human
             * @property {string} push.pub.data.turn.author.name
             * @property {object[]} push.pub.data.turn.candidates
             * @property {string} push.pub.data.turn.candidates[].candidate_id
             * @property {string} push.pub.data.turn.candidates[].create_time
             * @property {string} push.pub.data.turn.candidates[].raw_content
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

            /**
             * Get group chat List  
             *   
             * Example usage: `console.log(await library_name.group_chat.list())`  
             * 
             * @typedef {object} room
             * 
             * @property {object[]} rooms[]
             * @property {string} rooms[].id
             * @property {string} rooms[].title
             * @property {string} rooms[].description
             * @property {string} rooms[].visibility
             * @property {string} rooms[].picture
             * 
             * @property {object[]} rooms[].characters[]
             * @property {string} rooms[].characters[].id
             * @property {string} rooms[].characters[].name
             * @property {string} rooms[].characters[].avatar_url
             * 
             * @property {object[]} rooms[].users[]
             * @property {string} rooms[].users[].id
             * @property {string} rooms[].users[].username
             * @property {string} rooms[].users[].name
             * @property {string} rooms[].users[].avatar_url
             * @property {string} rooms[].users[].role
             * @property {string} rooms[].users[].state
             * 
             * @property {array} rooms[].permissions
             * 
             * @property {object} rooms[].preview_turns
             * @property {array} rooms[].preview_turns.turns
             * @property {object} rooms[].preview_turns.meta
             * @property {string} rooms[].preview_turns.meta.next_token
             * 
             * @property {object} rooms[].settings
             * @property {boolean} rooms[].settings.anyone_can_join
             * @property {boolean} rooms[].settings.require_approval
             * @property {boolean} rooms[].settings.auto_smart_reply
             * @property {boolean} rooms[].settings.smart_reply_timer
             * @property {string} rooms[].settings.join_token
             * @property {number} rooms[].settings.user_limit
             * @property {number} rooms[].settings.character_limit
             * @property {string} rooms[].settings.push_notification_mode
             * 
             * @returns {Promise<room>}
            */
            list: async () => {
                if (!this.#token) throw "Please login first"
                return await (await https_fetch("https://neo.character.ai/murooms/?include_turns=false", "GET", {
                    'Authorization': `Token ${this.#token}`
                })).json()
            },

            /**
             * Connect to Group Chat  
             *   
             * Example usage: `await library_name.group_chat.connect("group_id")`  
             * 
             * @typedef {object} connect_info_group_chat
             * 
             * @property {number} id
             * @property {object} subscribe
             * @property {boolean} subscribe.recoverable
             * @property {string} subscribe.epoch
             * @property {boolean} subscribe.positioned
             * 
             * @param {string} room_id
             * @returns {Promise<connect_info_group_chat>}
            */
            connect: async (room_id) => {
                if (!this.#token) throw "Please login first"
                if (this.#join_type == 2) throw "You are already connected from the room"

                const res = await send_ws(this.#ws[0], `{"subscribe":{"channel":"room:${room_id}"},"id":1}`, true, 0)
                if (res.error) return 0;
                this.#current_chat_id = room_id;
                this.#join_type = 2;
                return res;
            },
            
            /**
             * Disconnect from Group Chat  
             *   
             * Example usage: `await library_name.group_chat.disconnect()`
             * 
             * @typedef {object} disconnect_info_group_chat
             * 
             * @property {number} id
             * @property {object} unsubscribe
             * 
             * @returns {Promise<disconnect_info_group_chat>}
            */
            disconnect: async () => {
                if (!this.#token) throw "Please login first"
                if (this.#join_type != 2) throw "You're not connected to any Group Chat"
                const res = await send_ws(this.#ws[0], `{"unsubscribe":{"channel":"room:${this.#current_chat_id}"},"id":1}`, true, 0)

                this.#join_type = 0;
                this.#current_chat_id = "";
                return res;
            },

            /**
             * Create group chat  
             *   
             * Example Usage (Single Character): `await library_name.group_chat.create("Group Name", "Character ID")`  
             * Example Usage (Multi Character): `await library_name.group_chat.create("Group Name", ["Character ID 1", "Character ID 2", ...])`
             * @typedef {object} create_group_chat
             * @property {string} id
             * @property {string} title
             * @property {string} description
             * @property {string} visibility
             * @property {string} picture
             * @property {number} last_updated
             * 
             * @property {object[]} characters[]
             * @property {string} characters[].id
             * @property {string} characters[].name
             * @property {string} characters[].avatar_url
             * 
             * @property {object[]} users[]
             * @property {string} users[].id
             * @property {string} users[].username
             * @property {string} users[].name
             * @property {string} users[].avatar_url
             * @property {string} users[].role
             * @property {string} users[].state
             * 
             * @property {array} permissions
             * 
             * @property {object} preview_turns
             * 
             * @property {object[]} preview_turns.turns
             * 
             * @property {object} preview_turns.turns.turn_key
             * @property {string} preview_turns.turns.turn_key.chat_id
             * @property {string} preview_turns.turns.turn_key.turn_id
             * 
             * @property {string} preview_turns.turns.create_time
             * @property {string} preview_turns.turns.last_update_time
             * @property {string} preview_turns.turns.state
             * 
             * @property {object} preview_turns.turns.author
             * @property {string} preview_turns.turns.author.author_id
             * @property {string} preview_turns.turns.author.name
             * 
             * @property {object[]} preview_turns.turns.candidates
             * @property {string} preview_turns.turns.candidates.candidate_id
             * @property {string} preview_turns.turns.candidates.create_time
             * @property {string} preview_turns.turns.candidates.raw_content
             * @property {string} preview_turns.turns.candidates.is_final
             * 
             * @property {object} preview_turns.turns.candidates.editor
             * @property {string} preview_turns.turns.candidates.editor.author_id
             * @property {string} preview_turns.turns.candidates.editor.name
             * 
             * @property {boolean} preview_turns.turns.candidates.is_final
             * 
             * @property {string} preview_turns.turns.primary_candidate_id
             * 
             * @property {object} preview_turns.meta
             * @property {string} preview_turns.meta.next_token
             * 
             * @property {object} settings
             * @property {boolean} settings.anyone_can_join
             * @property {boolean} settings.require_approval
             * @property {boolean} settings.auto_smart_reply
             * @property {boolean} settings.smart_reply_timer
             * @property {string} settings.join_token
             * @property {number} settings.user_limit
             * @property {number} settings.character_limit
             * @property {string} settings.push_notification_mode
             * 
             * @param {string} title_room
             * @param {(string | string[])} char_id
             * 
             * @returns {Promise<create_group_chat>}
            */
            create: async(title_room, char_id) => {
                if (!this.#token) throw "Please login first"
                return await (await https_fetch("https://neo.character.ai/muroom/create", "POST", {'Authorization': `Token ${this.#token}`}, JSON.stringify({
                    "characters": Array.isArray(char_id) ? char_id : [char_id],
                    "title": title_room,
                    "settings": {
                        "anyone_can_join": true,
                        "require_approval": false
                    },
                    "visibility": "VISIBILITY_UNLISTED",
                    "with_greeting": true
                }))).json()
            },

            /**
             * ! Delete group chat  
             *   
             * ? Example usage: `await library_name.group_chat.delete("room_id")`
             * 
             * @typedef {object} delete_group_chat
             * @property {string} id
             * @property {string} command
             * 
             * @param {string} room_id
             * 
             * @returns {Promise<delete_group_chat>}
            */
            delete: async (room_id) => {
                if (!this.#token) throw "Please login first"
                if (this.#join_type == 2) await send_ws(this.#ws[0], `{"unsubscribe":{"channel":"room:${this.#current_chat_id}"},"id":1}`, true, 0)
                return await (await https_fetch(`https://neo.character.ai/muroom/${this.#join_type == 2 ? this.#current_chat_id : room_id}/`, "DELETE", {'Authorization': `Token ${this.#token}`})).json()
            },

            /**
             * Rename group chat  
             *   
             * Warning: If you're already connected from Group, you no need to input room_id  
             *   
             * Example Usage: `await library_name.group_chat.rename("new group name", "room_id")`  
             * 
             * @typedef {object} rename_group_chat
             * @property {string} id
             * 
             * @property {object} users
             * @property {array} users.added
             * @property {array} users.removed
             * 
             * @property {object} characters
             * @property {array} characters.added
             * @property {array} characters.removed
             * 
             * @property {string} title
             * @property {string} command
             * 
             * @param {string} new_name
             * @param {string} room_id
             * 
             * @returns {Promise<rename_group_chat>}
            */
            rename: async (new_name, room_id) => {
                if (!this.#token) throw "Pleae login first"
                return await (await https_fetch(`https://neo.character.ai/muroom/${this.#join_type == 2 ? this.#current_chat_id : room_id}/`, "PATCH", {'Authorization': `Token ${this.#token}`}, JSON.stringify([
                    {
                        "op": "replace",
                        "path": `/muroom/${this.#join_type == 2 ? this.#current_chat_id : room_id}`,
                        "value": {
                            "title": `${new_name}`
                        }
                    }
                ]))).json()
            },

            /**
             * Join Group Chat Invite  
             *   
             * Example usage: `await library_name.group_chat.join_group_invite("invite_code")`
             * 
             * @typedef {object} invite_group_chat
             * @property {string} id
             * @property {string} title
             * @property {string} description
             * @property {string} picture
             * @property {number} last_updated
             * 
             * @property {object[]} characters[]
             * @property {string} characters[].id
             * @property {string} characters[].name
             * @property {string} characters[].avatar_url
             * 
             * @property {object[]} users[]
             * @property {string} users[].id
             * @property {string} users[].username
             * @property {string} users[].name
             * @property {string} users[].avatar_url
             * @property {string} users[].role
             * @property {string} users[].state
             * 
             * @property {array} permissions
             * 
             * @property {object} preview_turns
             * @property {array} preview_turns.turns
             * @property {object} preview_turns.meta
             * @property {string} preview_turns.meta.next_token
             * 
             * @property {object} settings
             * @property {boolean} settings.anyone_can_join
             * @property {boolean} settings.require_approval
             * @property {boolean} settings.auto_smart_reply
             * @property {boolean} settings.smart_reply_timer
             * @property {string} settings.join_token
             * @property {number} settings.user_limit
             * @property {number} settings.character_limit
             * @property {string} settings.push_notification_mode
             * 
             * @property {string} command
             * 
             * @param {string} new_name
             * @param {string} room_id
             * 
             * @returns {Promise<invite_group_chat>}
            */
            join_group_invite: async(invite_code) => {
                if (!this.#token) throw "Please login first"
                await https_fetch(`https://neo.character.ai/muroom/?join_token=${invite_code}`, "GET", {'Authorization': `Token ${this.#token}`})
                return await (await https_fetch("https://neo.character.ai/muroom/join", "POST", {'Authorization': `Token ${this.#token}`}, `{"join_token":"${invite_code}"}`)).json()
            },

            /**
             * Add Character to Group Chat  
             *   
             * You must connected to Group Chat to add Character to Group Chat  
             *   
             * Example Usage: `await library_name.group_chat.char_add("extern_char_id")`
             * 
             * @typedef {object} add_char
             * @property {string} id
             * 
             * @property {object} users
             * @property {array} users.added
             * @property {array} users.removed
             * 
             * @property {object} characters
             * @property {array} characters.added
             * @property {array} characters.removed
             * 
             * @property {string} command
             * 
             * @param {string} new_name
             * @param {string} room_id
             * 
             * @returns {Promise<add_char>}
            */
            char_add: async (char_id) => {
                if (!this.#token) throw "Please login first"
                if (this.#join_type != 2) throw "You're not connected to any Group Chat"
                if (Array.isArray(char_id)) {
                    return await (await https_fetch(`https://neo.character.ai/muroom/${this.#current_chat_id}/`, "PATCH", {
                        'Authorization': `Token ${this.#token}`
                    }, JSON.stringify(char_id.map(id => {
                        return {
                            "op": "add",
                            "path": `/muroom/${this.#current_chat_id}/characters`,
                            "value": {
                                "id": id
                            }
                        };
                    })))).json()
                } else {
                    return await (await https_fetch(`https://neo.character.ai/muroom/${this.#current_chat_id}/`, "PATCH", {
                        'Authorization': `Token ${this.#token}`
                    }, JSON.stringify([{
                        "op": "add",
                        "path": `/muroom/${this.#current_chat_id}/characters`,
                        "value": {
                            "id": char_id
                        }
                    }]))).json()
                }
            },

            /**
             * Remove Character to Group Chat  
             *   
             * Warning: You've must connected to Group Chat to Remove Character from Group Chat  
             *   
             * Example Usage: `await library_name.group_chat.char_remove("extern_char_id")`
             * 
             * @typedef {object} remove_char
             * @property {string} id
             * 
             * @property {object} users
             * @property {array} users.added
             * @property {array} users.removed
             * 
             * @property {object} characters
             * @property {array} characters.added
             * @property {array} characters.removed
             * 
             * @property {string} command
             * 
             * @param {string} new_name
             * @param {string} room_id
             * 
             * @returns {Promise<remove_char>}
            */
            char_remove: async (char_id) => {
                if (!this.#token) throw "Please login first"
                if (this.#join_type != 2) throw "You're not connected to any Group Chat"
                if (Array.isArray(char_id)) {
                    return await (await https_fetch(`https://neo.character.ai/muroom/${this.#current_chat_id}/`, "PATCH", {
                        'Authorization': `Token ${this.#token}`
                    }, JSON.stringify(char_id.map(id => {
                        return {
                            "op": "remove",
                            "path": `/muroom/${this.#current_chat_id}/characters`,
                            "value": {
                                "id": id
                            }
                        };
                    })))).json()
                } else {
                    return await (await https_fetch(`https://neo.character.ai/muroom/${this.#current_chat_id}/`, "PATCH", {
                        'Authorization': `Token ${this.#token}`
                    }, JSON.stringify([{
                        "op": "remove",
                        "path": `/muroom/${this.#current_chat_id}/characters`,
                        "value": {
                            "id": char_id
                        }
                    }]))).json()
                }
            },

            /**
             * Send message to Group Chat  
             *   
             * Example Usage: `await library_name.group_chat.send_message("Your Message")`
             * @param {string} message
             * @returns {Promise<group_chat_object>}
             */
            send_message: async(message) => {
                let turn_key = this.#join_type ? generateRandomUUID() : ""
                return await send_ws(this.#ws[0], JSON.stringify({
                    "rpc": {
                        "method": "unused_command",
                        "data": {
                            "command": "create_turn",
                            "request_id": generateRandomUUID().slice(0, -12) + this.#current_chat_id.split("-")[4],
                            "payload": {
                                "chat_type": "TYPE_MU_ROOM",
                                "num_candidates": 1,
                                "user_name": this.#user_data.user.user.username,
                                "turn": {
                                    "turn_key": {
                                        "turn_id": turn_key,
                                        "chat_id": this.#current_chat_id
                                    },
                                    "author": {
                                        "author_id": `${this.#user_data.user.user.id}`,
                                        "is_human": true,
                                        "name": this.#user_data.user.user.username
                                    },
                                    "candidates": [{
                                        "candidate_id": turn_key,
                                        "raw_content": message
                                    }],
                                    "primary_candidate_id": turn_key
                                }
                            }
                        }
                    },
                    "id": 1
                }), true, 2)
            },

            /**
             * The Character will send message without putting character_id  
             *   
             * Usage example: `await library_name.group_chat.generate_turn()`  
             * 
             * @returns {Promise<group_chat_object>}
            */
            generate_turn: async () => {
                if (!this.#join_type) throw "you must be connected to single chat"
                if (this.#join_type == 2) {
                    return await send_ws(this.#ws[0], JSON.stringify({
                        "rpc": {
                            "method": "unused_command",
                            "data": {
                                "command": "generate_turn",
                                "request_id": generateRandomUUID().slice(0, -12) + this.#current_chat_id.split("-")[4],
                                "payload": {
                                    "chat_type": "TYPE_MU_ROOM",
                                    "chat_id": this.#current_chat_id,
                                    "user_name": this.#user_data.user.user.username,
                                    "smart_reply": "CHARACTERS",
                                    "smart_reply_delay": 0
                                },
                                "origin_id":"Android"
                            }
                        },
                        "id": 1
                    }), true, 2)
                } else "This function only works when you're connected on Group Chat, not Single chat"
            },

            /** 
             * It will regenerate message for Character  
             *   
             * For Example: bot send you: TEXT1  
             * when you execute this function, it will generate and changed to TEXT2  
             * 
             * Usage Example: `await library_name.group_chat.generate_turn_candidate("turn_id", "char_id")`
             * 
             * @param {string} turn_id
             * @param {string} char_id
             * @returns {Promise<group_chat_object>}
            */
            generate_turn_candidate: async(turn_id, char_id) => {
                if (this.#join_type != 2) throw "You're not connected to any Group Chat"
                return await send_ws(this.#ws[0], JSON.stringify({
                    "rpc": {
                        "method": "unused_command",
                        "data": {
                            "command": "generate_turn_candidate",
                            "request_id": generateRandomUUID().slice(0, -12) + this.#current_chat_id.split("-")[4],
                            "payload": {
                                "chat_type": "TYPE_MU_ROOM",
                                "character_id": char_id,
                                "user_name": this.#user_data.user.user.username,
                                "turn_key": {
                                    "turn_id": turn_id,
                                    "chat_id": this.#current_chat_id
                                }
                            }
                        }
                    },
                    "id": 1
                }), true, 2)
            },

            /**
             * It will reset conversation and start to new conversation  
             *   
             * Usage Example: `await library_name.group_chat.reset_conversation()`
             * 
             * @returns {Promise<group_chat_object>}
            */
            reset_conversation: async () => {
                let turn_key = generateRandomUUID()
                return await send_ws(this.#ws[0], JSON.stringify({
                    "rpc": {
                        "method": "unused_command",
                        "data": {
                            "command": "create_turn",
                            "request_id": generateRandomUUID().slice(0, -12) + this.#current_chat_id.split("-")[4],
                            "payload": {
                                "chat_type": "TYPE_MU_ROOM",
                                "num_candidates": 1,
                                "user_name": this.#user_data.user.user.username,
                                "turn": {
                                    "context_reset": true,
                                    "turn_key": {
                                        "turn_id": turn_key,
                                        "chat_id": this.#current_chat_id
                                    },
                                    "author": {
                                        "author_id": `${this.#user_data.user.user.id}`,
                                        "is_human": true,
                                        "name": this.#user_data.user.user.username
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
                }), true, 2)
            },
            
            /**
             * Delete message  
             *   
             * Usage Example (single message): `await library_name.group_chat.delete_message("turn_id")`  
             * Usage Example (multi message): `await library_name.group_chat.delete_message(["turn_id_1", "turn_id_2", ...])`
             * 
             * @param {string|array} turn_id
             * @returns {Promise<boolean>}
            */
            delete_message: async (turn_id) => {
                if (!this.#token) throw "Please login first"
                await send_ws(this.#ws[1], JSON.stringify({
                    "command": "remove_turns",
                    "request_id": generateRandomUUID().slice(0, -12) + this.#current_chat_id.split("-")[4],
                    "payload": {
                        "chat_id": this.#current_chat_id,
                        "turn_ids": Array.isArray(turn_id) ? turn_id : [turn_id]
                    },
                    "origin_id": "Android"
                }), 0, 0)
                return true;
            },

            /**
             * Edit message (you can edit user message or character message)  
             *   
             * Example Usage: `await library_name.group_chat.edit_message("candidate_id", "turn_id", "Edit message")`  
             * 
             * @param {string} candidate_id
             * @param {string} turn_id
             * @param {string} new_message
             * 
             * @returns {Promise<group_chat_edit_message_object>}
            */
            edit_message: async(candidate_id, turn_id, new_message) => {
                let result = await send_ws(this.#ws[0], JSON.stringify({
                    "rpc": {
                        "method": "unused_command",
                        "data": {
                            "command": "edit_turn_candidate",
                            "request_id": generateRandomUUID().slice(0, -12) + this.#current_chat_id.split("-")[4],
                            "payload": {
                                "turn_key": {
                                    "chat_id": this.#current_chat_id,
                                    "turn_id": turn_id
                                },
                                "current_candidate_id": candidate_id,
                                "new_candidate_raw_content": new_message
                            }
                        }
                    },
                    "id": 1
                }), true, 2)

                if (!result.push.pub.data.turn.author.is_human) {
                    await send_ws(this.#ws[1], JSON.stringify({
                        "command": "update_primary_candidate",
                        "payload": {
                            "candidate_id": candidate_id,
                            "turn_key": {
                                "chat_id": this.#current_chat_id,
                                "turn_id": turn_id
                            }
                        },
                        "origin_id": "Android"
                    }), 0, 0)
                }
            },

            /**
             * Select the turn of character chat by yourself  
             *   
             * Example Usage: `library_name.group_chat.select_turn("char_id")`
             * 
             * @param {string} char_id 
             * @returns {group_chat_object}
            */
            select_turn: async (char_id) => {
                if (this.#join_type != 2) throw "You're not connected to any Group Chat"
                return await send_ws(this.#ws[0], JSON.stringify({
                    "rpc": {
                        "method": "unused_command",
                        "data": {
                            "command": "generate_turn",
                            "request_id": generateRandomUUID().slice(0, -12) + this.#current_chat_id.split("-")[4],
                            "payload": {
                                "chat_type": "TYPE_MU_ROOM",
                                "character_id": char_id,
                                "chat_id": this.#current_chat_id
                            }
                        }
                    },
                    "id": 1
                }), true, 2)
            }
        }

        this.chat = {
            /**
             * Get history chat turn from Group/Single Chat  
             *   
             * Warning: If you're already connected from Group/Single Chat, you no need to input chat_id  
             *   
             * Example Usage: `await library_name.chat.history_chat_turns("chat_id")`
             * 
             * @typedef {object} chat_turns_history
             * @property {object[]} turns
             * @property {object} turns.turn_key
             * @property {string} turns.turn_key.chat_id
             * @property {string} turns.turn_key.turn_id
             * @property {string} turns.create_time
             * @property {string} turns.last_update_time
             * @property {string} turns.state
             * @property {object} turns.author
             * @property {string} turns.author.author_id
             * @property {string} turns.author.name
             * @property {object[]} turns.candidates
             * @property {string} turns.candidates.candidate_id
             * @property {string} turns.candidates.create_time
             * @property {string} turns.candidates.raw_content
             * @property {boolean} turns.candidates.is_final
             * @property {string} turns.primary_candidate_id
             * @property {object} turns.candidates.editor
             * @property {string} turns.candidates.editor.author_id
             * @property {string} turns.candidates.editor.name
             * @property {object} meta
             * @property {string} meta.next_token
             * 
             * @param {string} chat_id
             * 
             * @returns {Promise<chat_turns_history>}
            */
            history_chat_turns: async (chat_id) => {
                if (!this.#token) throw "Please login first"
                return !this.#token ? (() => {
                    throw "Please login first"
                })() : await (await https_fetch(`https://neo.character.ai/turns/${chat_id ? chat_id : this.#current_chat_id}/`, "GET", {
                    'Authorization': `Token ${this.#token}`
                })).json()
            },
        }
    }

    /**
     * Login to Character.AI Server using your Character.AI Account Token  
     *   
     * Example Usage  
     * ```js
     * try {
     *      await library_name.login("Your Character.AI Token")
     * } catch(e) {
     *      console.log(e)
     * }
     * ```
     * @param {string} token
     * @returns {Promise<boolean>}
    */
    async login(token) {
        if (!this.#edge_rollout) this.#edge_rollout = (await https_fetch("https://character.ai/", "GET")).headers.getSetCookie()[0].split("; ")[0].split("=")[1]
        this.#user_data = await (await https_fetch("https://plus.character.ai/chat/user/", "GET", {
            'Authorization': `Token ${token}`
        })).json()

        if (!this.#user_data.user.user.id) throw "Not a valid Character AI Token"
        this.#ws[0] = await open_ws("wss://neo.character.ai/connection/websocket", `edge_rollout=${this.#edge_rollout}; HTTP_AUTHORIZATION="Token ${token}"`, this.#user_data.user.user.id, this)
        this.#ws[1] = await open_ws("wss://neo.character.ai/ws/", `edge_rollout=${this.#edge_rollout}; HTTP_AUTHORIZATION="Token ${token}"`, 0, this)
        this.#token = token
        return true;
    }

    /** 
     * Logout from Character.AI Server  
     *   
     * true = it means successfully logout from Character.AI Server  
     * false = it means you are not Connected from Character.AI Server  
     *   
     * Example Code: `await library_name.logout()`
     * @returns {Promise<boolean>}
    */
   async logout() {
        if (!this.#ws[0] && !this.#ws[1]) return false;
        
        if (this.#join_type == 1) this.character.disconnect()
        else if (this.#join_type == 2) this.group_chat.disconnect()
    
        await close_ws(this.#ws[0])
        await close_ws(this.#ws[1])
        this.#ws = []
        this.#token = ""
        this.#user_data = ""
        this.removeAllListeners()
        return true;
    }
}

module.exports = CAINode
