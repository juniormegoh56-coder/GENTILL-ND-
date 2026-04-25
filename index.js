{}// ==================== MEMORY OPTIMIZATION ====================
global.gc = global.gc || (() => {});
let memoryCleanInterval = null;

function setupMemoryOptimization() {
    memoryCleanInterval = setInterval(() => {
        try {
            if (global.gc) {
                global.gc();
            }
            const memoryUsage = process.memoryUsage();
            console.log(`🔄 Memory Cleaned - Heap: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
        } catch (err) {
            console.error("Memory cleanup error:", err.message);
        }
    }, 20000);
}

setupMemoryOptimization();

// ==================== ULTRA PRO SPEED BOOSTER ====================
const speedCache = {
    groups: new Map(),
    users: new Map(),
    commands: null,
    lastClean: Date.now()
};

let perfStats = {
    msgCount: 0,
    avgResponse: 0,
    startTime: Date.now()
};

const msgQueue = [];
let processing = false;

const processQueue = async () => {
    if (processing || msgQueue.length === 0) return;
    processing = true;
    
    const batch = msgQueue.splice(0, 3);
    for (const msg of batch) {
        try {
            await handleMessageUltra(msg);
        } catch(e) {}
        await new Promise(r => setTimeout(r, 30));
    }
    
    processing = false;
    if (msgQueue.length > 0) setTimeout(processQueue, 10);
};

setInterval(() => {
    const now = Date.now();
    const uptime = Math.floor((now - perfStats.startTime) / 1000);
    
    console.log(`
    ⚡ ULTRA PRO STATS ⚡
    ⏱️  Uptime: ${uptime}s
    📨 Processed: ${perfStats.msgCount}
    ⚡ Speed: ${perfStats.avgResponse}ms
    💾 Cache: ${speedCache.groups.size} groups
    🧠 Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)}MB
    `);
    
    if (now - speedCache.lastClean > 180000) {
        for (const [key, val] of speedCache.groups.entries()) {
            if (now - val.timestamp > 300000) speedCache.groups.delete(key);
        }
        speedCache.lastClean = now;
    }
}, 60000);

const {
  default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    jidNormalizedUser,
    isJidBroadcast,
    getContentType,
    proto,
    generateWAMessageContent,
    generateWAMessage,
    AnyMessageContent,
    prepareWAMessageMedia,
    areJidsSameUser,
    downloadContentFromMessage,
    MessageRetryMap,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    generateMessageID, makeInMemoryStore,
    jidDecode,
    fetchLatestBaileysVersion,
    Browsers
} = require('@whiskeysockets/baileys');

const l = console.log;
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions');
const { AntiDelDB, initializeAntiDeleteSettings, setAnti, getAnti, getAllAntiDeleteSettings, saveContact, loadMessage, getName, getChatSummary, saveGroupMetadata, getGroupMetadata, saveMessageCount, getInactiveGroupMembers, getGroupMembersMessageCount, saveMessage } = require('./data');
const fs = require('fs');
const ff = require('fluent-ffmpeg');
const P = require('pino');
const config = require('./config');
const GroupEvents = require('./lib/groupevents');
const qrcode = require('qrcode-terminal');
const StickersTypes = require('wa-sticker-formatter');
const util = require('util');
const { sms, downloadMediaMessage, AntiDelete } = require('./lib');
const FileType = require('file-type');
const axios = require('axios');
const { File } = require('megajs');
const { fromBuffer } = require('file-type');
const bodyparser = require('body-parser');
const os = require('os');
const Crypto = require('crypto');
const path = require('path');
const prefix = config.PREFIX;

const ownerNumber = ['923266105873'];

const ownerNumber = config.OWNER_NUMBER ? config.OWNER_NUMBER.split(',').map(n => n.trim()) : ['923266105873'];

// âœ… Global Context Info
const globalContextInfo = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363425143124298@newsletter',
        newsletterName: 'ð…ð€ðˆð™ð€ð-ðŒðƒðŸª„ðŸŽ€',
        serverMessageId: 143
    }
};

const tempDir = path.join(os.tmpdir(), 'cache-temp')
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
}

const clearTempDir = () => {
    try {
        const files = fs.readdirSync(tempDir)
        const now = Date.now()
        for (const file of files) {
            const filePath = path.join(tempDir, file)
            try {
                const stats = fs.statSync(filePath)
                if (now - stats.mtimeMs > 10 * 60 * 1000) {
                    fs.unlinkSync(filePath)
                }
            } catch (err) {}
        }
    } catch (err) {}
}

// Clear the temp directory every 5 minutes
setInterval(clearTempDir, 5 * 60 * 1000);

// ==============================
// ðŸ“¦ MESSAGE STORE FOR ANTI-DELETE
// ==============================
const messageStore = new Map();

// ==============================
// ðŸ” SESSION MANAGEMENT - Ø¢Ù¾ Ú©Ø§ Ø§Ù¾Ù†Ø§ system
// ==============================
async function loadSession() {
    try {
        const credsPath = './sessions/creds.json';
        
        if (!fs.existsSync('./sessions')) {
            fs.mkdirSync('./sessions', { recursive: true });
        }
        
        // Clean old sessions if needed
        if (fs.existsSync(credsPath)) {
            try {
                // Check if session is valid before deleting
                const credsData = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
                if (!credsData || !credsData.me) {
                    fs.unlinkSync(credsPath);
                    console.log('â™»ï¸ Invalid session removed');
                }
            } catch (e) {
                // If can't parse, remove it
                try {
                    fs.unlinkSync(credsPath);
                    console.log('â™»ï¸ Corrupted session removed');
                } catch (err) {
                    // Ignore error
                }
            }
        }
        
        if (config.SESSION_ID && config.SESSION_ID.trim() !== "" && !fs.existsSync(credsPath)) {
            console.log("ðŸ“¦ Loading session from SESSION_ID...");
            
            let sessdata = config.SESSION_ID;
            
            const prefixes = ['FAIZAN-MD~', 'BOSS-MD~', 'EMYOU~', 'BOT~'];
            for (const p of prefixes) {
                if (sessdata.includes(p)) {
                    sessdata = sessdata.split(p)[1];
                    break;
                }
            }
            
            sessdata = sessdata.trim();
            while (sessdata.length % 4 !== 0) {
                sessdata += '=';
            }
            
            const decodedData = Buffer.from(sessdata, 'base64').toString('utf-8');
            
            try {
                const jsonData = JSON.parse(decodedData);
                fs.writeFileSync(credsPath, JSON.stringify(jsonData, null, 2));
                console.log("âœ… Session loaded successfully!");
            } catch (jsonErr) {
                console.log("âš ï¸ Not JSON, saving as raw");
                fs.writeFileSync(credsPath, decodedData);
            }
        }
    } catch (e) {
        console.log('Session Error: ' + e.message);
    }
}

const express = require("express");
const app = express();
const port = process.env.PORT || 9090;

//=============================================

async function connectToWA() {
    console.log("Connecting to WhatsApp â³ï¸...");
    
    // Load session before connecting
    await loadSession();
    
    const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/sessions/')
    var { version } = await fetchLatestBaileysVersion()

    const conn = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        browser: Browsers.macOS('Desktop'),
        syncFullHistory: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' }))
        },
        version,
        getMessage: async (key) => {
            if (messageStore.has(key.id)) {
                return messageStore.get(key.id).message
            }
            return {
                conversation: ''
            }
        }
    })
    
    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update
        
        if (qr) {
            console.log('QR Code received, scan with WhatsApp:')
            qrcode.generate(qr, { small: true })
        }
        
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const errorMsg = lastDisconnect?.error?.message || '';
            
            console.log(`âŒ Connection closed - Status: ${statusCode}`);
            console.log(`âŒ Error message: ${errorMsg}`);
            
            // FIXED: SESSION ERROR HANDLER (Bad MAC, 401, 403)
            if (errorMsg.includes('Bad MAC') || errorMsg.includes('closed session') || statusCode === 401 || statusCode === 403) {
                console.log('âš ï¸ Session corrupted! Deleting sessions folder...');
                try {
                    const sessionPath = path.join(__dirname, 'sessions');
                    if (fs.existsSync(sessionPath)) {
                        fs.rmSync(sessionPath, { recursive: true, force: true });
                        console.log('âœ… Sessions deleted. Will generate new QR code in 3 seconds...');
                        setTimeout(() => {
                            console.log('ðŸ”„ Reconnecting with new session...');
                            connectToWA();
                        }, 3000);
                        return;
                    }
                } catch (e) {
                    console.log('Error deleting sessions:', e.message);
                }
            }
            
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('Connection closed due to:', lastDisconnect?.error, ', reconnecting:', shouldReconnect)
            
            if (shouldReconnect) {
                setTimeout(() => connectToWA(), 5000)
            } else {
                console.log('Logged out. Please delete sessions folder and restart.')
            }
        } else if (connection === 'open') {
            console.log('ðŸ§¬ Installing Plugins')
            try {
                const plugins = fs.readdirSync("./plugins/")
                let loadedCount = 0
                for (const plugin of plugins) {
                    if (path.extname(plugin).toLowerCase() == ".js") {
                        try {
                            require("./plugins/" + plugin)
                            loadedCount++
                        } catch (pluginErr) {
                            console.error(`âŒ Error loading plugin ${plugin}:`, pluginErr.message)
                        }
                    }
                }
                console.log(`âœ… Plugins installed: ${loadedCount}/${plugins.length}`)
            } catch (err) {
                console.error("âŒ Plugin loading error:", err)
            }
            
            console.log('âœ… Bot connected to whatsapp')
            console.log(`ðŸ‘¤ Bot Number: ${conn.user.id.split(':')[0]}`)
            
            // ==================== CUSTOM WELCOME MESSAGE ====================
            setTimeout(() => {
                let welcomeMsg = `â•­â”€â”€â”€â”€â¬¡ ð…ð€ðˆð™ð€ð-ðŒðƒ _â¸â·Â³_ â¬¡â”€â”€â”€â”€
â”œðŸ¤– *Status:* ONLINE âœ…
â”œðŸ”£ *Prefix:* ${prefix}
â”œðŸ‘‘ *Owner:* ${config.OWNER_NAME || 'FAIZAN JUTT'}
â•°â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

> Simple, Straight Forward But Loaded With Features ðŸŽŠ
> Â© á´˜á´á´¡á´‡Ê€á´‡á´… Ê™Ê ð…ð€ðˆð™ð€ð-ðŒðƒ â£ï¸`;
                
                conn.sendMessage(conn.user.id, { 
                    image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/ejufwa.jpg' }, 
                    caption: welcomeMsg,
                    contextInfo: globalContextInfo 
                }).catch(err => console.error("Welcome message error:", err.message))
                
                conn.sendMessage(ownerNumber[0] + '@s.whatsapp.net', {
                    text: `âœ… *FAIZAN-MD ACTIVATED*\n\nBot is now online!\nPrefix: ${prefix}`,
                    contextInfo: globalContextInfo
                }).catch(() => {})
                
                console.log("âœ… Welcome messages sent to bot number and owner")
            }, 5000)
        }
    })
    
    conn.ev.on('creds.update', saveCreds)
    
    // ==============================
    // ðŸ“¥ STORE MESSAGES FOR ANTI-DELETE
    // ==============================
    conn.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message) return;
        
        // âš ï¸ IGNORE status@broadcast messages in anti-delete
        if (msg.key.remoteJid === 'status@broadcast') {
            return;
        }
        
        // Store message for anti-delete
        const messageKey = `${msg.key.remoteJid}_${msg.key.id}`;
        messageStore.set(messageKey, {
            message: msg,
            sender: msg.key.participant || msg.key.remoteJid,
            chat: msg.key.remoteJid,
            timestamp: Date.now()
        });
        
        // Store for getMessage
        messageStore.set(msg.key.id, msg);
        
        // Clean old messages (older than 24 hours)
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        for (const [key, value] of messageStore.entries()) {
            if (value.timestamp && value.timestamp < oneDayAgo) {
                messageStore.delete(key);
            }
        }
    });
    
    // ==============================
    // ðŸ—‘ï¸ ANTI-DELETE HANDLER
    // ==============================
    if (config.ANTI_DELETE === 'true') {
        conn.ev.on('messages.update', async (updates) => {
            for (const update of updates) {
                try {
                    if (update.update.message === null) {
                        // Message was deleted
                        const messageKey = `${update.key.remoteJid}_${update.key.id}`;
                        const storedMessage = messageStore.get(messageKey);
                        
                        // âš ï¸ IGNORE status@broadcast messages in anti-delete
                        if (update.key.remoteJid === 'status@broadcast') {
                            continue;
                        }
                        
                        if (storedMessage) {
                            const botJid = conn.user.id;  // bot number Ú©Ùˆ
                            const isGroup = storedMessage.chat.endsWith('@g.us');
                            
                            // Validate JIDs before sending
                            if (!update.key.remoteJid || !storedMessage.sender) {
                                console.log('Invalid JID in anti-delete, skipping...');
                                continue;
                            }
                            
                            let deletedBy = update.key.participant || storedMessage.sender;
                            let chatName = storedMessage.chat;
                            
                            if (isGroup) {
                                try {
                                    const groupMetadata = await conn.groupMetadata(storedMessage.chat);
                                    chatName = groupMetadata.subject;
                                } catch (e) {
                                    chatName = storedMessage.chat;
                                }
                            }
                            
                            const senderName = storedMessage.message.pushName || deletedBy.split('@')[0];
                            const deletedByName = deletedBy.split('@')[0];
                            
                            // Detect message type
                            let msgType = "ðŸ“ TEXT";
                            if (storedMessage.message.message?.imageMessage) msgType = "ðŸ–¼ï¸ IMAGE";
                            else if (storedMessage.message.message?.videoMessage) msgType = "ðŸŽ¥ VIDEO";
                            else if (storedMessage.message.message?.audioMessage) msgType = "ðŸ”Š AUDIO";
                            else if (storedMessage.message.message?.documentMessage) msgType = "ðŸ“„ DOCUMENT";
                            else if (storedMessage.message.message?.stickerMessage) msgType = "ðŸ·ï¸ STICKER";
                            
                            let notificationText = `â•­â”€â”€â”€â”€â¬¡ ð…ð€ðˆð™ð€ð-ðŒðƒ _â¸â·Â³_ â¬¡â”€â”€â”€â”€\n`;
                            notificationText += `â”œðŸ“Œ *TYPE:* ${msgType}\n`;
                            notificationText += `â”œðŸ‘¤ *SENDER:* @${senderName.replace('@', '')}\n`;
                            
                            if (isGroup) {
                                notificationText += `â”œðŸ‘¥ *GROUP:* ${chatName}\n`;
                            }
                            
                            notificationText += `â”œðŸ—‘ï¸ *DELETED BY:* @${deletedByName}\n`;
                            notificationText += `â”œâ° *TIME:* ${new Date().toLocaleString()}\n`;
                            notificationText += `â•°ðŸ’¬ *MESSAGE:* Content Below ðŸ”½\n\n`;
                            notificationText += `ðŸ“¨ *Forwarding deleted message...*`;
                            
                            // Send notification
                            await conn.sendMessage(botJid, { 
                                text: notificationText,
                                mentions: [deletedBy, storedMessage.sender],
                                contextInfo: globalContextInfo
                            });
                            
                            // Forward the deleted message
                            try {
                                await conn.copyNForward(botJid, storedMessage.message, false, {
                                    contextInfo: globalContextInfo
                                });
                            } catch (e) {
                                await conn.sendMessage(botJid, { 
                                    text: `âŒ Could not forward message content: ${e.message}`,
                                    contextInfo: globalContextInfo
                                });
                            }
                            
                            // Clean up
                            messageStore.delete(messageKey);
                            console.log(`âœ… Anti-delete: ${msgType} from ${senderName} forwarded to owner`);
                        }
                    }
                } catch (e) {
                    console.log('Anti-delete error:', e.message);
                }
            }
        });
    }
      
    //=============status handling==============
    conn.ev.on('messages.upsert', async (mek) => {
        mek = mek.messages[0]
        if (!mek.message) return
        mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
        ? mek.message.ephemeralMessage.message 
        : mek.message;
        
        if (config.READ_MESSAGE === 'true') {
            await conn.readMessages([mek.key]);
            console.log(`Marked message from ${mek.key.remoteJid} as read.`);
        }
        
        if (mek.message.viewOnceMessageV2)
            mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
        
        if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_SEEN === "true") {
            await conn.readMessages([mek.key])
        }
        
        if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REACT === "true") {
            try {
                const jawadlike = await conn.decodeJid(conn.user.id);
                const emojis = ['â¤ï¸', 'ðŸ’¸', 'ðŸ˜‡', 'ðŸ‚', 'ðŸ’¥', 'ðŸ’¯', 'ðŸ”¥', 'ðŸ’«', 'ðŸ’Ž', 'ðŸ’—', 'ðŸ¤', 'ðŸ–¤', 'ðŸ‘€', 'ðŸ™Œ', 'ðŸ™†', 'ðŸš©', 'ðŸ¥°', 'ðŸ’', 'ðŸ˜Ž', 'ðŸ¤Ž', 'âœ…', 'ðŸ«€', 'ðŸ§¡', 'ðŸ˜', 'ðŸ˜„', 'ðŸŒ¸', 'ðŸ•Šï¸', 'ðŸŒ·', 'â›…', 'ðŸŒŸ', 'ðŸ—¿', 'ðŸ’œ', 'ðŸ’™', 'ðŸŒ', 'ðŸ–¤', 'ðŸ’š'];
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                if (mek.key.participant) {
                    await conn.sendMessage(mek.key.remoteJid, {
                        react: {
                            text: randomEmoji,
                            key: mek.key,
                        }
                    }, { statusJidList: [mek.key.participant, jawadlike] });
                }
            } catch (e) {
                console.log('Status react error:', e.message);
            }
        }
        
        if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REPLY === "true") {
            try {
                const user = mek.key.participant
                if (user) {
                    const text = `${config.AUTO_STATUS_MSG || 'Nice status!'}`
                    await conn.sendMessage(user, { text: text, react: { text: 'âœˆï¸', key: mek.key } }, { quoted: mek })
                }
            } catch (e) {
                console.log('Status reply error:', e.message);
            }
        }
        
        let jawadik = mek.message.viewOnceMessageV2
        let jawadik1 = mek.mtype === "viewOnceMessage"
        
        if (jawadik && config.ANTI_VV === "true") {
            try {
                if (jawadik.message.imageMessage) {
                    let cap = jawadik.message.imageMessage.caption || '';
                    let anu = await conn.downloadAndSaveMediaMessage(jawadik.message.imageMessage);
                    return conn.sendMessage(ownerNumber[0] + '@s.whatsapp.net', { 
                        image: { url: anu }, 
                        caption: cap,
                        contextInfo: globalContextInfo 
                    }, { quoted: mek });
                } 
                if (jawadik.message.videoMessage) {
                    let cap = jawadik.message.videoMessage.caption || '';
                    let anu = await conn.downloadAndSaveMediaMessage(jawadik.message.videoMessage);
                    return conn.sendMessage(ownerNumber[0] + '@s.whatsapp.net', { 
                        video: { url: anu }, 
                        caption: cap,
                        contextInfo: globalContextInfo 
                    }, { quoted: mek });
                } 
                if (jawadik.message.audioMessage) {
                    let anu = await conn.downloadAndSaveMediaMessage(jawadik.message.audioMessage);
                    return conn.sendMessage(ownerNumber[0] + '@s.whatsapp.net', { 
                        audio: { url: anu },
                        contextInfo: globalContextInfo 
                    }, { quoted: mek });
                }
            } catch (e) {
                console.log('Anti-VV error:', e.message);
            }
        }
        
        const m = sms(conn, mek)
        const type = getContentType(mek.message)
        const content = JSON.stringify(mek.message)
        const from = mek.key.remoteJid
        const quoted = type == 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo != null ? mek.message.extendedTextMessage.contextInfo.quotedMessage || [] : []
        const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : ''
        const isCmd = body.startsWith(prefix)
        const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''
        const args = body.trim().split(/ +/).slice(1)
        const q = args.join(' ')
        const isGroup = from.endsWith('@g.us')
        const sender = mek.key.fromMe ? (conn.user.id.split(':')[0] + '@s.whatsapp.net' || conn.user.id) : (mek.key.participant || mek.key.remoteJid)
        const senderNumber = sender.split('@')[0]
        const botNumber = conn.user.id.split(':')[0]
        const pushname = mek.pushName || 'Sin Nombre'
        const isMe = botNumber.includes(senderNumber)
        const isOwner = ownerNumber.includes(senderNumber) || isMe
        const botNumber2 = await jidNormalizedUser(conn.user.id);
        const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(e => {}) : ''
        const groupName = isGroup ? groupMetadata.subject : ''
        const participants = isGroup ? await groupMetadata.participants : ''
        const groupAdmins = isGroup ? await getGroupAdmins(participants) : ''
        const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false
        const isAdmins = isGroup ? groupAdmins.includes(sender) : false
        const isReact = m.message.reactionMessage ? true : false
        const reply = (teks) => {
            conn.sendMessage(from, { text: teks, contextInfo: globalContextInfo }, { quoted: mek })
        }
        
        // Auto React
        if (!isReact && config.AUTO_REACT === 'true') {
            const reactions = isOwner 
                ? ["ðŸ‘‘", "ðŸ’€", "ðŸ“Š", "âš™ï¸", "ðŸ§ ", "ðŸŽ¯"]
                : ['â¤ï¸', 'ðŸ”¥', 'ðŸ‘', 'ðŸ˜Š', 'ðŸŽ‰', 'ðŸŒŸ'];
            const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
            m.react(randomReaction);
        }

        // Custom React
        if (!isReact && config.CUSTOM_REACT === 'true') {
            const reactions = (config.CUSTOM_REACT_EMOJIS || 'ðŸª„,ðŸ’–,ðŸ’—,â¤ï¸â€ðŸ©¹,ðŸ«€,ðŸ§¡,ðŸ’›,ðŸ’š,ðŸ’™,ðŸ’œ,ðŸ¤Ž,ðŸ–¤,ðŸ¤').split(',');
            const randomReaction = reactions[Math.floor(Math.random() * reactions.length)].trim();
            m.react(randomReaction);
        }
        
        //==========WORKTYPE============ 
        if (!isOwner && config.MODE === "private") return
        if (!isOwner && isGroup && config.MODE === "inbox") return
        if (!isOwner && !isGroup && config.MODE === "groups") return

        // take commands 
        const events = require('./command')
        const cmdName = isCmd ? body.slice(1).trim().split(" ")[0].toLowerCase() : false;
        if (isCmd) {
            const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName))
            if (cmd) {
                if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } })

                try {
                    cmd.function(conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply });
                } catch (e) {
                    console.error("[PLUGIN ERROR] " + e);
                }
            }
        }
        events.commands.map(async (command) => {
            if (body && command.on === "body") {
                command.function(conn, mek, m, { from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
            } else if (mek.q && command.on === "text") {
                command.function(conn, mek, m, { from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
            } else if (
                (command.on === "image" || command.on === "photo") &&
                mek.type === "imageMessage"
            ) {
                command.function(conn, mek, m, { from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
            } else if (
                command.on === "sticker" &&
                mek.type === "stickerMessage"
            ) {
                command.function(conn, mek, m, { from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
            }
        });

    })
    
    //===================================================   
    conn.decodeJid = jid => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return (
                (decode.user &&
                    decode.server &&
                    decode.user + '@' + decode.server) ||
                jid
            );
        } else return jid;
    };
    
    //===================================================
    conn.copyNForward = async (jid, message, forceForward = false, options = {}) => {
        let vtype
        if (options.readViewOnce) {
            message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
            vtype = Object.keys(message.message.viewOnceMessage.message)[0]
            delete (message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
            delete message.message.viewOnceMessage.message[vtype].viewOnce
            message.message = {
                ...message.message.viewOnceMessage.message
            }
        }

        let mtype = Object.keys(message.message)[0]
        let content = await generateForwardMessageContent(message, forceForward)
        let ctype = Object.keys(content)[0]
        let context = {}
        if (mtype != "conversation") context = message.message[mtype].contextInfo
        content[ctype].contextInfo = {
            ...context,
            ...content[ctype].contextInfo
        }
        const waMessage = await generateWAMessageFromContent(jid, content, options ? {
            ...content[ctype],
            ...options,
            ...(options.contextInfo ? {
                contextInfo: {
                    ...content[ctype].contextInfo,
                    ...options.contextInfo
                }
            } : {})
        } : {})
        await conn.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id })
        return waMessage
    }
    
    //=================================================
    conn.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(quoted, messageType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        let type = await FileType.fromBuffer(buffer)
        trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
        await fs.writeFileSync(trueFileName, buffer)
        return trueFileName
    }
    
    //=================================================
    conn.downloadMediaMessage = async (message) => {
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(message, messageType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }

        return buffer
    }

    //================================================
    conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
        let mime = '';
        let res = await axios.head(url)
        mime = res.headers['content-type']
        if (mime.split("/")[1] === "gif") {
            return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, contextInfo: globalContextInfo, ...options }, { quoted: quoted, ...options })
        }
        let type = mime.split("/")[0] + "Message"
        if (mime === "application/pdf") {
            return conn.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, contextInfo: globalContextInfo, ...options }, { quoted: quoted, ...options })
        }
        if (mime.split("/")[0] === "image") {
            return conn.sendMessage(jid, { image: await getBuffer(url), caption: caption, contextInfo: globalContextInfo, ...options }, { quoted: quoted, ...options })
        }
        if (mime.split("/")[0] === "video") {
            return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', contextInfo: globalContextInfo, ...options }, { quoted: quoted, ...options })
        }
        if (mime.split("/")[0] === "audio") {
            return conn.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', contextInfo: globalContextInfo, ...options }, { quoted: quoted, ...options })
        }
    }
    
    //==========================================================
    conn.cMod = (jid, copy, text = '', sender = conn.user.id, options = {}) => {
        let mtype = Object.keys(copy.message)[0]
        let isEphemeral = mtype === 'ephemeralMessage'
        if (isEphemeral) {
            mtype = Object.keys(copy.message.ephemeralMessage.message)[0]
        }
        let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message
        let content = msg[mtype]
        if (typeof content === 'string') msg[mtype] = text || content
        else if (content.caption) content.caption = text || content.caption
        else if (content.text) content.text = text || content.text
        if (typeof content !== 'string') msg[mtype] = {
            ...content,
            ...options
        }
        if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
        else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
        if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
        else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
        copy.key.remoteJid = jid
        copy.key.fromMe = sender === conn.user.id

        return proto.WebMessageInfo.fromObject(copy)
    }

    //=====================================================
    conn.getFile = async (PATH, save) => {
        let res
        let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
        let type = await FileType.fromBuffer(data) || {
            mime: 'application/octet-stream',
            ext: '.bin'
        }
        let filename = path.join(__filename, __dirname + new Date * 1 + '.' + type.ext)
        if (data && save) fs.promises.writeFile(filename, data)
        return {
            res,
            filename,
            size: await getSizeMedia(data),
            ...type,
            data
        }
    }
    
    //=====================================================
    conn.sendFile = async (jid, PATH, fileName, quoted = {}, options = {}) => {
        let types = await conn.getFile(PATH, true)
        let { filename, size, ext, mime, data } = types
        let type = '',
            mimetype = mime,
            pathFile = filename
        if (options.asDocument) type = 'document'
        if (options.asSticker || /webp/.test(mime)) {
            let { writeExif } = require('./exif.js')
            let media = { mimetype: mime, data }
            pathFile = await writeExif(media, { packname: config.STICKER_NAME || 'FAIZAN-MD', author: config.OWNER_NAME || 'FAIZAN', categories: options.categories ? options.categories : [] })
            await fs.promises.unlink(filename)
            type = 'sticker'
            mimetype = 'image/webp'
        } else if (/image/.test(mime)) type = 'image'
        else if (/video/.test(mime)) type = 'video'
        else if (/audio/.test(mime)) type = 'audio'
        else type = 'document'
        await conn.sendMessage(jid, {
            [type]: { url: pathFile },
            mimetype,
            fileName,
            contextInfo: globalContextInfo,
            ...options
        }, { quoted, ...options })
        return fs.promises.unlink(pathFile)
    }
    
    //=====================================================
    conn.parseMention = async (text) => {
        return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
    }
    
    //=====================================================
    conn.sendContact = async (jid, kon, quoted = '', opts = {}) => {
        let list = [];
        for (let i of kon) {
            list.push({
                displayName: await conn.getName(i + '@s.whatsapp.net'),
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await conn.getName(i + '@s.whatsapp.net')}\nFN:${config.OWNER_NAME}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Click here to chat\nitem2.EMAIL;type=INTERNET:${config.OWNER_EMAIL || ''}\nitem2.X-ABLabel:Email\nitem3.URL:${config.REPO_URL || ''}\nitem3.X-ABLabel:GitHub\nitem4.ADR:;;${config.LOCATION || ''};;;;\nitem4.X-ABLabel:Region\nEND:VCARD`,
            });
        }
        conn.sendMessage(jid, {
            contacts: {
                displayName: `${list.length} Contact`,
                contacts: list,
            },
            ...opts,
        }, { quoted });
    };
    
    //=====================================================
    conn.setStatus = status => {
        conn.query({
            tag: 'iq',
            attrs: {
                to: '@s.whatsapp.net',
                type: 'set',
                xmlns: 'status',
            },
            content: [{
                tag: 'status',
                attrs: {},
                content: Buffer.from(status, 'utf-8'),
            }],
        });
        return status;
    };
    
    conn.serializeM = mek => sms(conn, mek);
    
    return conn;
}

app.get("/", (req, res) => {
    res.send("ð…ð€ðˆð™ð€ð-ðŒðƒâ¸â·Â³ STARTED âœ…");
});

app.listen(port, () => console.log(`Server listening on port http://localhost:${port}`));

setTimeout(() => {
    connectToWA()
}, 4000);

process.on('SIGINT', () => {
    console.log('Cleaning up before exit...');
    if (memoryCleanInterval) clearInterval(memoryCleanInterval);
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});