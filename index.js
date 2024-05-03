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

function open_ws(url, cookie, using_ping, userid, this_class) {
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
        if (using_ping) {
            ws_con.on('message', async function(message) {
                message = message.toString()
                if (message === "{}") ws_con.send("{}")
                else this_class.emit("message", message)
            });
        }
    });
}

function send_ws(ws_con, data, is_once, using_json, wait_json_prop_type) {
    return new Promise((resolve, reject) => {
        if (is_once) ws_con.once("message", (message) => {
            resolve(using_json ? JSON.parse(message.toString()) : message.toString())
        })
        else {
            function ws_con_handler(message) {
                message = using_json ? JSON.parse(message.toString()) : message.toString()
                if (using_json && wait_json_prop_type) {
                    try {
                        switch(wait_json_prop_type) {
                            case 1: {
                                if (!message.turn.author.is_human && message.turn.candidates[0].is_final) {
                                    ws_con.removeListener("message", ws_con_handler);
                                    resolve(message)
                                }
                                break;
                            }
                            case 2: {
                                if (message["push"].pub.data.turn.candidates[0].is_final) {
                                    ws_con.removeListener("message", ws_con_handler);
                                    resolve(message)
                                }
                                break;
                            }
                        }
                    }
                    catch(e) {}
                }
            }
            ws_con.on("message", (message) => ws_con_handler(message))
        }
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

        /**
         * - info(): Get user information Account
         * - setting(): Get chat User setting
         */
        this.user = {
            /**
             * Get user information Account  
             *   
             * Example code `console.log(library_name.user.info())`
             * 
             * @typedef {Object} user
             * @property {Object} user
             * @property {string} user.username
             * @property {number} user.id
             * @property {string} user.first_name
             * @property {Object} user.account
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

            /**
             * Get chat User setting  
             *   
             * Example code `console.log(await library_name.user.setting())`
             * 
             * @returns object
            */
            setting: async () => {
                return !this.#token ? (() => {
                    throw "Please login first"
                })() : await (await https_fetch("https://beta.character.ai/chat/user/settings/", "GET", {
                    'Authorization': `Token ${this.#token}`
                })).json()
            }
        }

        this.character = {
            /**
             * Search character by name
             *   
             * Example code `console.log(await library_name.character.search("Character Name"))`
             * @param {string} name
             * 
             * @typedef {Object} char1
             * @property {Object[]} characters[]
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
             * @typedef {Object} char2
             * @property {Object[]} characters[]
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
             * @typedef {Object} char3
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
             * @property {Array} character.songs
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
             * @typedef {Object} char_list
             * @property {Object[]} chats[]
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
             * @property {Object} chats[].character_translations
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
             * it will return chat_id
             * 
             * @param {string} char_id
             * @returns {Promise<string>}
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

                return res.chats[0].chat_id;
            },
            /**
             * Disconnect from Single Character Chat
             *   
             * Example usage: `await library_name.character.disconnect()`
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
            }
        }

        this.group_chat = {
            /**
             * Get group chat List
             *   
             * Example usage: `console.log(await library_name.group_chat.list())`
             * 
             * @typedef {Object} room
             * 
             * @property {Object[]} rooms[]
             * @property {string} rooms[].id
             * @property {string} rooms[].title
             * @property {string} rooms[].description
             * @property {string} rooms[].visibility
             * @property {string} rooms[].picture
             * 
             * @property {Object[]} rooms[].characters[]
             * @property {string} rooms[].characters[].id
             * @property {string} rooms[].characters[].name
             * @property {string} rooms[].characters[].avatar_url
             * 
             * @property {Object[]} rooms[].users[]
             * @property {string} rooms[].users[].id
             * @property {string} rooms[].users[].username
             * @property {string} rooms[].users[].name
             * @property {string} rooms[].users[].avatar_url
             * @property {string} rooms[].users[].role
             * @property {string} rooms[].users[].state
             * 
             * @property {Array} rooms[].permissions
             * 
             * @property {Object} rooms[].preview_turns
             * @property {Array} rooms[].preview_turns.turns
             * @property {Object} rooms[].preview_turns.meta
             * @property {string} rooms[].preview_turns.meta.next_token
             * 
             * @property {Object} rooms[].settings
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
             * @typedef {Object} connect_info_group_chat
             * 
             * @property {number} id
             * @property {Object} subscribe
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

                const res = await send_ws(this.#ws[0], `{"subscribe":{"channel":"room:${room_id}"},"id":1}`, 1, 1)
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
             * @typedef {Object} disconnect_info_group_chat
             * 
             * @property {number} id
             * @property {Object} unsubscribe
             * 
             * @returns {Promise<disconnect_info_group_chat>}
            */
            disconnect: async () => {
                if (!this.#token) throw "Please login first"
                if (this.#join_type != 2) throw "You're not connected to any Group Chat"
                const res = await send_ws(this.#ws[0], `{"unsubscribe":{"channel":"room:${this.#current_chat_id}"},"id":1}`, 1, 1)

                this.#join_type = 0;
                this.#current_chat_id = "";
                return res;
            },

            /**
             * Create group chat
             *   
             * Example usage (Single Character): `await library_name.group_chat.create("Group Name", "Character ID")`  
             * Example usage (Multi Character): `await library_name.group_chat.create("Group Name", ["Character ID 1", "Character ID 2", ...])`
             * @typedef {Object} create_group_chat
             * @property {string} id
             * @property {string} title
             * @property {string} description
             * @property {string} visibility
             * @property {string} picture
             * @property {number} last_updated
             * 
             * @property {Object[]} characters[]
             * @property {string} characters[].id
             * @property {string} characters[].name
             * @property {string} characters[].avatar_url
             * 
             * @property {Object[]} users[]
             * @property {string} users[].id
             * @property {string} users[].username
             * @property {string} users[].name
             * @property {string} users[].avatar_url
             * @property {string} users[].role
             * @property {string} users[].state
             * 
             * @property {Array} permissions
             * 
             * @property {Object} preview_turns
             * 
             * @property {Object[]} preview_turns.turns[]
             * 
             * @property {Object} preview_turns.turns[].turn_key
             * @property {string} preview_turns.turns[].turn_key.chat_id
             * @property {string} preview_turns.turns[].turn_key.turn_id
             * 
             * @property {string} preview_turns.turns[].create_time
             * @property {string} preview_turns.turns[].last_update_time
             * @property {string} preview_turns.turns[].state
             * 
             * @property {Object} preview_turns.turns[].author
             * @property {string} preview_turns.turns[].author.author_id
             * @property {string} preview_turns.turns[].author.name
             * 
             * @property {Object[]} preview_turns.turns[].candidates[]
             * @property {string} preview_turns.turns[].candidates[].candidate_id
             * @property {string} preview_turns.turns[].candidates[].create_time
             * @property {string} preview_turns.turns[].candidates[].raw_content
             * 
             * @property {Object} preview_turns.turns[].candidates[].editor
             * @property {string} preview_turns.turns[].candidates[].editor.author_id
             * @property {string} preview_turns.turns[].candidates[].editor.name
             * 
             * @property {boolean} preview_turns.turns[].candidates[].is_final
             * 
             * @property {string} preview_turns.turns[].primary_candidate_id
             * 
             * @property {Object} preview_turns.meta
             * @property {string} preview_turns.meta.next_token
             * 
             * @property {Object} settings
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
             * Delete group chat
             *   
             * Example usage: `await library_name.group_chat.delete("room_id")`
             * 
             * @typedef {Object} delete_group_chat
             * @property {string} id
             * @property {string} command
             * 
             * @param {string} room_id
             * 
             * @returns {Promise<delete_group_chat>}
            */
            delete: async (room_id) => {
                if (!this.#token) throw "Please login first"
                if (this.#join_type == 2) await send_ws(this.#ws[0], `{"unsubscribe":{"channel":"room:${this.#current_chat_id}"},"id":1}`, true)
                return await (await https_fetch(`https://neo.character.ai/muroom/${this.#join_type == 2 ? this.#current_chat_id : room_id}/`, "DELETE", {'Authorization': `Token ${this.#token}`})).json()
            },

            /**
             * Rename group chat
             *   
             * If you're already connected from Target Group, you no need to input room_id  
             * Example usage: `await library_name.group_chat.rename("new group name", "room_id")`
             * 
             * @typedef {Object} rename_group_chat
             * @property {string} id
             * 
             * @property {Object} users
             * @property {Array} users.added
             * @property {Array} users.removed
             * 
             * @property {Object} characters
             * @property {Array} characters.added
             * @property {Array} characters.removed
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
            join_group_invite: async(invite_code) => {
                if (!this.#token) throw "Please login first"
                await https_fetch(`https://neo.character.ai/muroom/?join_token=${invite_code}`, "GET", {'Authorization': `Token ${this.#token}`})
                return await (await https_fetch("https://neo.character.ai/muroom/join", "POST", {'Authorization': `Token ${this.#token}`}, `{"join_token":"${invite_code}"}`)).json()
            },
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
            }
        }

        this.chat = {
            history_chat_turns: async (chat_id) => {
                if (!this.#token) throw "Please login first"
                return !this.#token ? (() => {
                    throw "Please login first"
                })() : await (await https_fetch(`https://neo.character.ai/turns/${chat_id ? chat_id : this.#current_chat_id}/`, "GET", {
                    'Authorization': `Token ${this.#token}`
                })).json()
            },
            generate_turn: async () => {
                switch (this.#join_type) {
                    case 1: {
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
                        }), 0, 1, 1)
                    }
                    case 2: {
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
                                    }
                                }
                            },
                            "id": 1
                        }), 0, 1, 2)
                        break;
                    }
                    default: {
                        throw "You're not connected any Group/Single chat"
                    }
                }
            },
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
                }), 0, 1, 2)
            },
            selected_turn: async (char_id) => {
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
                }), 0, 1, 2)
            },
            send: async (message, manual_turn) => {
                if (!this.#token) throw "Please login first"
                let turn_key = this.#join_type ? generateRandomUUID() : ""
                switch (this.#join_type) {
                    case 1: {
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
                        }), manual_turn, 1, Number(!manual_turn))
                    }
                    case 2: {
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
                        }), 1, 1)
                    }
                    default: throw "You're not connected any Group/Single chat"
                }
            },
            reset_conversation: async () => {
                if (!this.#token) throw "Please login first"
                let turn_key = generateRandomUUID()
                switch(this.#join_type) {
                    case 1: {
                        return await send_ws(this.#ws[1], {
                            "command": "create_chat",
                            "request_id": generateRandomUUID().slice(0, -12) + this.#current_char_id_chat.slice(this.#current_char_id_chat.length - 12),
                            "payload": {
                                "chat": {
                                    "chat_id": this.#current_chat_id,
                                    "creator_id": `${this.#user_data.user.user.id}`,
                                    "visibility": "VISIBILITY_PRIVATE",
                                    "character_id": this.#current_char_id_chat,
                                    "type": "TYPE_ONE_ON_ONE"
                                },
                                "with_greeting": true
                            },
                            "origin_id": "Android"
                        })
                    }
                    case 2: {
                        return await send_ws(this.#ws[0], {
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
                        }, true, 1)
                    }
                    default: throw "You're not connected any Group/Single chat"
                }
            },
            delete: async (turn_id) => {
                if (!this.#token) throw "Please login first"
                return await send_ws(this.#ws[1], JSON.stringify({
                    "command": "remove_turns",
                    "request_id": generateRandomUUID().slice(0, -12) + this.#current_char_id_chat ? this.#current_char_id_chat.slice(this.#current_char_id_chat.length - 12) : this.#current_chat_id.split("-")[4],
                    "payload": {
                        "chat_id": this.#current_chat_id,
                        "turn_ids": Array.isArray(turn_id) ? turn_id : [turn_id]
                    },
                    "origin_id": "Android"
                }), 1, 1)
            },
            edit: async(candidate_id, turn_id, new_message) => {
                if (!this.#token) throw "Please login first"
                let result = await send_ws(this.#ws[1], JSON.stringify({
                    "command": "edit_turn_candidate",
                    "request_id": generateRandomUUID().slice(0, -12) + this.#current_char_id_chat ? this.#current_char_id_chat.slice(this.#current_char_id_chat.length - 12) : this.#current_chat_id.split("-")[4],
                    "payload": {
                        "turn_key": {
                            "chat_id": this.#current_chat_id,
                            "turn_id": turn_id
                        },
                        "current_candidate_id": candidate_id,
                        "new_candidate_raw_content": new_message
                    },
                    "origin_id": "Android"
                }), 1, 1)

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
                    }), 1, 1)
                }
                return result;
            }
        }
    }

    /**
     * Login to Character.AI Server using your Character.AI Account Token  
     *   
     * Example code  
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
        this.#ws[0] = await open_ws("wss://neo.character.ai/connection/websocket", `edge_rollout=${this.#edge_rollout}; HTTP_AUTHORIZATION="Token ${token}"`, true, this.#user_data.user.user.id, this)
        this.#ws[1] = await open_ws("wss://neo.character.ai/ws/", `edge_rollout=${this.#edge_rollout}; HTTP_AUTHORIZATION="Token ${token}"`, 0, 0, this)
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
        else if (this.#join_type == 2) this.room.disconnect()
    
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
