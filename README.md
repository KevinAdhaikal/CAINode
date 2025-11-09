# CAINode  
**The Lightweight Unofficial Character.AI API for Node.js / Deno / Bun**

Access Character.AI via pure JavaScript – **no Puppeteer**, **no browser automation**, just WebSocket + HTTPS.  
Built for developers who want to **chat with Character.AI programmatically** using modern JavaScript runtimes (Node, Deno, Bun).

> ⭐️ Easy-to-use API | 🔥 Lightweight & Fast | 💬 Supports Streaming & History | 🧠 Designed for Bots, CLI & Automation

---

[![NPM Version](https://img.shields.io/npm/v/cainode?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/cainode)
[![GitHub Stars](https://img.shields.io/github/stars/kevinadhaikal/cainode?style=for-the-badge&logo=github)](https://github.com/kevinadhaikal/cainode)
[![GitHub Repo Size](https://img.shields.io/github/repo-size/kevinadhaikal/cainode?style=for-the-badge&logo=github)](https://github.com/kevinadhaikal/cainode)
[![Last Commit](https://img.shields.io/github/last-commit/kevinadhaikal/cainode?style=for-the-badge&logo=git)](https://github.com/kevinadhaikal/cainode)
[![Commit Activity](https://img.shields.io/github/commit-activity/t/kevinadhaikal/cainode?style=for-the-badge&logo=github)](https://github.com/kevinadhaikal/cainode)

---

## 🚀 Features
CAINode supports nearly **all Character.AI features** – designed for both simple and advanced use cases:

### ⚙️ Core Features
- ✅ **Lightweight** – No Puppeteer, no headless browser. Uses native WebSocket + Fetch
- ✅ **Cross-runtime** – Works with **Node.js**, **Deno**, and **Bun**
- ✅ **Fully Async** – Promise-based, easy integration
- ✅ **Streaming Chat Support** – Typing-style responses, streamed token by token

### 💬 Chat Support
- 🧠 **Single Chat** – Chat with any character
- 👥 **Group Chat** – Chat with multiple characters in one conversation
- 📝 **Chat History** – Fetch previous messages with metadata
- 🎤 **Voice Call Support** – Full support for voice interactions with characters

### 🧩 Character & User Control
- 🔍 **Search Characters** – Explore, get trending, featured, or searched characters
- 👤 **User Profiles** – Fetch profile data, persona, and more
- 🧠 **Persona Management** – Edit and apply custom persona to your characters

### 🖼️ Media & Generation
- 🖼️ **Image Generation** – Send prompts, receive image replies
- 🎨 **Image Uploading Support** – Upload image to use in messages

---

### 💥 Bonus
- ⚡ **Blazingly Fast** – Low latency communication via WebSocket
- 📚 **Typed (with JSDoc)** – Great autocomplete in editors like VSCode

# Table of contents
- [Getting Started](#getting-started)
   - [Install](#install) - How to Install CAINode Library.
   - [Example Usage](#example-usage) - Example Usage to using CAINode Library.
- [Main Function List](#main-function-list)
   - [login](#login) - Start client initialization with login.
   - [generate_token_auto](#generate_token_auto) - Generate your Character.AI Token by email. and you will get the token by just pressing the button when you receive the email.
   - [ping](#ping) - Pings the Character AI server's health check endpoint.
   - [logout](#logout) - Logout from the Character.AI.
- [User Function List](#user-function-list)
   - [user.info](#userinfo) - Get current information account.
   - [user.change_info](#userchange_info) - Change current information account.
   - [user.settings](#usersettings) - Get current settings information account.
   - [user.refresh_settings](#userrefresh_settings) - Refresh current user settings.
   - [user.update_settings](#userupdate_settings) - Update user settings by your own settings.
   - [user.public_info](#userpublic_info) - Get user public information account.
   - [user.public_info_array](#userpublic_info_array) - Get user public information account. same like `public_info()`, but this function have less information.
   - [user.public_following_list](#userpublic_following_list) - Get public user following list.
   - [user.public_followers_list](#userpublic_followers_list) - Get public user followers list.
   - [user.following_check](#userfollowing_check) - Check are you following this user account or not.
   - [user.following_list_name](#userfollowing_list_name) - Get account following name list.
   - [user.followers_list_name](#userfollowers_list_name) - Get account followers name list.
   - [user.follow](#userfollow) - Follow user account.
   - [user.unfollow](#userunfollow) - Unfollow user account.
   - [user.liked_character_list](#userliked_character_list) - Get a list of characters that the account likes.
   - [user.add_muted_words](#useradd_muted_words) - Add muted words.
   - [user.remove_muted_words](#userremove_muted_words) - Remove muted words.
   - [user.clear_muted_words](#userclear_muted_words) - Clear muted words.
- [Image Function List](#image-function-list)
   - [image.generate_avatar](#imagegenerate_avatar) - Generate avatar image using prompt.
   - [image.generate_image](#imagegenerate_image) - Generate image using prompt.
- [Search Function List](#search-function-list)
   - [search.list_tags](#searchlist_tags) - Get list of tags.
   - [search.users](#searchusers) - Search users by name.
   - [search.scenes](#searchscenes) - Search scenes by query.
   - [search.characters](#searchcharacters) - Search for a characters by name.
   - [search.voices](#searchvoices) - Search for a voices by name.
   - [search.popular](#searchpopular) - Get popular search.
   - [search.trending](#searchtrending) - Get trending search.
   - [search.autocomplete](#searchautocomplete) - Get autocomplete search.
   - [search.languages](#searchlanguages) - Get languages list.
- [Persona Function List](#persona-function-list)
   - [persona.create](#personacreate) - Create your personality for your character.
   - [persona.set_default](#personaset_default) - Set your default personality specifically.
   - [persona.list](#personalist) - Get all your personality data.
   - [persona.info](#personainfo) - Get your personality information.
   - [persona.update](#personaupdate) - Update your personality specifically.
   - [persona.delete](#personadelete) - Delete your personality spesifically.
   - [persona.set_character](#personaset_character) - Set a custom personality for your character specifically.
- [Explore Function List](#explore-function-list)
   - [explore.featured](#explorefeatured) - Get a list of characters displayed by the Character.AI server.
   - [explore.for_you](#explorefor_you) - Get a list of characters recommended by the Character.AI server.
   - [explore.simillar_char](#exploresimillar_char) - Get a list of simillar character from ID character.
   - [explore.character_categories](#explorecharacter_categories) - Get a list of characters from the character category exploration.
   - [explore.featured_voices](#explorefeatured_voices) - Get a list of featured voices.
- [Character Function list](#character-function-list)
   - [character.votes](#charactervotes) - Get character vote information.
   - [character.votes_array](#charactervotes_array) - Get character vote information in array.
   - [character.vote](#charactervote) - Used for vote the character.
   - [character.info](#characterinfo) - Get detailed information about characters.
   - [character.recent_list](#characterrecent_list) - Get a list of recent chat activity.
   - [character.connect](#characterconnect) - Connect client to character chat.
   - [character.disconnect](#characterdisconnect) - Disconnecting client from character chat.
   - [character.send_message](#charactersend_message) - Send message to character.
   - [character.generate_turn](#charactergenerate_turn) - Generating message response from character.
   - [character.generate_turn_candidate](#charactergenerate_turn_candidate) - Regenerate character message.
   - [character.create_new_conversation](#charactercreate_new_conversation) - it will create a new conversation and your current conversation will save on the history.
   - [character.delete_message](#characterdelete_message) - Delete character message.
   - [character.edit_message](#characteredit_message) - Edit the character message.
   - [character.replay_tts](#characterreplay_tts) - Generate text messages from character to voice audio.
   - [character.current_voice](#charactercurrent_voice) - Get character current voice info.
   - [character.get_category](#characterget_category) - Get category used of the character.
   - [character.about](#characterabout) - Get detailed information of the character about.
   - [character.info_detailed](#characterinfo_detailed) - Get detailed of the character. but, it will give you a FULL detailed of the Character, including character definition.
- [Group Chat Function List](#group-chat-function-list)
   - [group_chat.list](#group_chatlist) - Get all list available group chat in account.
   - [group_chat.connect](#group_chatconnect) - Connecting to group chat by the Room ID.
   - [group_chat.disconnect](#group_chatdisconnect) - Disconnect from group chat.
   - [group_chat.create](#group_chatcreate) - Create group chat.
   - [group_chat.delete](#group_chatdelete) - Delete group chat.
   - [group_chat.rename](#group_chatrename) - Rename group chat.
   - [group_chat.join_group_invite](#group_chatjoin_group_invite) - Joining group chat using invite code.
   - [group_chat.char_add](#group_chatchar_add) - Add a character with Character ID to the group chat.
   - [group_chat.char_remove](#group_chatchar_remove) - Remove a character with Character ID from the group chat.
   - [group_chat.send_message](#group_chatsend_message) - Send message to group chat.
   - [group_chat.generate_turn](#group_chatgenerate_turn) - Generating message response character from group chat.
   - [group_chat.generate_turn_candidate](#group_chatgenerate_turn_candidate) - Regenerate character message.
   - [group_chat.reset_conversation](#group_chatreset_conversation) - Reset conversation in group chat.
   - [group_chat.delete_message](#group_chatdelete_message) - Delete user/character message.
   - [group_chat.edit_message](#group_chatedit_message) - Edit user/character message.
   - [group_chat.select_turn](#group_chatselect_turn) - Select the turn of character chat by yourself.
- [Chat Function List](#chat-function-list)
   - [chat.history_chat_turns](#chathistory_chat_turns) - Get a history chat from group or single chat.
   - [chat.conversation_info](#chatconversation_info) - Get converastion information.
   - [chat.history_conversation_list](#chathistory_conversation_list) - Get list of your history conversation from character. This function is for Single character only.
   - [chat.set_conversation_chat](#chatset_conversation_chat) - Set conversation chat, and bring the history chat into current chat. This function is for Single character only.
   - [chat.pin_message](#chatpin_message) - Pin message. This function is for Single character only.
   - [chat.list_pinned_message](#chatlist_pinned_message) - Get list pinned message from chat. This function works only for single character chat.
   - [chat.archive_conversation](#chatarchive_conversation) - Archive your conversation. This function works only for single character chat.
   - [chat.duplicate_conversation](#chatduplicate_conversation) - Duplicate your conversation. This function works only for single character chat.
   - [chat.rename_conversation](#chatrename_conversation) - Rename your conversation title. This function works only for single character chat.
   - [chat.conversation_facts](#chatconversation_facts) - i dont know what is this. but maybe this is for getting the facts of your conversation, i guess...?
- [Voice Function List](#voice-function-list)
   - [voice.user_created_list](#voiceuser_created_list) - Get list of user created voice information.
   - [voice.info](#voiceinfo) - Get a voice information.
   - [voice.connect](#voiceconnect) - Connect to voice character chat, and this function works only for single character chat.
- [Livekit Function List](#livekit-function-list) - (when you're connected to the character voice)
   - [voice.connect().is_character_speaking](#voiceconnectis_character_speaking) - Check is Character is speaking or not.
   - [voice.connect().on event](#voiceconnecton-event) - List and Description of Livekit onevent.
   - [voice.connect().input_write](#voiceconnectinput_write) - Send audio PCM raw data to the Livekit Server.
   - [voice.connect().is_speech](#voiceconnectis_speech) - this function checking is the PCM buffer frame is silence or not.
   - [voice.connect().interrupt_call](#voiceconnectinterrupt_call) - Interrupt while character talking.
   - [voice.connect().disconnect](#voiceconnectdisconnect) - Disconnect from voice character.
- [Notification Function List](#notification-function-list)
   - [notification.history](#notificationhistory) - Get all of the history notification.
   - [notivication.history_v2](#notificationhistory_v2) - Get all of the history notification (Version 2)
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
   
- ## generate_token_auto()
   Generate your Character.AI Token by email. and you will get the token by just pressing the button when you receive the email.

   Parameter Info  
   - 1st parameter `email`: Target email you want to generate the token.
   - 2nd parameter: Timeout per 2 seconds (default 30, so it means = 60 seconds or 1 minute)<br>
   You can disable the Timeout by set the parameter into 0.

   Example:

   - Without Timer
     ```js
     console.log(await library_name.generate_token_auto("your@email.com", 0))
     ```  
   - With Timer
     ```js
     console.log(await library_name.generate_token_auto("your@email.com", 60))
     ```
   - With callback
     ```js
     console.log(await library_name.generate_token_auto("your@email.com", 30, function() {console.log("Please check your email")}, function() {console.log("timeout!")}))
     ```

   | Param | Require | Type | Description |  
   | --- | --- | --- | --- |  
   | email | `true` | `string` | Your email to send a verification link. |
   | timeout_per_2s | `false` | `number` | Max waiting for verification. (default = 30) |
   | mail_sent_cb | `false` | `Function` | Callback when the mail was sent to the target. |
   | timeout_cb | `false` | `Function` | Callback when the timeout was reached. |

   [Back to the Table of contents](#table-of-contents)

- ## ping()
   Pings the Character AI server's health check endpoint.

   ```js
   await client.ping();
   ```
   | Param | Require | Type | Description |  
   | --- | --- | --- | --- |  
   | none | `false` | `null` | - |

   [Back to the Table of contents](#table-of-contents)

- ## logout()
   Logout from the client.

   ```js
   await client.logout();
   ```
   | Param | Require | Type | Description |  
   | --- | --- | --- | --- |  
   | none | `false` | `null` | - |

   [Back to the Table of contents](#table-of-contents)

# User Function List
> This class contains variables and methods about the User requirement. For example: Get current information account, Change account, etc about user needs.
- ## user.info
   Get current information account.
   
   Example
   ```js
   console.log(client.user.info);
   ```
   | Param | Require | Type | Description |  
   | --- | --- | --- | --- |  
   | none | `false` | `null` | - |

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


- ## user.public_info_array()
   Get user public information account. same like `public_info()`, but this function have less information.

   This function allow to fetch more than one usernames. Using array.

   ```js
   await client.user.public_info_array();
   ```
   | Param | Require | Type | Description |  
   | --- | --- | --- | --- |  
   | usernames | `true` | `Array or string` | Target Character.AI username account. can be single (string) or multiple (array). |

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
   | avatar_rel_path | `false` | `string` | Change your old `avatar_rel_path` link to new `avatar_rel_path` link.<br><br><b>Warning</b>: `avatar_rel_path` image link <b>must be generated/uploaded</b> to Character.AI server. |
   | bio | `false` | `string` | Change your old bio to new bio. |

   [Back to the Table of contents](#table-of-contents)


- ## user.settings()
   Get account settings information data.

   ```js
   console.log(client.user.settings)
   ```

   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | none | `false` | `null` | - |

   [Back to the Table of contents](#table-of-contents)


- ## user.refresh_settings()
   Refresh settings. also it will returns the current of the settings.
   no need to do `library_name.user.settings` after call this function.
   You can do console.log() instead.  

   ```js
   await library_name.user.refresh_settings()
   ```

   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | none | `false` | `null` | - |

   [Back to the Table of contents](#table-of-contents)


- ## user.update_settings()
   Update user settings by your own settings manually.

   ```js
   await library_name.user.update_settings()
   ```

   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | settings_object | `true` | `Object` | User Settings. |

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


- ## user.following_check()
   Check are you following this user account or not.

   ```js
   await client.user.following_check("Username");
   ```
   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | username | `true` | `string` | Target Character.AI username account. |

   [Back to the Table of contents](#table-of-contents)


- ## user.following_list_name()
   Get account following name list.

   ```js
   await client.user.following_list_name();
   ```
   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | none | `false` | `null` | - |

   [Back to the Table of contents](#table-of-contents)


- ## user.followers_list_name()
   Get account followers name list.

   ```js
   await client.user.followers_list_name();
   ```
   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | none | `false` | `null` | - |

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

- ## user.liked_character_list()
   Get a list of characters that the account likes.

   ```js
   await client.user.liked_character_list();
   ```
   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | none | `false` | `null` | - |

   [Back to the Table of contents](#table-of-contents)


- ## user.add_muted_words()
   Add muted words.

   Example
   - Array
      ```js
      await library_name.user.add_muted_words(["hello", "world"])
      ```
   - String
      ```js
      await library_name.user.add_muted_words("hello world")
      ```

   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | words | `true` | `string[] | string` | Words that you want to add to the muted words. |

   [Back to the Table of contents](#table-of-contents)


- ## user.remove_muted_words()
   Remove muted words.

   Example
   - Array
      ```js
      await library_name.user.remove_muted_words(["hello", "world"])
      ```
   - String
      ```js
      await library_name.user.remove_muted_words("hello world")
      ```

   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | words | `true` | `string[] | string` | Words that you want to remove from the muted words. |

   [Back to the Table of contents](#table-of-contents)


- ## user.clear_muted_words()
   Clear muted words.

   ```js
   await library_name.user.clear_muted_words()
   ```

   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | none | `false` | `null` | - |

   [Back to the Table of contents](#table-of-contents)


# Image Function List
- ## image.generate_avatar()
   Generate avatar image using prompt.

   ```js
   await client.image.generate_avatar(prompt_name);
   ```
   | Param | Require | Type | Description |  
   | --- | --- | --- | --- |  
   | prompt_name | `true` | `string` | Prompt used for generating avatar image. |

   [Back to the Table of contents](#table-of-contents)

- ## image.generate_image()
   Generate image using prompt.

   ```js
   await client.image.generate_image(prompt_name);
   ```
   | Param | Require | Type | Description |  
   | --- | --- | --- | --- |  
   | prompt_name | `true` | `string` | Prompt used for generating AI image. |

   [Back to the Table of contents](#table-of-contents)

# Search Function List
> This class contains functions about the Search on Character.AI Server.

- ## search.list_tags()
   Get list of tags.

   ```js
   await client.search.list_tags();
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | - |

   [Back to the Table of contents](#table-of-contents)


- ## search.users()
   Search users by name.

   ```js
   await library_name.search.users("Name user", "popular"); // sorted by popular
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | name | `true` | `string` | Name user to search |
   | sorted_by | `true` | `string` | Search sorted by? |

   [Back to the Table of contents](#table-of-contents)


- ## search.scenes()
   Search scenes by query.

   ```js
   await library_name.search.scenes("Query");
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | query | `true` | `string` | Search scenes by Query |


   [Back to the Table of contents](#table-of-contents)


- ## search.characters()
   Search for a character by name or query.

   ```js
   await library_name.search.characters("Character Name")
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | name | `true` | `string` | Search queries to find characters. |
   | sorted_by | `true` | `string` | Search sorted by? |

   [Back to the Table of contents](#table-of-contents)


- ## search.voices()
   Search for a voices by name.

   ```js
   await library_name.search.voices("Name voice")
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | name | `true` | `string` | Search queries to find voices. |

   [Back to the Table of contents](#table-of-contents)


- ## search.popular()
   Get popular search.

   ```js
   await library_name.search.popular()
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | - |

   [Back to the Table of contents](#table-of-contents)


- ## search.trending()
   Get trending search.

   ```js
   await library_name.search.trending()
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | - |

   [Back to the Table of contents](#table-of-contents)


- ## search.autocomplete()
   Get autocomplete search.

   ```js
   await library_name.search.autocomplete("Search")
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | query | `true` | `string` | Get autocomplete search by Query |

   [Back to the Table of contents](#table-of-contents)


- ## search.languages()
   Get languages list.

   ```js
   await library_name.search.languages("")
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | - |

   [Back to the Table of contents](#table-of-contents)


# Persona Function List
> This class contains variables and methods about the Persona requirement. For example: Create/Edit/Delete Persona, Set persona, Get information about persona.


- ## persona.create()
   Create your personality for your character.

   ```js
   await client.persona.create(name, description);
   ```
   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   |  name  | `true` | `string` | Your persona name |
   | description | `true` | `string` | Description of your personality, this section is used to describe yourself so that your AI character knows who you are. |

   [Back to the Table of contents](#table-of-contents)

- ## persona.set_default()
   Set your default personality specifically.

   ```js
   await client.persona.set_default(external_persona_id);
   ```
   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | external_persona_id | `true` | `string` | External personality id that you have. |

   [Back to the Table of contents](#table-of-contents)

- ## persona.list()
   Get all your personality data.

   ```js
   await client.persona.list();
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | - |

   [Back to the Table of contents](#table-of-contents)


- ## persona.info()
   Get your personality information.

   ```js
   await client.persona.info(external_persona_id);
   ```
   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | external_persona_id | `true` | `string` | External personality id that you have. |

   [Back to the Table of contents](#table-of-contents)


- ## persona.update()
   Update your personality specifically.

   ```js
   await client.persona.update(external_persona_id, name, description);
   ```
   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | external_persona_id | `true` | `string` | External personality id that you have. |
   | name | `true` | `string` | Your new personality name. |
   | description | `true` | `string` | Your new personality detail. |

   [Back to the Table of contents](#table-of-contents)


- ## persona.delete()
   Used for deleting your personality spesifically.

   ```js
   await client.persona.delete(external_persona_id);
   ```
   | Param | Require | Type | Description | 
   | --- | --- | --- | --- | 
   | external_persona_id | `true` | `string` | External personality id that you have. |

   [Back to the Table of contents](#table-of-contents)

- ## persona.set_character()
   Set a custom personality for your character specifically.

   ```js
   await client.persona.set_character(character_id, external_persona_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | character_id | `true` | `string` | A character id that you want to set a custom personality. |
   | external_persona_id | `true` | `string` | Your personality id that you use to let AI characters know who you are. |

   [Back to the Table of contents](#table-of-contents)

# Explore Function List
> This class contains functions about the Explore requirement. Example: Featured Character, For you Recommended Character, and etc about Explore.
- ## explore.featured()
   Get the list of characters displayed by the character.ai server.

   ```js
   await client.explore.featured();
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | - |

   [Back to the Table of contents](#table-of-contents)

- ## explore.for_you()
   Get a list of characters recommended by the character.ai server.

   ```js
   await client.explore.for_you();
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | - |

   [Back to the Table of contents](#table-of-contents)

- ## explore.simillar_char()
   Get the list simillar character from ID character.

   ```js
   await client.explore.simillar_char(char_id);
   ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | char_id | `true` | `string` | Character ID. |

   [Back to the Table of contents](#table-of-contents)

- ## explore.character_categories()
   Get the list of characters from the character category exploration.

   ```js
   await client.explore.character_categories();
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | - |

   [Back to the Table of contents](#table-of-contents)
- ## explore.featured_voices()
   Get a list of featured voices.

   ```js
   await client.explore.featured_voices();
   ```
   
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | - |

   [Back to the Table of contents](#table-of-contents)

# Character Function List
> This class contains functions about the Character requirement (Single Character, not Group Chat). Example: Sending message to Character, votes character, and etc about Character.

- ## character.votes()
   Get character vote information.

   ```js
   await client.character.votes(character_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | character_id | `true` | `string` | The character id you are aiming for. |

   [Back to the Table of contents](#table-of-contents)


- ## character.votes_array()
   Get character vote information in array.

   ```js
   await client.character.votes_array(character_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | character_id | `true` | `string` | The character id you are aiming for. |

   [Back to the Table of contents](#table-of-contents)


- ## character.vote()
   Used for vote the character.

   ```js
   await client.character.vote(character_id, vote);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | character_id | `true` | `string` | The character id you are aiming for. |
   | vote | `true` | `boolean` | Character vote options, `true = like`, `false = dislike`, and `null = cancel` |

   [Back to the Table of contents](#table-of-contents)


- ## character.info()
   Get detailed information about characters.

   ```js
   await client.character.info(character_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | character_id | `true` | `string` | Your character id. |

   [Back to the Table of contents](#table-of-contents)


- ## character.recent_list()
   Get a list of recent chat activity

   ```js
   await client.character.recent_list();
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | - |

   [Back to the Table of contents](#table-of-contents)


- ## character.connect()
   Connect client to character chat

   ```js
   await client.character.connect(character_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | character_id | `true` | `string` | Your character id. |

   [Back to the Table of contents](#table-of-contents)


- ## character.disconnect()
   Disconnecting client from character chat

   ```js
   await client.character.disconnect();
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | - |

   [Back to the Table of contents](#table-of-contents)


- ## character.send_message()
   Send message to character.

   - Example (Default and if you're using `character.connect()` to connect to the Single Character.)  
      - Without manual turn
         ```js
         await library_name.character.send_message("Your Message", false, "URL Link (you can empty it if you don't want to send it)")
         ```
      - With manual turn
         ```js
         await library_name.character.send_message("Your Message", true, "URL Link (you can empty it if you don't want to send it)")
         ```

   - Example (Manual input Character ID and Chat ID)
      - Wtihout manual turn  
         ```js
         await library_name.character.send_message("Your Message", false, "URL Link (you can empty it if you don't want to send it)", {
               char_id: "Input your Character ID here.",
               chat_id: "Input your Chat ID here."
            })
         ```  
      - With manual turn  
         ```js
         await library_name.character.send_message("Your Message", true, "URL Link (you can empty it if you don't want to send it)", {
            char_id: "Input your Character ID here.",
            chat_id: "Input your Chat ID here."
         })
         ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | message | `true` | `string` | Message content. |
   | manual_turn | `false` | `boolean` | If the value of `manual_turn` is set to `true` then the message that the client receives must be generated with `character.generate_turn()` so that the message is obtained by the client. |
   | image_url | `false` | `string` | The image content that the character will see, must be a url and not a file type or a file with a type other than image. |
   | manual_opt | `false` | `{chat_id: string, char_id: string, timeout_ms: number}` | Manual options. (Must fill if you're not already connected into the Single Character. applies only `char_id` and `chat_id` only.)

   [Back to the Table of contents](#table-of-contents)

- ## character.generate_turn()
   Generating message response from character.

   ```js
   await client.character.generate_turn();
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | manual_opt | `false` | `{chat_id: string, char_id: string, timeout_ms: number}` | Manual options. (Must fill if you're not already connected into the Single Character. applies only `char_id` and `chat_id` only.)

   [Back to the Table of contents](#table-of-contents)

- ## character.generate_turn_candidate()
   Regenerate character message.

   ```js
   await client.character.generate_turn_candidate(turn_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | turn_id | `true` | `string` | `turn_id` or `message_id` from the character. |
   | manual_opt | `false` | `{chat_id: string, char_id: string, timeout_ms: number}` | Manual options. (Must fill if you're not already connected into the Single Character. applies only `char_id` and `chat_id` only.)
   
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
   | with_greeting | `false` | `boolean` | The character will send you a greeting when you create a new conversation. (Default = true) |
   | manual_opt | `false` | `{char_id: string}` | Manual Option. (Must fill if you're not already connected into the Single Character.)

   [Back to the Table of contents](#table-of-contents)

- ## character.delete_message()
   Delete character message.

   ```js
   await client.character.delete_message(turn_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | turn_id | `true` | `string` | `turn_id` or `message_id` from the character. |
   | manual_opt | `false` | `{char_id: string, chat_id: string}` | Manual Options (Must fill if you're not already connected into the Single Character.)

   [Back to the Table of contents](#table-of-contents)


- ## character.edit_message()
   Edit the character message.

   ```js
   await client.character.edit_message(candidate_id, turn_id, new_message);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | candidate_id | `true` | `string` | 
   | turn_id | `true` | `string` | `turn_id` or `message_id` from the character. |
   | new_message | `true` | `string` | New character message |
   | manual_opt | `false` | `{char_id: string, chat_id: string}` | Manual Options (Must fill if you're not already connected into the Single Character.)

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
   | turn_id | `true` | `string` | `turn_id` from the character. |
   | candidate_id | `true` | `string` | `candidate_id` from the character. |
   | voice_id_or_query | `true` | `string` | Input Voice character ID or you can use Voice Query. |
   | using_query | `false` | `boolean` | Using Query (if You're using Voice Query, then set this parameter to `true`.) |
   | manual_opt | `false` | `{chat_id: string}` | Manual Options (Must fill if you're not already connected into the Single Character.)

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
   | character_id | `false` | `string` | Target of Character ID. (Must fill if you're not already connected into the Single Character.) |

   [Back to the Table of contents](#table-of-contents)


- ## character.get_category()
   Get category used of the character.

      ```js
      await client.character.get_category()
      ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | character_id | `true` | `string` | Target of Character ID. |

   [Back to the Table of contents](#table-of-contents)


- ## character.about()
   Get detailed information of the character about.  
   > REMEMBER: Specific Character only. if the character have an "about" feature, then you can use this function.  
   > Otherwise, it return noindex: true, or it means it empty.
   
   ```js
   await client.character.about()
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | short_hash | `true` | `string` | Target of Character short hash. |

   [Back to the Table of contents](#table-of-contents)


- ## character.info_detailed()
   Get detailed of the character. but, it will give you a FULL detailed of the Character, including character definition.  
   > REMEMBER: If the character defined turned to public, then you can use this function.  
   > Otherwise, it return an empty character data and the status says "do not have permission to view this Character".
   
   ```js
   await client.character.info_detailed()
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | external_id | `true` | `string` | Target of Character ID. |

   [Back to the Table of contents](#table-of-contents)


# Group Chat Function List
- ## group_chat.list()
   Get all list available group chat in account.

   ```js
   await client.group_chat.list();
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | - |

   [Back to the Table of contents](#table-of-contents)


- ## group_chat.connect()
   Connecting to group chat by the `room_id`, btw you can't connect the group chat before you create it.

   ```js
   await client.group_chat.connect(room_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | room_id | `true` | `string` | Your group chat id. |

   [Back to the Table of contents](#table-of-contents)


- ## group_chat.disconnect()
   Disconnecting from group chat by the `room_id`.

   ```js
   await client.group_chat.disconnect(room_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | room_id | `true` | `string` | Your group chat id. |

   [Back to the Table of contents](#table-of-contents)


- ## group_chat.create()
   Create a custom room chat.

   ```js
   await client.group_chat.create(title_room, character_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | title_room | `true` | `string` | Your custom title room name. |
   | character_id | `true` | `string` | Your character id will be added to the group chat. |

   [Back to the Table of contents](#table-of-contents)


- ## group_chat.delete()
   Delete group chat.

   ```js
   await client.group_chat.delete(room_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | room_id | `true` | `string` | Your group chat id. |

   [Back to the Table of contents](#table-of-contents)


- ## group_chat.rename()
   Rename group chat.

   ```js
   await client.group_chat.rename(new_name, room_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | new_name | `true` | `string` | New name for your group chat. |
   | room_id | `true` | `string` | Your group chat id. |

   [Back to the Table of contents](#table-of-contents)

- ## group_chat.join_group_invite()
   Joining group chat using invite code.

   ```js
   await client.group_chat.join_group_invite(invite_code);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | invite_code | `true` | `string` | The group chat miinvite code. |

   [Back to the Table of contents](#table-of-contents)

- ## group_chat.char_add()
   Add a character with `character_id` to the group chat.

   ```js
   await client.group_chat.char_add(character_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | character_id | `true` | `string` | Character id to be added to the group chat. |

   [Back to the Table of contents](#table-of-contents)

- ## group_chat.char_remove()
   Remove a character with `character_id` from the group chat.

   ```js
   await client.group_chat.char_remove(character_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | character_id | `true` | `string` | Character id to be removed from the group chat. |

   [Back to the Table of contents](#table-of-contents)

- ## group_chat.send_message()
   Send message to character in group chat.

   ```js
   await client.group_chat.send_message(message, image_url);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | message | `true` | `string` | Message content. |
   | image_url | `false` | `string` | The image content that the character will see, must be a url and not a file type or a file with a type other than image. |

   [Back to the Table of contents](#table-of-contents)

- ## group_chat.generate_turn()
   Generating message response character from group chat.

   ```js
   await client.group_chat.generate_turn();
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | - |

   [Back to the Table of contents](#table-of-contents)

- ## group_chat.generate_turn_candidate()
   Regenerate character message.

   ```js
   await client.group_chat.generate_turn_candidate(turn_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | turn_id | `true` | `string` | `turn_id` or `message_id` from the character. |

   [Back to the Table of contents](#table-of-contents)

- ## group_chat.reset_conversation()
   Reset conversation in group chat.

   ```js
   await client.group_chat.reset_conversation();
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | - |

   [Back to the Table of contents](#table-of-contents)

- ## group_chat.delete_message()
   Delete character message.

   ```js
   await client.group_chat.delete_message(turn_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | turn_id | `true` | `string` | `turn_id` or `message_id` from the character. |

   [Back to the Table of contents](#table-of-contents)

- ## group_chat.edit_message()
   Edit character message in group chat.

   ```js
   await client.group_chat.edit_message(candidate_id, turn_id, new_message);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | candidate_id | `true` | `string` | 
   | turn_id | `true` | `string` | `turn_id` or `message_id` from the character. |
   | new_message | `true` | `string` | New character message |

   [Back to the Table of contents](#table-of-contents)

- ## group_chat.select_turn()
   Select the turn of character chat by yourself.

   ```js
   await client.group_chat.select_turn(turn_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | turn_id | `true` | `string` | `turn_id` or `message_id` from the character. |

   [Back to the Table of contents](#table-of-contents)

# Chat Function List
- ## chat.history_chat_turns()
   Get a history chat from group or single chat.

   ```js
   await client.chat.history_chat_turns(chat_id);
   ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | chat_id | `true` | `string` | Group chat or single chat ID. |

   [Back to the Table of contents](#table-of-contents)

- ## chat.conversation_info()
   Get converastion information.

   ```js
   await client.chat.conversation_info(chat_id);
   ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | chat_id | `true` | `string` | Group chat ID or single chat ID. |
   
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
   | character_id | `false` | `string` | Target of Character ID. |

   [Back to the Table of contents](#table-of-contents)

- ## chat.set_conversation_chat()
   Set conversation chat, and bring the history chat into current chat. This function is for Single character only.

   ```js
   await client.chat.set_conversation_chat(chat_id)
   ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | chat_id | `true` | `string` | single chat ID. |

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
   | turn_id | `true` | `string` | Turn ID Message. |
   | pinned | `false` | `boolean` | Set the message pinned or not. (set `true` if you want to pin the message, set `false` if you want to unpin the message.) |
   | chat_id | `false` | `string` | Chat ID Message. (Set the Chat ID if you not connected to the Single character.) |

   [Back to the Table of contents](#table-of-contents)

- ## chat.list_pinned_message()
   Get list pinned message from chat. This function works only for single character chat.

   ```js
   await client.chat.list_pinned_message("Chat ID")
   ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | chat_id | `true` | `string` | Chat ID Message. |

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
   | chat_id | `true` | `string` | Chat ID message that you want to archive. |
   | set_archive | `false` | `boolean` | Set Archive (to archive the Conversation, you can set it to `true`. If you want to unarchive the Converastion, you can set it to `false`.) |

   [Back to the Table of contents](#table-of-contents)

- ## chat.duplicate_conversation()
   Duplicate your conversation. This function works only for single character chat.

   ```js
   await client.chat.duplicate_conversation("Chat ID", "Turn ID")
   ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | chat_id | `true` | `string` | Chat ID message that you want to duplicate. |
   | turn_id | `true` | `string` | Turn ID message that you want to duplicate. |

   [Back to the Table of contents](#table-of-contents)

- ## chat.rename_conversation()
   Rename your conversation title. This function works only for single character chat.

   ```js
   await client.chat.rename_conversation("Chat ID", "Custom Name")
   ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | chat_id | `true` | `string` | Chat ID message that you want to rename. |
   | name | `true` | `string` | Name that you want to rename. |

   [Back to the Table of contents](#table-of-contents)


- ## chat.conversation_facts()
   i dont know what is this. but maybe this is for getting the facts of your conversation, i guess...?<br>
   if you know this thing, please lemme know or you can do pull request if you want to.

   ```js
   await client.chat.conversation_facts("Chat ID")
   ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | chat_id | `true` | `string` | Chat ID message that you want to get a conversation facts. |

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
   | username | `false` | `string` | A username that wants you to check the created voice list. |
   
   [Back to the Table of contents](#table-of-contents)

- ## voice.info()
   Get a voice information.

   ```js
   await client.voice.info("Voice ID")
   ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | voice_id | `true` | `string` | A Voice ID that wants you to check the voice information. |
   
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

      test.on("frameReceived", ev => {
            speaker.write(Buffer.from(ev.value.data.buffer)); // PCM buffer write into speaker and you'll hear the sound.
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

      test.on("frameReceived", ev => {
            speaker.write(Buffer.from(ev.value.data.buffer)); // PCM buffer write into speaker and you'll hear the sound.
      });
      
      recordMic.stdout.on("data", data => {
            if (test.is_speech(data)) test.input_write(data); // Mic PCM Buffer output send it to Livekit server.
      });
      ```
   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | voice_query_or_id | `true` | `string` | Target Voice query or Voice ID. |
   | using_voice_query | `false` | `boolean` | Using Voice Query (set it to true if `voice_query_or_id` using Voice Query) |
   | using_mic | `false` | `boolean` | Using Microphone (You can talk to the Character using Microphone. Livekit needed.) |
   | mic_opt | `false` | `{sample_rate: number, channel: number}` | Mic options. Default = `{sample_rate: 48000, channel: 1}` |
   | manual_opt | `false` | `{char_id: string, chat_id: string}` | Manual Options. (Must fill if you're not connected to the Single Character.) |

   [Back to the Table of contents](#table-of-contents)


# Livekit Function List
- ## voice.connect().is_character_speaking
   Check is Character is speaking or not.

   ```js
   const voice = await client.voice.connect();
   console.log(voice.is_character_speaking)
   ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | - |
   [Back to the Table of contents](#table-of-contents)

- ## voice.connect().on event
   Get Character.AI Voices (Livekit) data events.

   - `dataReceived`: Receive Character.AI Livekit data events.
      ```js
      const voice = await client.voice.connect();
      voice.on("dataReceived", data => {
         console.log(data)
      })
      ```
   - `frameReceived`: Receive audio stream from Livekit Server.
      ```js
      const voice = await client.voice.connect();
      voice.on("frameReceived", data => {
         console.log(data)
      })
      ```
   - `disconnected`: Notify when the Voice is disconnect.
      ```js
      const voice = await client.voice.connect();
      voice.on("disconnected", () => {
         console.log("Voice disconnected!")
      })
      ```
   [Back to the Table of contents](#table-of-contents)

- ## voice.connect().input_write
   Send audio PCM raw data to the Livekit Server.

   ```js
   const voice = await client.voice.connect();
   voice.input_write();
   ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | pcm_data | `true` | `Buffer` | PCM Buffer Data. |
   
   [Back to the Table of contents](#table-of-contents)

- ## voice.connect().is_speech
   this function checking is the PCM buffer frame is silence or not.  
   if the PCM Buffer is silence, it will return false. if not, it will return true  

   Threshold default: 1000

   Credit: https://github.com/ashishbajaj99/mic/blob/master/lib/silenceTransform.js

   ```js
   const voice = await client.voice.connect();
   voice.is_speech();
   ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | chunk | `true` | `Buffer` | PCM Buffer Data. |
   | Threshold | `false` | `number` | Threshold. (Default = 1000) |

   [Back to the Table of contents](#table-of-contents)

- ## voice.connect().interrupt_call
   Interrupt while character talking.

   ```js
   const voice = await client.voice.connect();
   await voice.interrupt_call();
   ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | - |

   [Back to the Table of contents](#table-of-contents)

- ## voice.connect().disconnect
   Disconnect from voice character.

   ```js
   const voice = await client.voice.connect();
   await voice.disconnect();
   ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | - |

   [Back to the Table of contents](#table-of-contents)

# Notification Function List
- ## notification.history()
   Get all of the history notification.

   ```js
   await library_name.notification.history()
   ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | - |

   [Back to the Table of contents](#table-of-contents)


- ## notification.history_v2()
   Get all of the history notification (Version 2).

   ```js
   await library_name.notification.history_v2()
   ```

   | Param | Require | Type | Description |
   | --- | --- | --- | --- | 
   | none | `false` | `null` | - |

   [Back to the Table of contents](#table-of-contents)


# Issues
Feel free to open the issue, I hope this documentation can help you maximally and make it easier for you to use this package.

> *Thanks to [ZTRdiamond](https://github.com/ZTRdiamond) for helping me making a documentation.*
