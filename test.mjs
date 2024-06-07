import CAINode from "./index.js";
const cai = new CAINode();

const token = "47bb5206a46f5eff2fccbb2cf75bd6b191b3d578"
const zeta = "HyUaN7rxKaZeiLlqOtSGo-3wNhdBc54MA-TiQbj-l3M"

async function start() {
  cai.login(token).then(async res => {
    if(!res) throw "failed client login!";
    console.log("Client login:", res)
    console.log("Group list:", await cai.group_chat.list())
    // chat 
    const room = await cai.group_chat.create(`${Math.random().toString(36).substr(1, 18)}`, zeta)
    console.log("Create room:", room)
    console.log("Connect room:", await cai.group_chat.connect(room.id))
    console.log("Send msg:", await cai.group_chat.send_message("halo sayang"));
    console.log("Receive msg:", JSON.stringify(await cai.group_chat.generate_turn(), null, 2))
    console.log("Disconnect room:", await cai.group_chat.disconnect());
    console.log("Delete room:", await cai.group_chat.delete(room.id))
    
    console.log("Client logout:", await cai.logout())
  })
}

start()