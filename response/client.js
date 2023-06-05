/*
* Thanks To
* Adhiraj Singh/Adiwajshing (Baileys Provider)
* Dani Ramdani (Creator/Developer)
* All Partners

* 2023 © Copyright - Dani Dev. All rights reserved.
* www.danidev.eu.org
*/

const config = require('../config.json')

const {
	Configuration,
	OpenAIApi
} = require('openai')
const axios = require('axios')
const chalk = require('chalk')
const fs = require('fs')
const cron = require('node-cron')
const timeZone = require('moment-timezone')

module.exports = async (client, messages) => {
    const body = (messages.mtype === 'conversation') ? messages.message.conversation : (messages.mtype == 'extendedTextMessage') ? messages.message.extendedTextMessage.text : ''
    const budy = (typeof messages.text == 'string' ? messages.text : '')
    const args = body.trim().split(/ +/).slice(1)
    const text = args.join(' ')
	const message = messages
	const messageType = messages.mtype
	const messageKey = message.key
    const pushName = messages.pushName || 'Undefined'
    const chat = from = messages.chat
	const reply = messages.reply
	const sender = messages.sender
	const botNumber = await client.decodeJid(client.user.id)
    const myNumber = sender == botNumber ? true : false
    const isOwner = config.ownerNumber.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(sender) || false
	const isPremium = config.premiumNumber.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(sender) || false
	
	// Limit
    let isNumber = x => typeof x === 'number' && !isNaN(x)
    let limitUser = isPremium ? config.limitPremium : config.limitFree
    let user = db.data.users[sender]
    if (typeof user !== 'object') db.data.users[sender] = {}
    if (user) {
        if (!isNumber(user.limit)) user.limit = limitUser
    } else db.data.users[sender] = {
        limit: limitUser,
    }
     
    // Reset Limit
    cron.schedule('00 00 * * *', () => {
      let users = db.data.users;
      let limitPremium = config.limitPremium;
      let limitFree = config.limitFree;

      for (let jid in users) {
        let limit = users[jid].limit;
        if (limit === null) {
          users[jid].limit = limitPremium;
        } else if (typeof limit === 'number') {
          users[jid].limit = limitFree;
        }
      }
      console.log('The daily limit has been reset');
    }, {
      scheduled: true,
      timezone: 'Asia/Jakarta'
    });

	// readMessages
	if (message.message) {
        client.readMessages([messageKey])
        console.log(chalk.magentaBright('Chat with:'), chalk.blueBright(pushName), chalk.greenBright(sender))
    }
    
    // OpenAI Feature
if (sender !== botNumber) {
  if (!text) {
    return reply(`Hai *${pushName}*, Saya *${config.botName}*, ada yang bisa saya bantu?\n\nhelp : wa.me/+6285788532344\nDonasi : https://saweria.co/MicroBO`);
  } else  {
    // lakukan tindakan lain sesuai dengan teks yang ..)
    }
} else {
  return;
}

    
    //if (!isPremium) return reply('Anda bukan user premium')
    if (db.data.users[sender].limit < 1) return reply(config.messageLimitExpired)
    db.data.users[sender].limit -= 1
    //reply('Limit terpakai -1')
    if (body === 'Siapa namamu?') {
		return reply('Namaku MicroBOT🤖')
	}

    reply(config.messageWait)
    const configuration = new Configuration({
		apiKey: config.openAIAPIKeys
	})
	const openai = new OpenAIApi(configuration)
	async function getChatGptResponse(request) {
		try {
    		const response = await openai.createChatCompletion({
				model: 'gpt-3.5-turbo',
				messages: [{ role: 'user', content: body }],
			});
			reply(response.data.choices[0].message.content);
			return response.data.choices[0].message.content;
		} catch (err) {
    		reply('lapor admin ada ERROR\nerr: ' + err);
    		console.log('Error: ' + err);
    		return err;
		}
	}
	getChatGptResponse();
	// End
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(chalk.greenBright(`Update ${__filename}`))
	delete require.cache[file]
	require(file)
})