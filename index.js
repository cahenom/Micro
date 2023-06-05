/*
* Thanks To
* Adhiraj Singh/Adiwajshing (Baileys Provider)
* Dani Ramdani (Creator/Developer)
* All Partners

* 2023 © Copyright - Dani Dev. All rights reserved.
* www.danidev.eu.org
*/

const config = require('./config.json')

const {
	default:
	WAConnect,
	DisconnectReason,
	useSingleFileAuthState,
	fetchLatestBaileysVersion,
	makeInMemoryStore,
	jidDecode
} = require('@adiwajshing/baileys');
const {
Boom
} = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const chalk = require('chalk');
const pino = require('pino');
//const lowDb = require('lowdb')
const yargs = require('yargs/yargs');
const lodash = require('lodash')

// Lib
const { smsg } = require('./lib/function');
const lowDb = require('./lib/lowDb')
const mongoDB = require('./lib/mongoDb');

// Session
const {
  state,
  saveState
} = useSingleFileAuthState(config.sessionName + '.json');

// Store Memory
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })

// Database
var low
try {
  low = require('lowdb');
} catch (e) {
  low = lowDb;
}
const {
  Low,
  JSONFile
} = low;
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.db = new Low(
  /https?:\/\//.test(opts['db'] || '') ?
  new cloudDBAdapter(opts['db']) : /mongodb/.test(opts['db']) ?
  new mongoDB(opts['db']) :
  new JSONFile('./database/users.json')
)

global.DATABASE = global.db
global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) return new Promise((resolve) => setInterval(function () { (!global.db.READ ? (clearInterval(this), resolve(global.db.data == null ? global.loadDatabase() : global.db.data)) : null) }, 1 * 1000))
  if (global.db.data !== null) return
  global.db.READ = true
  await global.db.read()
  global.db.READ = false
  global.db.data = {
  users: {},
  ...(global.db.data || {})
  }
  global.db.chain = lodash.chain(global.db.data)
}
loadDatabase()

if (global.db) setInterval(async () => {
  if (global.db.data) await global.db.write()
}, 30 * 1000)
  
// Console
function konsol() {
  console.clear()
  console.log(chalk.bold.cyan('WhatsApp Bot - ChatGPT 3.5 Turbo'))
console.log(`
██████╗░░█████╗░░█████╗░███╗░░░███╗░░░░░░██████╗░
██╔══██╗██╔══██╗██╔══██╗████╗░████║░░░░░██╔════╝░
██████╔╝██║░░██║██║░░██║██╔████╔██║░░░░░██║░░██╗░
██╔══██╗██║░░██║██║░░██║██║╚██╔╝██║░░░░░██║░░╚██╗
██║░░██║╚█████╔╝╚█████╔╝██║░╚═╝░██║██╗░░╚██████╔╝
╚═╝░░╚═╝░╚════╝░░╚════╝░╚═╝░░░░░╚═╝╚═╝░░░╚═════╝░
`);
}

// After Scanning
const connectToWhatsapp = async () => {
	const client = WAConnect({
		printQRInTerminal: true,
		logger: pino({ level: 'silent' }),
		browser: ['WA Bot - ChatGPT 3.5 Turbo','Chrome','3.0.0'],
		auth: state
	})
konsol()
store.bind(client.ev)
client.ev.on('messages.upsert', async chatUpdate => {
	try {
  mek = chatUpdate.messages[0]
  if (!mek.message) return
  mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
  if (mek.key && mek.key.remoteJid === 'status@broadcast') return
  if (!client.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
  if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
  messages = smsg(client, mek, store)
  require('./response/client.js')(client, messages)
  } catch (err) {
    console.log(err)
  }
  }
)

client.public = config.publicMode

client.ev.on('connection.update', async (update) => {
  const { connection, lastDisconnect } = update	  
  if (connection === 'close') {
  let reason = new Boom(lastDisconnect?.error)?.output.statusCode
    if (reason === DisconnectReason.badSession) { console.log(`Bad Session File, Please Delete Session and Scan Again`); client.logout(); }
    else if (reason === DisconnectReason.connectionClosed) { console.log('Connection closed, reconnecting....'); connectToWhatsapp(); }
    else if (reason === DisconnectReason.connectionLost) { console.log('Connection Lost from Server, reconnecting...'); connectToWhatsapp(); }
    else if (reason === DisconnectReason.connectionReplaced) { console.log('Connection Replaced, Another New Session Opened, Please Close Current Session First'); client.logout(); }
    else if (reason === DisconnectReason.loggedOut) { console.log(`Device Logged Out, Please Scan Again And Run.`); client.logout(); }
    else if (reason === DisconnectReason.restartRequired) { console.log('Restart Required, Restarting...'); connectToWhatsapp(); }
    else if (reason === DisconnectReason.timedOut) { console.log('Connection TimedOut, Reconnecting...'); connectToWhatsapp(); }
    else client.end(`Unknown DisconnectReason: ${reason}|${connection}`)
  }
  console.log('Connected...', update)
  }
)
client.ev.on('creds.update', saveState)

decodeJid = client.decodeJid = (jid) => {
	if (!jid) return jid
	if (/:\d+@/gi.test(jid)) {
		let decode =jidDecode(jid) || {}
		return decode.user && decode.server && decode.user + '@' + decode.server || jid
	} else return jid
}

sendText = client.sendText = (jid, text, quoted = '', options) => client.sendMessage(jid, { text: text, ...options }, { quoted })

return client
}
connectToWhatsapp()