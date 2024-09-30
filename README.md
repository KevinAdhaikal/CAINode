# CAINode  
A lighweight Unofficial Character.AI API in Node/Deno/Bun JS, It does not require a puppeteer to interact with c.ai because the interaction is conducted with websocket and HTTPS Request (fetch).<br><br>
CAINode is now using ESM. Please read at [Getting Started](#getting-started) first before using CAINode.<br><br>
![GitHub commit activity (branch)](https://img.shields.io/github/commit-activity/t/kevinadhaikal/cainode?logo=github&cacheSeconds=12000&style=for-the-badge) ![GitHub last commit (by committer)](https://img.shields.io/github/last-commit/kevinadhaikal/cainode?style=for-the-badge) ![GitHub repo size](https://img.shields.io/github/repo-size/kevinadhaikal/cainode?logo=github&style=for-the-badge&link=https%3A%2F%2Fgithub.com%2Fkevinadhaikal%2Fcainode) ![GitHub package.json version (branch)](https://img.shields.io/github/package-json/v/kevinadhaikal/cainode/main?style=for-the-badge&logo=github)

# Features
- Lightweight library (WebSocket and Fetch)
- Easy to use
- Almost all Character.AI Support
  - Voice Call
  - Single/Group chat
  - Image Generate
  - User
  - Persona
  - Explore list

# Table of contents
- [Getting Started](#getting-started)
   - [Install](#install)
   - [Example Usage](#example-usage)
- [Main Function List](#main-function-list)
   - [login](#login)
   - [generate_token](#generate_token)
   - [logout](#logout)
- [User Function List](#user-function-list)
   - [user.info](#userinfo)
   - [user.change_info](#userchange_info)
   - [user.settings](#usersettings)
   - [user.public_following_list](#userpublic_following_list)
   - [user.public_followers_list](#userpublic_followers_list)
   - [user.following_list_name](#userfollowing_list_name)
   - [user.followers_list_name](#userfollowers_list_name)
   - [user.follow](#userfollow)
   - [user.unfollow](#userunfollow)
- [Image Function List](#image-function-list)
   - [image.generate_avatar](#imagegenerate_avatar)
   - [image.generate_image](#imagegenerate_image)
- [Persona Function List](#persona-function-list)
   - [persona.create](#personacreate)
   - [persona.set_default](#personaset_default)
   - [persona.list](#personalist)
   - [persona.info](#personainfo)
   - [persona.update](#personaupdate)
   - [persona.delete](#personadelete)
   - [persona.set_character](#personaset_character)
- [Explore Function List](#explore-function-list)
   - [explore.featured](#explorefeatured)
   - [explore.for_you](#explorefor_you)
   - [explore.character_categories](#explorecharacter_categories)
- [Character Function list](#character-function-list)
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
   - [character.create_new_conversation](#charactercreate_new_conversation)
   - [character.delete_message](#characterdelete_message)
   - [character.edit_message](#characteredit_message)
   - [character.replay_tts](#characterreplay_tts)
   - [character.current_voice](#charactercurrent_voice)
- [Group Chat Function List](#group-chat-function-list)
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
- [Chat Function List](#chat-function-list)
   - [chat.history_chat_turns](#chathistory_chat_turns)
   - [chat.conversation_info](#chatconversation_info)
   - [chat.history_conversation_list](#chathistory_conversation_list)
   - [chat.set_conversation_chat](#chatset_conversation_chat)
   - [chat.pin_message](#chatpin_message)
   - [chat.list_pinned_message](#chatlist_pinned_message)
   - [chat.archive_conversation](#chatarchive_conversation)
   - [chat.duplicate_conversation](#chatduplicate_conversation)
   - [chat.rename_conversation](#chatrename_conversation)
- [Voice Function List](#voice-function-list)
   - [voice.user_created_list](#voiceuser_created_list)
   - [voice.info](#voiceinfo)
   - [voice.search](#voicesearch)
   - [voice.connect](#voiceconnect)
   - [voice.disconnect](#voicedisconnect)
- [Issues](#issues)

# Getting Started
## Install
To install CAINode, you can simply do
- using NPM (Node Package Manager)<br><br>
   ```
   npm install -g cainode
   ```
- Using Deno<br><br>
   ```ts
   import CAINode from "npm:cainode@latest";
   ```
- Using Bun.JS<br><br>
   ```
   bun install cainode
   ```
[Back to the Table of contents](#table-of-contents)
## Example usage
- CommonJS<br><br>
   ```js
   (async function() {
       const client = new (await import("cainode")).CAINode();
       await client.login("Your token");
       console.log("Logged in!");
       await client.logout();
   })()
   ```
- TypeScript/ESM<br><br>
   ```ts
   import {CAINode} from "cainode"
   // import {CAINode} from "npm:cainode@latest"; for Deno
   
   const client = new CAINode();
   
   await client.login("Your token");
   console.log("Logged in!");
   await client.logout();
   ```
[Back to the Table of contents](#table-of-contents)

# Main Function List
- ## login()
   Start client initialization with login, make sure your token is valid so that the login session can run properly.

   To get Character.AI Session Token, You can use [generate_token()](#generate_token) function.

   ```js
   await client.login("YOUR_CHARACTER_AI_TOKEN");  
   ```  
   | Param | Require | Type | Description |  
   | --- | --- | --- | --- |  
   | Token | `true` | `string` | Your Character.AI token used for client login. |

   [Back to the Table of contents](#table-of-contents)
- ## generate_token()
   Generate your Character.AI Token by email.

   - Without timeout
      ```js
      await client.generate_token("your@email.com", 0);
      ```

   - With timeout (per 2 seconds)
      ```js
      await client.generate_token("your@email.com", 30); // and it will end in 60 seconds.
      ```

   - With callback
      ```js
      await client.generate_token("your@email.com", 30, function() {
         console.log("Please check your email.")
      }, function() {
         console.log("Time is up! Please try again later.")
      });
      ```

   | Param | Require | Type | Description |  
   | --- | --- | --- | --- |  
   | email | `true` | `string` | Your email to send a verification link. |
   | timeout_per_2s | `false` | `number` | Max waiting for verification. (default = 30) |
   | mail_sent_cb | `false` | `Function` | Callback when the mail was sent to the target. |
   | timeout_cb | `false` | `Function` | Callback when the timeout was reached. |

   [Back to the Table of contents](#table-of-contents)

- ## logout()
   Logout from the client.

   ```js
   await client.logout();
   ```
   | Param | Require | Type | Description |  
   | --- | --- | --- | --- |  
   | none | `false` | `null` | Used for client logout from character ai. |

   [Back to the Table of contents](#table-of-contents)

# User Function List
- ## user.info()
   Get current information account.

   ```js
   console.log(client.user.info);
   ```
   | Param | Require | Type | Description |  
   | --- | --- | --- | --- |  
   | none | `false` | `null` | Get user information account. |

   [Back to the Table of contents](#table-of-contents)

- ## user.public_info()
   Get user public information account.

   ```js
   await client.user.public_info();
   ```
   | Param | Require | Type | Description |  
   | --- | --- | --- | --- |  
   | username | `false` | `string` | Target Character.AI username account. (default = null, and it will target to your own account.) |

   [Back to the Table of contents](#table-of-contents)


- ## user.change_info()
   Change current information account.

   ```js
   await client.user.change_info();
   ```
   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | username | `false` | `string` | Change your old username to new username. |
   | name | `false` | `string` | Change your old name to new name. |
   | avatar_rel_path | `false` | `string` | Change your old avatar_rel_path link to new avatar_rel_path link.<br><br><b>Warning</b>: avatar_rel_path image link <b>must be generated/uploaded</b> to Character.AI server. |
   | bio | `false` | `string` | Change your old bio to new bio. |

   [Back to the Table of contents](#table-of-contents)


- ## user.settings()
   Get account settings information data.

   ```js
   await client.user.settings();
   ```

   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | none | `false` | `null` | Get user settings information. |

   [Back to the Table of contents](#table-of-contents)


- ## user.public_following_list()
   Get public user following list.

   ```js
   await client.user.public_following_list();
   ```
   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | username | `true` | `string` | Target Character.AI username account. |
   | page_param | `false` | `number` | Page parameter. |

   [Back to the Table of contents](#table-of-contents)


- ## user.public_followers_list()
   Get public user followers list.

   ```js
   await client.user.public_followers_list();
   ```
   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | username | `true` | `string` | Target Character.AI username account. |
   | page_param | `false` | `number` | Page parameter. |

   [Back to the Table of contents](#table-of-contents)


- ## user.following_list_name()
   Get account following name list.

   ```js
   await client.user.following_list_name();
   ```
   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | none | `false` | `null` | Get account following name list. |

   [Back to the Table of contents](#table-of-contents)


- ## user.followers_list_name()
   Get account followers name list.

   ```js
   await client.user.followers_list_name();
   ```
   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | none | `false` | `null` | Get account followers name list. |

   [Back to the Table of contents](#table-of-contents)


- ## user.follow()
   Follow user account.

   ```js
   await client.user.follow();
   ```
   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | username | `true` | `string` | Target Character.AI username account. |

   [Back to the Table of contents](#table-of-contents)

- ## user.unfollow()
   Unfollow user account.

   ```js
   await client.user.unfollow();
   ```
   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | username | `true` | `string` | Target Character.AI username account. |

   [Back to the Table of contents](#table-of-contents)
# Image Function List
- ## image.generate_avatar()
   Generate avatar image using prompt.

   ```js
   await client.image.generate_avatar(prompt_name);
   ```
   | Param | Require | Type | Description |  
   | --- | --- | --- | --- |  
   | prompt_name | `true` | `String` | Prompt used for generating avatar image. |

   [Back to the Table of contents](#table-of-contents)

- ## image.generate_image()
   Generate image using prompt.

   ```js
   await client.image.generate_image(prompt_name);
   ```
   | Param | Require | Type | Description |  
   | --- | --- | --- | --- |  
   | prompt_name | `true` | `String` | Prompt used for generating AI image. |

   [Back to the Table of contents](#table-of-contents)

# Persona Function List
- ## persona.create()
   Create your personality for your character.

   ```js
   await client.persona.create(name, description);
   ```
   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   |  name  | `true` | `String` | Your persona name |
   | description | `true` | `String` | Description of your personality, this section is used to describe yourself so that your AI character knows who you are. |

   [Back to the Table of contents](#table-of-contents)

- ## persona.set_default()
   Set your default personality specifically.

   ```js
   await client.persona.set_default(external_persona_id);
   ```
   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | external_persona_id | `true` | `String` | External personality id that you have. |

   [Back to the Table of contents](#table-of-contents)

- ## persona.list()
   Get all your personality data.

   ```js
   await client.persona.list();
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | Get all your personality data. |

   [Back to the Table of contents](#table-of-contents)


- ## persona.info()
   Get your personality information.

   ```js
   await client.persona.info(external_persona_id);
   ```
   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | external_persona_id | `true` | `String` | External personality id that you have. |

   [Back to the Table of contents](#table-of-contents)


- ## persona.update()
   Update your personality specifically.

   ```js
   await client.persona.update(external_persona_id, name, description);
   ```
   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | external_persona_id | `true` | `String` | External personality id that you have. |
   | name | `true` | `String` | Your new personality name. |
   | description | `true` | `String` | Your new personality detail. |

   [Back to the Table of contents](#table-of-contents)


- ## persona.delete()
   Used for deleting your personality spesifically.

   ```js
   await client.persona.delete(external_persona_id);
   ```
   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | external_persona_id | `true` | `String` | External personality id that you have. |

   [Back to the Table of contents](#table-of-contents)

- ## persona.set_character()
   Set a custom personality for your character specifically.

   ```js
   await client.persona.set_character(character_id, external_persona_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | character_id | `true` | `String` | A character id that you want to set a custom personality. |
   | external_persona_id | `true` | `String` | Your personality id that you use to let AI characters know who you are. |

   [Back to the Table of contents](#table-of-contents)

# Explore Function List
- ## explore.featured()
   Get the list of characters displayed by the character.ai server.

   ```js
   await client.explore.featured();
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | Get all featured data. |

   [Back to the Table of contents](#table-of-contents)

- ## explore.for_you()
   Get a list of characters recommended by the character.ai server.

   ```js
   await client.explore.for_you();
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | Get all for you data. |

   [Back to the Table of contents](#table-of-contents)


- ## explore.character_categories()
   Get the list of characters from the character category exploration.

   ```js
   await client.explore.character_categories();
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | Get all character categories data. |

   [Back to the Table of contents](#table-of-contents)

# Character Function List
- ## character.votes()
   Get character vote information.

   ```js
   await client.character.votes(character_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | character_id | `true` | `String` | The character id you are aiming for. |

   [Back to the Table of contents](#table-of-contents)


- ## character.votes_array()
   Get character vote information in array.

   ```js
   await client.character.votes_array(character_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | character_id | `true` | `String` | The character id you are aiming for. |

   [Back to the Table of contents](#table-of-contents)


- ## character.vote()
   Used for vote the character.

   ```js
   await client.character.vote(character_id, vote);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | character_id | `true` | `String` | The character id you are aiming for. |
   | vote | `true` | `Boolean` | Character vote options, `true = like`, `false = dislike`, and `null = cancel` |

   [Back to the Table of contents](#table-of-contents)


- ## character.search()
   Search for a character by name or query.

   ```js
   await client.character.search(name);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | name | `true` | `String` | Search queries to find characters. |

   [Back to the Table of contents](#table-of-contents)


- ## character.search_suggest()
   Search character by name and suggested by Character.AI Server

   ```js
   await client.character.search_suggest(name);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | name | `true` | `String` | Character name query. |

   [Back to the Table of contents](#table-of-contents)


- ## character.info()
   Get detailed information about characters.

   ```js
   await client.character.info(character_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | character_id | `true` | `String` | Your character id. |

   [Back to the Table of contents](#table-of-contents)


- ## character.recent_list()
   Get a list of recent chat activity

   ```js
   await client.character.recent_list();
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | Get recent character chats. |

   [Back to the Table of contents](#table-of-contents)


- ## character.connect()
   Connect client to character chat

   ```js
   await client.character.connect(character_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | character_id | `true` | `String` | Your character id. |

   [Back to the Table of contents](#table-of-contents)


- ## character.disconnect()
   Disconnecting client from character chat

   ```js
   await client.character.disconnect();
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | Disconnecting client from character chat. |

   [Back to the Table of contents](#table-of-contents)


- ## character.send_message()
   Send message to character.

   ```js
   await client.character.send_message(message, manual_turn, image_url);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | message | `true` | `String` | Message content. |
   | manual_turn | `false` | `Boolean` | If the value of `manual_turn` is set to `true` then the message that the client receives must be generated with `character.generate_turn()` so that the message is obtained by the client. |
   | image_url | `false` | `String` | The image content that the character will see, must be a url and not a file type or a file with a type other than image. |

   [Back to the Table of contents](#table-of-contents)

- ## character.generate_turn()
   Generating message response from character.

   ```js
   await client.character.generate_turn();
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | Generate message response |

   [Back to the Table of contents](#table-of-contents)

- ## character.generate_turn_candidate()
   Regenerate character message.

   ```js
   await client.character.generate_turn_candidate(turn_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | turn_id | `true` | `String` | `turn_id` or `message_id` from the character. |

   [Back to the Table of contents](#table-of-contents)

- ## character.create_new_conversation()
   it will create a new conversation and your current conversation will save on the history.

   - With greeting
      ```js
      await client.character.create_new_conversation();
      ```
   - Without greeting
      ```js
      await client.character.create_new_conversation(false);
      ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | with_greeting | `false` | `Boolean` | The character will send you a greeting when you create a new conversation. (Default = true) |

   [Back to the Table of contents](#table-of-contents)

- ## character.delete_message()
   Delete character message.

   ```js
   await client.character.delete_message(turn_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | turn_id | `true` | `String` | `turn_id` or `message_id` from the character. |

   [Back to the Table of contents](#table-of-contents)


- ## character.edit_message()
   Edit the character message.

   ```js
   await client.character.edit_message(candidate_id, turn_id, new_message);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | candidate_id | `true` | `String` | 
   | turn_id | `true` | `String` | `turn_id` or `message_id` from the character. |
   | new_message | `true` | `String` | New character message |

   [Back to the Table of contents](#table-of-contents)

- ## character.replay_tts()
   Generate text messages from character to voice audio.

   - if you have Voice ID
      ```js
      await client.character.replay_tts("Turn ID", "Candidate ID", "fill the Voice Character ID here")
      ```
   - if you don't have Voice ID and want to use Voice Query instead
      ```js
      await client.character.replay_tts("Turn ID", "Candidate ID", "Sonic the Hedgehog", true)
      ```
   
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | turn_id | `true` | `String` | `turn_id` from the character. |
   | candidate_id | `true` | `String` | `candidate_id` from the character. |
   | voice_id_or_query | `true` | `String` | Input Voice character ID or you can use Voice Query. |
   | using_query | `false` | `Boolean` | Using Query (if You're using Voice Query, then set this parameter to `true`.) |

   [Back to the Table of contents](#table-of-contents)

- ## character.current_voice()
   Get character current voice info.

   - Auto (you must already connected with character)
      ```js
      await client.character.current_voice()
      ```
   - Manual
      ```js
      await client.character.current_voice("Character ID")
      ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | character_id | `true` | `String` | Target of Character ID. |

   [Back to the Table of contents](#table-of-contents)

# Group Chat Function List
- ## group_chat.list()
   Get all list available group chat in account.

   ```js
   await client.group_chat.list();
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | none |

   [Back to the Table of contents](#table-of-contents)


- ## group_chat.connect()
   Connecting to group chat by the `room_id`, btw you can't connect the group chat before you create it.

   ```js
   await client.group_chat.connect(room_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | room_id | `true` | `String` | Your group chat id. |

   [Back to the Table of contents](#table-of-contents)


- ## group_chat.disconnect()
   Disconnecting from group chat by the `room_id`.

   ```js
   await client.group_chat.disconnect(room_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | room_id | `true` | `String` | Your group chat id. |

   [Back to the Table of contents](#table-of-contents)


- ## group_chat.create()
   Create a custom room chat.

   ```js
   await client.group_chat.create(title_room, character_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | title_room | `true` | `String` | Your custom title room name. |
   | character_id | `true` | `String` | Your character id will be added to the group chat. |

   [Back to the Table of contents](#table-of-contents)


- ## group_chat.delete()
   Delete group chat.

   ```js
   await client.group_chat.delete(room_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | room_id | `true` | `String` | Your group chat id. |

   [Back to the Table of contents](#table-of-contents)


- ## group_chat.rename()
   Rename group chat.

   ```js
   await client.group_chat.rename(new_name, room_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | new_name | `true` | `String` | New name for your group chat. |
   | room_id | `true` | `String` | Your group chat id. |

   [Back to the Table of contents](#table-of-contents)

- ## group_chat.join_group_invite()
   Joining group chat using invite code.

   ```js
   await client.group_chat.join_group_invite(invite_code);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | invite_code | `true` | `String` | The group chat miinvite code. |

   [Back to the Table of contents](#table-of-contents)

- ## group_chat.char_add()
   Add a character with `character_id` to the group chat.

   ```js
   await client.group_chat.char_add(character_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | character_id | `true` | `String` | Character id to be added to the group chat. |

   [Back to the Table of contents](#table-of-contents)

- ## group_chat.char_remove()
   Remove a character with `character_id` from the group chat.

   ```js
   await client.group_chat.char_remove(character_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | character_id | `true` | `String` | Character id to be removed from the group chat. |

   [Back to the Table of contents](#table-of-contents)

- ## group_chat.send_message()
   Send message to character in group chat.

   ```js
   await client.group_chat.send_message(message, image_url);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | message | `true` | `String` | Message content. |
   | image_url | `false` | `String` | The image content that the character will see, must be a url and not a file type or a file with a type other than image. |

   [Back to the Table of contents](#table-of-contents)

- ## group_chat.generate_turn()
   Generating message response character from group chat.

   ```js
   await client.group_chat.generate_turn();
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | Generate message response |

   [Back to the Table of contents](#table-of-contents)

- ## group_chat.generate_turn_candidate()
   Regenerate character message.

   ```js
   await client.group_chat.generate_turn_candidate(turn_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | turn_id | `true` | `String` | `turn_id` or `message_id` from the character. |

   [Back to the Table of contents](#table-of-contents)

- ## group_chat.reset_conversation()
   Reset conversation in group chat.

   ```js
   await client.group_chat.reset_conversation();
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | Reset conversation. |

   [Back to the Table of contents](#table-of-contents)

- ## group_chat.delete_message()
   Delete character message.

   ```js
   await client.group_chat.delete_message(turn_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | turn_id | `true` | `String` | `turn_id` or `message_id` from the character. |

   [Back to the Table of contents](#table-of-contents)

- ## group_chat.edit_message()
   Edit character message in group chat.

   ```js
   await client.group_chat.edit_message(candidate_id, turn_id, new_message);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | candidate_id | `true` | `String` | 
   | turn_id | `true` | `String` | `turn_id` or `message_id` from the character. |
   | new_message | `true` | `String` | New character message |

   [Back to the Table of contents](#table-of-contents)

- ## group_chat.select_turn()
   Select the turn of character chat by yourself.

   ```js
   await client.group_chat.select_turn(turn_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | turn_id | `true` | `String` | `turn_id` or `message_id` from the character. |

   [Back to the Table of contents](#table-of-contents)

# Chat Function List
- ## chat.history_chat_turns()
   Get a history chat from group or single chat.

   ```js
   await client.chat.history_chat_turns(chat_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | chat_id | `true` | `String` | Group chat or single chat ID. |

   [Back to the Table of contents](#table-of-contents)

- ## chat.conversation_info()
   Get converastion information.

   ```js
   await client.chat.conversation_info(chat_id);
   ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | chat_id | `true` | `String` | Group chat ID or single chat ID. |
   
   [Back to the Table of contents](#table-of-contents)

- ## chat.history_conversation_list()
   Get list of your history conversation from character. This function is for Single character only.

   - Auto (Already connected to the Single character chat)
      ```js
      await client.chat.history_conversation_list()
      ```
   - Manual
      ```js
      await client.chat.history_conversation_list("Character ID") 
      ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | character_id | `false` | `String` | Target of Character ID. |

   [Back to the Table of contents](#table-of-contents)

- ## chat.set_conversation_chat()
   Set conversation chat, and bring the history chat into current chat. This function is for Single character only.

   ```js
   await client.chat.set_conversation_chat(chat_id)
   ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | chat_id | `true` | `String` | single chat ID. |

   [Back to the Table of contents](#table-of-contents)

- ## chat.pin_message()
   Pin message. This function is for Single character only.

   - Auto (if your're already connected to the single character)
      ```js
      await client.chat.pin_message("Turn ID")
      ```
   - Manual
      ```js
      await client.chat.pin_message("Turn ID", true, "Chat ID")
      ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | turn_id | `true` | `String` | Turn ID Message. |
   | pinned | `false` | `Boolean` | Set the message pinned or not. (set `true` if you want to pin the message, set `false` if you want to unpin the message.) |
   | chat_id | `false` | `String` | Chat ID Message. (Set the Chat ID if you not connected to the Single character.) |

   [Back to the Table of contents](#table-of-contents)

- ## chat.list_pinned_message()
   Get list pinned message from chat. This function works only for single character chat.

   ```js
   await client.chat.list_pinned_message("Chat ID")
   ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | chat_id | `true` | `String` | Chat ID Message. |

   [Back to the Table of contents](#table-of-contents)

- ## chat.archive_conversation()
   Archive your conversation. This function works only for single character chat.

   - If you want archive the conversation
      ```js
      await client.chat.archive_conversation("Chat ID", true)
      ```
   - If you want unarchive the conversation
      ```js
      await client.chat.archive_conversation("Chat ID", false)
      ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | chat_id | `true` | `String` | Chat ID message that you want to archive. |
   | set_archive | `false` | `Boolean` | Set Archive (to archive the Conversation, you can set it to `true`. If you want to unarchive the Converastion, you can set it to `false`.) |

   [Back to the Table of contents](#table-of-contents)

- ## chat.duplicate_conversation()
   Duplicate your conversation. This function works only for single character chat.

   ```js
   await client.chat.duplicate_conversation("Chat ID", "Turn ID")
   ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | chat_id | `true` | `String` | Chat ID message that you want to duplicate. |
   | turn_id | `true` | `String` | Turn ID message that you want to duplicate. |

   [Back to the Table of contents](#table-of-contents)

- ## chat.rename_conversation()
   Rename your conversation title. This function works only for single character chat.

   ```js
   await client.chat.rename_conversation("Chat ID", "Custom Name")
   ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | chat_id | `true` | `String` | Chat ID message that you want to rename. |
   | name | `true` | `String` | Name that you want to rename. |

   [Back to the Table of contents](#table-of-contents)

# Voice Function List
- ## voice.user_created_list()
   Get list of user created voice information.  

   - Get your own created voice list
      ```js
      await client.voice.user_list()
      ```
   - Get user created voice list
      ```js
      await client.voice.user_list("username")
      ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | username | `false` | `String` | A username that wants you to check the created voice list. |
   
   [Back to the Table of contents](#table-of-contents)

- ## voice.info()
   Get a voice information.

   ```js
   await client.voice.info("Voice ID")
   ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | voice_id | `true` | `String` | A Voice ID that wants you to check the voice information. |
   
   [Back to the Table of contents](#table-of-contents)

- ## voice.connect()
   <b>WARNING: This feature only supports Single character chat, not Group chat.</b>

   Connect to voice character chat, and this function works only for single character chat.

   - Using Query
      ```js
      await client.voice.connect("Query", true)
      ```
   - Using Voice ID
      ```js
      await client.voice.connec("Voice ID")
      ```

   Example to use
   - Without microphone
      ```js
      const Speaker = require("speaker"); // import Speaker from "speaker"
      const speaker = new Speaker({
            channels: 1,          // 1 channel
            bitDepth: 16,         // 16-bit samples
            sampleRate: 48000     // 48,000 Hz sample rate
      });
      
      await client.character.connect("Character ID");
      let test = await client.voice.connect("Sonic The Hedgehog", true);

      console.log("Character voice ready!");

      test.output.on("frameReceived", ev => {
            speaker.write(Buffer.from(ev.frame.data.buffer)); // PCM buffer write into speaker and you'll hear the sound.
      });

      await client.character.generate_turn(); // Test is voice character is working or not.
      ```
   
   - With microphone (Voice call)
      ```js
      const Speaker = require("speaker"); // import Speaker from "speaker"
      const { spawn } = require('child_process'); // import { spawn } from "child_process".
      //for microphone, I'll using sox. so Ineed child_process
      
      const speaker = new Speaker({
            channels: 1,          // 1 channel
            bitDepth: 16,         // 16-bit samples
            sampleRate: 48000     // 48,000 Hz sample rate
      });
      
      const recordMic = spawn('sox', [
            '-q',
            '-t', 'waveaudio', '-d', // Input windows audio (add '-d' if you want set default)
            '-r', '48000',           // Sample rate: 48 kHz
            '-e', 'signed-integer',  // Encoding: signed PCM
            '-b', '16',              // Bit depth: 16-bit
            '-c', '1',               // Channel: 1 (mono)
            '-t', 'raw',             // Output format: raw PCM
            '-'                      // stdout
      ]);
      
      let test = await client.voice.connect("Sonic The Hedgehog", true, true);

      console.log("Voice call ready!");

      test.output.on("frameReceived", ev => {
            speaker.write(Buffer.from(ev.frame.data.buffer)); // PCM buffer write into speaker and you'll hear the sound.
      });
      
      recordMic.stdout.on("data", data => {
            if (test.is_speech(data)) test.input_write(data); // Mic PCM Buffer output send it to Livekit server.
      });
      ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | voice_query_or_id | `true` | `String` | Target Voice query or Voice ID. |
   | using_voice_query | `false` | `Boolean` | Using Voice Query (set it to true if `voice_query_or_id` using Voice Query) |
   | using_mic | `false` | `Boolean` | Using Microphone (You can talk to the Character using Microphone. Livekit needed.) |
   | mic_opt | `false` | `{framerate: number, channel: number}` | Mic options. Default = `{framerate: 48000, channel: 1}` |

   [Back to the Table of contents](#table-of-contents)

- ## voice.disconnect()
   <b>WARNING: This feature only supports Single character chat, not Group chat.</b>

   Disconnect from voice character chat.

   ```js
   await client.voice.disconnect()
   ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | Disconnect from voice character chat. |

   [Back to the Table of contents](#table-of-contents)

# Issues
Feel free to open the issue, I hope this documentation can help you maximally and make it easier for you to use this package.

> *Thanks to [ZTRdiamond](https://github.com/ZTRdiamond) for helping me making a documentation.*
