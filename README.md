# CAINode  
A lighweight Unofficial Character.AI API using NodeJS, It does not require a puppeteer to interact with c.ai because the interaction is done with websocket and HTTPS Request.

![GitHub commit activity (branch)](https://img.shields.io/github/commit-activity/t/kevinadhaikal/cainode?logo=github&cacheSeconds=12000&style=for-the-badge) ![GitHub last commit (by committer)](https://img.shields.io/github/last-commit/kevinadhaikal/cainode?style=for-the-badge) ![GitHub repo size](https://img.shields.io/github/repo-size/kevinadhaikal/cainode?logo=github&style=for-the-badge&link=https%3A%2F%2Fgithub.com%2Fkevinadhaikal%2Fcainode) ![GitHub package.json version (branch)](https://img.shields.io/github/package-json/v/kevinadhaikal/cainode/main?style=for-the-badge&logo=github)


## Table of contents
- [Installation](#installation)  
- [Example usage](#example_usage)
- [Client](#client)  
   - [login](#login)  
   - [logout](#logout)  
   - [User](#userinfo)
     - [user.info](#userinfo)
     - [user.settings](#usersettings)
   - [image](#imagegenerate_avatar)
     - [image.generate_avatar](#imagegenerate_avatar)
     - [image.generate_image](#imagegenerate_image)
   - [persona](#personacreate)
     - [persona.create](#personacreate)
     - [persona.set_default](#personaset_default)
     - [persona.list](#personalist)
     - [persona.info](#personainfo)
     - [persona.update](#personaupdate)
     - [persona.delete](#personadelete)
     - [persona.set_character](#personaset_character)
   - [explore](#explorefeatured)
     - [explore.featured](#explorefeatured)
     - [explore.for_you](#explorefor_you)
     - [explore.character_categories](#explorecharacter_categories)
   - [character](#charactervotes)
     - [character.votes](#charactervotes)
     - [character.votes_array](#charactervotes_array)
     - [character.vote](#charactervote)
     - [character.search](#charactersearch)
     - [character.search_suggest](#charactersearch_suggest)
     - [character.info](#characterinfo)
     - [character.recent_list](#characterrecent_list)
     - [character.connect](#characterconnect)
     - [character.disconnect](#characterdisconnect)
     - [character.send_message](#charactersend_message)
     - [character.generate_turn](#charactergenerate_turn)
     - [character.generate_turn_candidate](#charactergenerate_turn_candidate)
     - [character.reset_conversation](#characterreset_conversation)
     - [character.delete_message](#characterdelete_message)
     - [character.edit_message](#characteredit_message)
   - [group_chat](#group_chatlist)
     - [group_chat.list](#group_chatlist)
     - [group_chat.connect](#group_chatconnect)
     - [group_chat.disconnect](#group_chatdisconnect)
     - [group_chat.create](#group_chatcreate)
     - [group_chat.delete](#group_chatdelete)
     - [group_chat.rename](#group_chatrename)
     - [group_chat.join_group_invite](#group_chatjoin_group_invite)
     - [group_chat.char_add](#group_chatchar_add)
     - [group_chat.char_remove](#group_chatchar_remove)
     - [group_chat.send_message](#group_chatsend_message)
     - [group_chat.generate_turn](#group_chatgenerate_turn)
     - [group_chat.generate_turn_candidate](#group_chatgenerate_turn_candidate)
     - [group_chat.reset_conversation](#group_chatreset_conversation)
     - [group_chat.delete_message](#group_chatdelete_message)
     - [group_chat.edit_message](#group_chatedit_message)
     - [group_chat.select_turn](#group_chatselect_turn)
   - [chat](#chathistory-chat_turns)
     - [chat.history_chat_turns](#chathistory_chat_turns)
- [Issues](#issues)

## Installation  
Start installing package using npm by sending this command in your terminal.

```bash
npm install cainode
```

## Example usage  
```js  
// import CAINode from "cainode";  
const CAINode = require("cainode");  
const client = new CAINode();

async function start() {  
  const token = "YOUR_CAI_TOKEN";  
  const login = await client.login(token);  
  if(!login) throw "failed client login!";  
  console.log("Client login:", login);  
  const logout = await client.logout();  
  if(!logout) throw "failed client logout!";  
  console.log("Client logout:", logout);  
}

start();  
```  
[Example Character.AI Group Chat Implementation using Discord](https://github.com/kevinadhaikal/caicord)

## Client  
Import client from module  
```js  
// import CAINode from "cainode";  
const CAINode = require("cainode");

const client = new CAINode();  
```

[Back to Top](#cainode)


## login()
Start client initialization with login, make sure your token is valid so that the login session can run properly.

This is the tutorial of how to get C.AI sessionToken
### On PC:
1. Open the Character.AI website in your browser (https://beta.character.ai)
2. Open the developer tools (<kbd>F12</kbd>, <kbd>Ctrl+Shift+I</kbd>, or <kbd>Cmd+J</kbd>)
3. Go to the `Application` tab
4. Go to the `Storage` section and click on `Local Storage`
5. Look for the `char_token` key
6. Open the object, right click on value and copy your session token.

![Session_Token](https://github.com/realcoloride/node_characterai/assets/108619637/1d46db04-0744-42d2-a6d7-35152b967a82)

### On Mobile:

1. Open the Character.AI website in your browser (https://beta.character.ai)
2. Open the URL bar, write `javascript:` (case sensitive) and paste the following:
```javascript
(function(){let e=window.localStorage["char_token"];if(!e){alert("You need to log in first!");return;}let t=JSON.parse(e).value;document.documentElement.innerHTML=`<div><i><p>provided by node_characterai - <a href="https://github.com/realcoloride/node_characterai?tab=readme-ov-file#using-an-access-token">click here for more information</a></p></i><p>Here is your session token:</p><input value="${t}" readonly><p><strong>Do not share this with anyone unless you know what you are doing! Those are your personal session token. If stolen or requested by someone you don't trust, they could access your account without your consent; if so, please close the page immediately.</strong></p><button id="copy" onclick="navigator.clipboard.writeText('${t}'); alert('Copied to clipboard!')">Copy session token to clipboard</button><button onclick="window.location.reload();">Refresh the page</button></div>`;localStorageKey=null;storageInformation=null;t=null;})();
```
3. The following page should appear:
![Access_Token_Mobile](https://github.com/realcoloride/node_characterai/assets/108619637/516722db-a90f-4dd0-987e-fda01e68ac09)
4. Click the respective buttons to copy your access token or id token to your clipboard.



```js  
await client.login("YOUR_CHARACTER_AI_TOKEN");  
```  
| Param | Require | Type | Description |  
| --- | --- | --- | --- |  
| Token | `true` | `String` | Your character ai token used for client login. |

[Back to Top](#cainode)


## logout()
Logout from the client

```js
await client.logout();
```
| Param | Require | Type | Description |  
| --- | --- | --- | --- |  
| none | `false` | `null` | Used for client logout from character ai. |

[Back to Top](#cainode)


## user.info()
Get your account information data.

```js
client.user.info;
```
| Param | Require | Type | Description |  
| --- | --- | --- | --- |  
| none | `false` | `null` | Get user information account. |

[Back to Top](#cainode)


## user.settings()
Get your account settings information data.

```js
await client.user.settings();
```
| Param | Require | Type | Description | 
| --- | --- | --- | --- | 
| none | `false` | `null` | Get user settings information. |

[Back to Top](#cainode)


## image.generate_avatar()
Generate avatar image using prompt.

```js
await client.image.generate_avatar(prompt_name);
```
| Param | Require | Type | Description |  
| --- | --- | --- | --- |  
| prompt_name | `true` | `String` | Prompt used for generating avatar image. |

[Back to Top](#cainode)


## image.generate_image()
Generate image using prompt.

```js
await client.image.generate_image(prompt_name);
```
| Param | Require | Type | Description |  
| --- | --- | --- | --- |  
| prompt_name | `true` | `String` | Prompt used for generating AI image. |

[Back to Top](#cainode)


## persona.create()
Create your personality for your character.

```js
await client.persona.create(name, description);
```
| Param | Require | Type | Description | 
| --- | --- | --- | --- | 
|  name  | `true` | `String` | Your persona name |
| description | `true` | `String` | Description of your personality, this section is used to describe yourself so that your AI character knows who you are. |

[Back to Top](#cainode)


## persona.set_default()
Set your default personality specifically.

```js
await client.persona.set_default(external_persona_id);
```
| Param | Require | Type | Description | 
| --- | --- | --- | --- | 
| external_persona_id | `true` | `String` | External personality id that you have. |

[Back to Top](#cainode)


## persona.list()
Get all your personality data.

```js
await client.persona.list();
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| none | `false` | `null` | Get all your personality data. |

[Back to Top](#cainode)


## persona.info()
Get your personality information.

```js
await client.persona.info(external_persona_id);
```
| Param | Require | Type | Description | 
| --- | --- | --- | --- | 
| external_persona_id | `true` | `String` | External personality id that you have. |

[Back to Top](#cainode)


## persona.update()
Update your personality specifically.

```js
await client.persona.update(external_persona_id, name, description);
```
| Param | Require | Type | Description | 
| --- | --- | --- | --- | 
| external_persona_id | `true` | `String` | External personality id that you have. |
| name | `true` | `String` | Your new personality name. |
| description | `true` | `String` | Your new personality detail. |

[Back to Top](#cainode)


## persona.delete()
Used for deleting your personality spesifically.

```js
await client.persona.delete(external_persona_id);
```
| Param | Require | Type | Description | 
| --- | --- | --- | --- | 
| external_persona_id | `true` | `String` | External personality id that you have. |

[Back to Top](#cainode)


## persona.set_character()
Set a custom personality for your character specifically.

```js
await client.persona.set_character(character_id, external_persona_id);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| character_id | `true` | `String` | A character id that you want to set a custom personality. |
| external_persona_id | `true` | `String` | Your personality id that you use to let AI characters know who you are. |

[Back to Top](#cainode)


## explore.featured()
Get the list of characters displayed by the character.ai server.

```js
await client.explore.featured();
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| none | `false` | `null` | Get all featured data. |

[Back to Top](#cainode)


## explore.for_you()
Get a list of characters recommended by the character.ai server.

```js
await client.explore.for_you();
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| none | `false` | `null` | Get all for you data. |

[Back to Top](#cainode)


## explore.character_categories()
Get the list of characters from the character category exploration.

```js
await client.explore.character_categories();
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| none | `false` | `null` | Get all character categories data. |

[Back to Top](#cainode)


## character.votes()
Get character vote information.

```js
await client.character.votes(character_id);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| character_id | `true` | `String` | The character id you are aiming for. |

[Back to Top](#cainode)


## character.votes_array()
Get character vote information in array.

```js
await client.character.votes_array(character_id);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| character_id | `true` | `String` | The character id you are aiming for. |

[Back to Top](#cainode)


## character.vote()
Used for vote the character.

```js
await client.character.vote(character_id, vote);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| character_id | `true` | `String` | The character id you are aiming for. |
| vote | `true` | `Boolean` | Character vote options, `true = like`, `false = dislike`, and `null = cancel` |

[Back to Top](#cainode)


## character.search()
Search for a character by name or query.

```js
await client.character.search(name);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| name | `true` | `String` | Search queries to find characters. |

[Back to Top](#cainode)


## character.search_suggest()
Search character by name and suggested by Character.AI Server

```js
await client.character.search_suggest(name);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| name | `true` | `String` | Character name query. |

[Back to Top](#cainode)


## character.info()
Get detailed information about characters.

```js
await client.character.info(character_id);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| character_id | `true` | `String` | Your character id. |

[Back to Top](#cainode)


## character.recent_list()
Get a list of recent chat activity

```js
await client.character.recent_list();
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| none | `false` | `null` | Get recent character chats. |

[Back to Top](#cainode)


## character.connect()
Connect client to character chat

```js
await client.character.connect(character_id);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| character_id | `true` | `String` | Your character id. |

[Back to Top](#cainode)


## character.disconnect()
Disconnecting client from character chat

```js
await client.character.disconnect();
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| none | `false` | `null` | Disconnecting client from character chat. |

[Back to Top](#cainode)


## character.send_message()
Send message to character.

```js
await client.character.send_message(message, manual_turn, image_url);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| message | `true` | `String` | Message content. |
| manual_turn | `false` | `Boolean` | If the value of `manual_turn` is set to `true` then the message that the client receives must be generated with `character.generate_turn()` so that the message is obtained by the client. |
| image_url | `false` | `String` | The image content that the character will see, must be a url and not a file type or a file with a type other than image. |

[Back to Top](#cainode)


## character.generate_turn()
Generating message response from character.

```js
await client.character.generate_turn();
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| none | `false` | `null` | Generate message response |

[Back to Top](#cainode)


## character.generate_turn_candidate()
Regenerate character message.

```js
await client.character.generate_turn_candidate(turn_id);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| turn_id | `true` | `String` | `turn_id` or `message_id` from the character. |

[Back to Top](#cainode)


## character.reset_conversation()
Reset the conversation between you and the character.

```js
await client.character.reset_conversation();
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| none | `false` | `null` | none |

[Back to Top](#cainode)


## character.delete_message()
Delete character message.

```js
await client.character.delete_message(turn_id);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| turn_id | `true` | `String` | `turn_id` or `message_id` from the character. |

[Back to Top](#cainode)


## character.edit_message()
Edit the character message.

```js
await client.character.edit_message(candidate_id, turn_id, new_message);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| candidate_id | `true` | `String` | 
| turn_id | `true` | `String` | `turn_id` or `message_id` from the character. |
| new_message | `true` | `String` | New character message |

[Back to Top](#cainode)



## group_chat.list()
Get all list available group chat in account.

```js
await client.group_chat.list();
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| none | `false` | `null` | none |

[Back to Top](#cainode)


## group_chat.connect()
Connecting to group chat by the `room_id`, btw you can't connect the group chat before you create it.

```js
await client.group_chat.connect(room_id);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| room_id | `true` | `String` | Your group chat id. |

[Back to Top](#cainode)


## group_chat.disconnect()
Disconnecting from group chat by the `room_id`.

```js
await client.group_chat.disconnect(room_id);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| room_id | `true` | `String` | Your group chat id. |

[Back to Top](#cainode)


## group_chat.create()
Create a custom room chat.

```js
await client.group_chat.create(title_room, character_id);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| title_room | `true` | `String` | Your custom title room name. |
| character_id | `true` | `String` | Your character id will be added to the group chat. |

[Back to Top](#cainode)


## group_chat.delete()
Delete group chat.

```js
await client.group_chat.delete(room_id);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| room_id | `true` | `String` | Your group chat id. |

[Back to Top](#cainode)


## group_chat.rename()
Rename group chat.

```js
await client.group_chat.rename(new_name, room_id);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| new_name | `true` | `String` | New name for your group chat. |
| room_id | `true` | `String` | Your group chat id. |

[Back to Top](#cainode)


## group_chat.join_group_invite()
Joining group chat using invite code.

```js
await client.group_chat.join_group_invite(invite_code);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| invite_code | `true` | `String` | The group chat miinvite code. |

[Back to Top](#cainode)


## group_chat.char_add()
Add a character with `character_id` to the group chat.

```js
await client.group_chat.char_add(character_id);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| character_id | `true` | `String` | Character id to be added to the group chat. |

[Back to Top](#cainode)


## group_chat.char_remove()
Remove a character with `character_id` from the group chat.

```js
await client.group_chat.char_remove(character_id);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| character_id | `true` | `String` | Character id to be removed from the group chat. |

[Back to Top](#cainode)


## group_chat.send_message()
Send message to character in group chat.

```js
await client.character.send_message(message, image_url);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| message | `true` | `String` | Message content. |
| image_url | `false` | `String` | The image content that the character will see, must be a url and not a file type or a file with a type other than image. |

[Back to Top](#cainode)


## group_chat.generate_turn()
Generating message response character from group chat.

```js
await client.group_chat.generate_turn();
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| none | `false` | `null` | Generate message response |

[Back to Top](#cainode)


## group_chat.generate_turn_candidate()
Regenerate character message.

```js
await client.group_chat.generate_turn_candidate(turn_id);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| turn_id | `true` | `String` | `turn_id` or `message_id` from the character. |

[Back to Top](#cainode)


## group_chat.reset_conversation()
Reset conversation in group chat.

```js
await client.group_chat.reset_conversation();
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| none | `false` | `null` | Reset conversation. |

[Back to Top](#cainode)


## group_chat.delete_message()
Delete character message.

```js
await client.group_chat.delete_message(turn_id);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| turn_id | `true` | `String` | `turn_id` or `message_id` from the character. |

[Back to Top](#cainode)


## group_chat.edit_message()
Edit character message in group chat.

```js
await client.group_chat.edit_message(candidate_id, turn_id, new_message);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| candidate_id | `true` | `String` | 
| turn_id | `true` | `String` | `turn_id` or `message_id` from the character. |
| new_message | `true` | `String` | New character message |

[Back to Top](#cainode)


## group_chat.select_turn()
Select the turn of character chat by yourself.

```js
await client.group_chat.select_turn(turn_id);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| turn_id | `true` | `String` | `turn_id` or `message_id` from the character. |

[Back to Top](#cainode)


## chat.history_chat_turns()
Get a history chat from group or single chat.

```js
await client.chat.history_chat_turns(chat_id);
```
| Param | Require | Type | Description |
| --- | --- | --- | --- | 
| chat_id | `true` | `String` | Group chat or single chat ID. |

[Back to Top](#cainode)



# Issues
Feel free to open the issue, I hope this documentation can help you maximally and make it easier for you to use this package.

> *Documentation written by [ZTRdiamond](https://github.com/ZTRdiamond)*
