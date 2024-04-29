const https = require("https")
const WebSocket = require("ws")
const events = require('events');

function https_fetch(url, path, method, headers, body, get_headers) {
    if (body) headers["Content-Length"] = body.length
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: url,
            path: path,
            method: method,
            headers: {
                'User-Agent': 'Character.AI/1.8.6 (React Native; Android)',
                'DNT': '1',
                'Sec-GPC': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'TE': 'trailers',
                ...headers
            },
        }, (res) => {
            if (get_headers) resolve(res.headers)
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        });
        if (body) req.write(body)
        req.end();
    });
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
        ws_con.send(data)
        if (is_once) ws_con.once("message", (message) => {
            resolve(using_json ? JSON.parse(message.toString()) : message.toString())
        })
        else {
            ws_con.on("message", (message) => {
                message = using_json ? JSON.parse(message.toString()) : message.toString()
                if (using_json && wait_json_prop_type) {
                    try {
                        switch(wait_json_prop_type) {
                            case 1: {
                                if (!message.turn.author.is_human && message.turn.candidates[0].is_final) resolve(message)
                                break;
                            }
                        }
                    }
                    catch(e) {}
                }
            })
        }
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
            info: () => {
                return !this.#token ? (() => {
                    throw "Please login first"
                })() : this.#user_data
            },
            setting: async () => {
                return !this.#token ? (() => {
                    throw "Please login first"
                })() : JSON.parse(await https_fetch("beta.character.ai", "/chat/user/settings/", "GET", {
                    'Authorization': `Token ${this.#token}`
                }))
            }
        }

        this.character = {
            search: async (name) => {
                return !this.#token ? (() => {
                    throw "Please login first"
                })() : JSON.parse(await https_fetch("beta.character.ai", `/chat/characters/search/?query=${name}`, "GET", {
                    'Authorization': `Token ${this.#token}`
                }))
            },
            serach_suggest: async (name) => {
                return !this.#token ? (() => {
                    throw "Please login first"
                })() : JSON.parse(await https_fetch("beta.character.ai", `/chat/characters/suggest/?query=${name}`, "GET", {
                    'Authorization': `Token ${this.#token}`
                }))
            },
            info: async (char_extern_id) => {
                return !this.#token ? (() => {
                    throw "Please login first"
                })() : JSON.parse(await https_fetch("beta.character.ai", "/chat/character/info/", "POST", {
                    'Authorization': `Token ${this.#token}`,
                    "Content-Type": "application/json"
                }, JSON.stringify({
                    "external_id": char_extern_id
                })))
            },
            info_neo: async (char_extern_id) => {
                return !this.#token ? (() => {
                    throw "Please login first"
                })() : JSON.parse(await https_fetch("neo.character.ai", `/chats/recent/${char_extern_id}`, "GET", {
                    'Authorization': `Token ${this.#token}`
                }))
            },
            recent_list: async () => {
                return !this.#token ? (() => {
                    throw "Please login first"
                })() : JSON.parse(await https_fetch("neo.character.ai", "/chats/recent/", "GET", {
                    'Authorization': `Token ${this.#token}`
                }))
            },
            connect: async (char_id) => {
                if (!this.#token) throw "Please login first"
                if (this.#join_type == 2) throw "You're already connectetd in Group Chat, please disconnect first"

                let res = await JSON.parse(await https_fetch("neo.character.ai", `/chats/recent/${char_id}`, "GET", {
                    'Authorization': `Token ${this.#token}`
                }))
                await https_fetch("neo.character.ai", `/chat/${res.chats[0].chat_id}/resurrect`, "GET", {
                    'Authorization': `Token ${this.#token}`
                });

                this.#join_type = 1;
                this.#current_char_id_chat = char_id
                this.#current_chat_id = res.chats[0].chat_id

                return res.chats[0].chat_id;
            },
            disconnect: async () => {
                if (!this.#token) throw "Please login first"
                if (!this.#join_type) throw "You're not connected from Single character Chat"
                if (this.#join_type == 2) throw "You're connectetd in Group Chat, not Single Character Chat"

                this.#current_chat_id = "";
                this.#current_char_id_chat = "";
                this.#join_type = 0;
                return 1;
            }
        }

        this.room = {
            list: async () => {
                if (!this.#token) throw "Please login first"
                return JSON.parse(await https_fetch("neo.character.ai", "/murooms/?include_turns=false", "GET", {
                    'Authorization': `Token ${this.#token}`
                }))
            },
            connect: async (room_id) => {
                if (!this.#token) throw "Please login first"
                if (this.#join_type == 2) throw "You are already connected from the room"

                const res = await send_ws(this.#ws[0], `{"subscribe":{"channel":"room:${room_id}"},"id":1}`, 1, 1)
                if (res.error) return 0;
                this.#current_chat_id = room_id;
                this.#join_type = 2;
                return res;
            },
            disconnect: async () => {
                if (!this.#token) throw "Please login first"
                if (this.#join_type != 2) throw "You are not connected to any room"
                const res = await send_ws(this.#ws[0], `{"unsubscribe":{"channel":"room:${this.#current_chat_id}"},"id":1}`, 1, 1)

                this.#join_type = 0;
                this.#current_chat_id = "";
                return res;
            },
            create: async(title_room, char_id) => {
                if (!this.#token) throw "Please login first"
                return await https_fetch("", "", "POST", {'Authorization': `Token ${this.#token}`}, JSON.stringify({
                    "characters": Array.isArray(char_id) ? char_id : [char_id],
                    "title": title_room,
                    "settings": {
                        "anyone_can_join": true,
                        "require_approval": false
                    },
                    "visibility": "VISIBILITY_UNLISTED",
                    "with_greeting": true
                }))
            },
            delete: async (room_id) => {
                if (!this.#token) throw "Please login first"
                await https_fetch("neo.character.ai", `/muroom/${this.#join_type == 2 ? this.#current_chat_id : room_id}/`, "DELETE", {'Authorization': `Token ${this.#token}`})
                if (this.#join_type == 2) await send_ws(this.#ws[0], `{"unsubscribe":{"channel":"room:${this.#current_chat_id}"},"id":1}`, true)
                return 1;
            },
            rename: async (name, room_id) => {
                if (!this.#token) throw "Pleae login first"
                return JSON.parse(await https_fetch("neo.character.ai", `/muroom/${this.#join_type == 2 ? this.#current_chat_id : room_id}/`, "PATCH", {'Authorization': `Token ${this.#token}`}, JSON.stringify([
                    {
                        "op": "replace",
                        "path": `/muroom/${this.#join_type == 2 ? this.#current_chat_id : room_id}`,
                        "value": {
                            "title": `${name}`
                        }
                    }
                ])))
            },
            join_group_invite: async(invite_link) => {
                if (!this.#token) throw "Please login first"
                await https_fetch("neo.character.ai", `/muroom/?join_token=${invite_link}`, "GET", {'Authorization': `Token ${this.#token}`})
                return JSON.parse(await https_fetch("neo.character.ai", `/muroom/join`, "POST", {'Authorization': `Token ${this.#token}`}, `{"join_token":"${invite_link}"}`))
            },
            char_add: async (char_id) => {
                if (!this.#token) throw "Please login first"
                if (this.#join_type != 2) throw "Please join group first"
                if (Array.isArray(char_id)) {
                    return JSON.parse(await https_fetch("neo.character.ai", `/muroom/${this.#current_chat_id}/`, "PATCH", {
                        'Authorization': `Token ${this.#token}`
                    }, JSON.stringify(char_id.map(id => {
                        return {
                            "op": "add",
                            "path": `/muroom/${this.#current_chat_id}/characters`,
                            "value": {
                                "id": id
                            }
                        };
                    }))))
                } else {
                    return JSON.parse(await https_fetch("neo.character.ai", `/muroom/${this.#current_chat_id}/`, "PATCH", {
                        'Authorization': `Token ${this.#token}`
                    }, JSON.stringify([{
                        "op": "add",
                        "path": `/muroom/${this.#current_chat_id}/characters`,
                        "value": {
                            "id": char_id
                        }
                    }])))
                }
            },
            char_remove: async (char_id) => {
                if (!this.#token) throw "Please login first"
                if (this.#join_type != 2) throw "Please join group first"
                if (Array.isArray(char_id)) {
                    return JSON.parse(await https_fetch("neo.character.ai", `/muroom/${this.#current_chat_id}/`, "PATCH", {
                        'Authorization': `Token ${this.#token}`
                    }, JSON.stringify(char_id.map(id => {
                        return {
                            "op": "remove",
                            "path": `/muroom/${this.#current_chat_id}/characters`,
                            "value": {
                                "id": id
                            }
                        };
                    }))))
                } else {
                    return JSON.parse(await https_fetch("neo.character.ai", `/muroom/${this.#current_chat_id}/`, "PATCH", {
                        'Authorization': `Token ${this.#token}`
                    }, JSON.stringify([{
                        "op": "remove",
                        "path": `/muroom/${this.#current_chat_id}/characters`,
                        "value": {
                            "id": char_id
                        }
                    }])))
                }
            }
        }

        this.chat = {
            history_chat_turns: async (chat_id) => {
                if (!this.#token) throw "Please login first"
                return !this.#token ? (() => {
                    throw "Please login first"
                })() : JSON.parse(await https_fetch("neo.character.ai", `/turns/${chat_id ? chat_id : this.#current_chat_id}/`, "GET", {
                    'Authorization': `Token ${this.#token}`
                }))
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
                        }), 0, 1, 1)
                        break;
                    }
                    default: {
                        throw "You're not connected any Group/Single chat"
                    }
                }
            },
            selected_turn: async (char_id) => {
                if (this.#join_type != 2) throw "You're not join at Group Chat"
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
                }), 0, 1)
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

    async login(token) {
        if (!this.#edge_rollout) this.#edge_rollout = `${(await https_fetch("character.ai", "/", "GET", "", "", 1))["set-cookie"][0].split("; ")[0].split("=")[1]}`
        this.#user_data = JSON.parse(await https_fetch("plus.character.ai", "/chat/user/", "GET", {
            'Authorization': `Token ${token}`
        }));
        if (!this.#user_data.user.user.id) throw "Not a valid Character AI Token"

        this.#ws[0] = await open_ws("wss://neo.character.ai/connection/websocket", `edge_rollout=${this.#edge_rollout}; HTTP_AUTHORIZATION="Token ${token}"`, true, this.#user_data.user.user.id, this)
        this.#ws[1] = await open_ws("wss://neo.character.ai/ws/", `edge_rollout=${this.#edge_rollout}; HTTP_AUTHORIZATION="Token ${token}"`, 0, 0, this)
        this.#token = token
        return 1;
    }
    async logout() {
        if (!this.#ws[0] && !this.#ws[1]) return 0;
        await close_ws(this.#ws[0])
        await close_ws(this.#ws[1])
        this.#ws = []
        this.#token = ""
        this.#user_data = ""
        this.removeAllListeners()
        return 1;
    }
}

module.exports = CAINode