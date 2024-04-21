const https = require("https")
const WebSocket = require("ws")
const events = require('events');

function https_fetch(url, path, method, headers, body) {
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

function open_ws(url, cookie, using_ping, userid) {
    return new Promise((resolve, reject) => {
        let ws_con = new WebSocket(url, {
            headers: {
                Cookie: cookie
            }
        })
        if (using_ping) {
            ws_con.on('message', async function (message) {
                message = message.toString()
                if (message === "{}") ws_con.send("{}")
            });
        }
        ws_con.once('open', function() {
            if (userid) ws_con.send(`{"connect":{"name":"js"},"id":1}{"subscribe":{"channel":"user#${userid}"},"id":1}`)
            resolve(ws_con)
        })
    });
}

function send_ws(ws_con, data, is_once) {
    return new Promise((resolve, reject) => {
        ws_con.send(data)
        if (is_once) ws_con.once("message", (message) => resolve(message.toString()))
        else {
            ws_con.on("message", (message) => {
                message = message.toString()
                console.log(JSON.parse(message))
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

class CAINode {
    constructor() {
        this.ws = []
        this.token = "";
        this.user_data = "";
        this.current_chat_id = "";
        this.join_type = 0;
    }
    async login(token) {
        this.user_data = JSON.parse(await https_fetch("plus.character.ai", "/chat/user/", "GET", {'Authorization': `Token ${token}`}));
        if (!this.user_data.user.user.id) throw "Not a valid Character AI Token"
        
        this.ws[0] = await open_ws("wss://neo.character.ai/connection/websocket", `edge_rollout=27; HTTP_AUTHORIZATION="Token ${token}"`, true, this.user_data.user.user.id)
        this.ws[1] = await open_ws("wss://neo.character.ai/ws/", `edge_rollout=27; HTTP_AUTHORIZATION="Token ${token}"`)
        this.token = token
        return 1;
    }
    async room_list() {
        if (!this.token) throw "Please login first"
        return JSON.parse(await https_fetch("neo.character.ai", "/murooms/?include_turns=false", "GET", {'Authorization': `Token ${this.token}`}))
    }
    async chat(message) {
        if (this.join_type == 1) {
        } else if (this.join_type == 2) {
            let turn_key = generateRandomUUID()
            return await JSON.parse(send_ws(this.ws[0], JSON.stringify({
                "rpc": {
                    "method": "unused_command",
                    "data": {
                        "command": "create_turn",
                        "request_id": generateRandomUUID().slice(0, -12) + current_group_id.split("-")[4],
                        "payload": {
                            "chat_type": "TYPE_MU_ROOM",
                            "num_candidates": 1,
                            "user_name": user_data.user.user.username,
                            "turn": {
                                "turn_key": {
                                    "turn_id": turn_key,
                                    "chat_id": this.current_chat_id
                                },
                                "author": {
                                    "author_id": `${user_data.user.user.id}`,
                                    "is_human": true,
                                    "name": user_data.user.user.username
                                },
                                "candidates": [
                                    {
                                        "candidate_id": turn_key,
                                        "raw_content": message
                                    }
                                ],
                                "primary_candidate_id": turn_key
                            }
                        }
                    }
                },
                "id": 1
            }), 1))
        } else return 0;
    }
    async random_turn() {
        if (this.join_type != 2) return 0;
        return JSON.parse(await send_ws(this.ws[0], JSON.stringify({
            "rpc":{
                "method":"unused_command","data":{
                    "command":"generate_turn",
                    "request_id":generateRandomUUID().slice(0, -12) + this.current_chat_id.split("-")[4],
                    "payload":{
                        "chat_type":"TYPE_MU_ROOM",
                        "chat_id":this.current_chat_id,
                        "user_name":this.user_data.user.user.username,
                        "smart_reply":"CHARACTERS",
                        "smart_reply_delay":0
                    }
                }
            },
            "id":1
        }), 0))
    }
    async join_existing_room(id) {
        if (!this.token) throw "Please login first"
        const res = JSON.parse(await send_ws(this.ws[0], `{"subscribe":{"channel":"room:${id}"},"id":1}`, 1))
        if (res.error) return 0;
        this.current_chat_id = id;
        this.join_type = 2;
        return res;
    }
    async disconnect_room() {
        if (this.join_type) {
            const res = JSON.parse(await send_ws(this.ws[0], `{"unsubscribe":{"channel":"room:${this.current_chat_id}"},"id":1}`, 1))
            this.join_type = 0;
            this.current_chat_id = "";
            return res;
        } else return 0;
    }
    async load_history_chat(chat_id) {
        return JSON.parse(await https_fetch("neo.character.ai", `/turns/${chat_id ? chat_id : this.current_chat_id}/`, "GET", {'Authorization': `Token ${this.token}`}))
    }
    async logout() {
        if (!this.ws[0] && !this.ws[1]) return 0;
        await close_ws(this.ws[0])
        await close_ws(this.ws[1])
        this.ws = []
        this.token = ""
        this.user_data = ""
        return 1;
    }
}

module.exports = CAINode
