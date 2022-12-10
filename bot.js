require('dotenv').config()
const mongoose = require('mongoose')
const TelegramApi = require('node-telegram-bot-api')
const User = require("./models/User");
const Role = require("./models/Role");
const TGTOKEN = process.env.TGTOKEN


const bot = new TelegramApi(TGTOKEN, {polling: true})
 const start = async () => {
     try {
         await mongoose.connect(`mongodb+srv://perevozke:tp7ldamVoPaPwiLH@cluster0.f3p5zte.mongodb.net/auth_roles?retryWrites=true&w=majority`)
         console.log('connected to db')
     } catch (e) {
         console.log(e);
     }

    bot.setMyCommands([
        {command: '/start', description: 'Вывести заявки'},
        {command: '/verify', description: 'Подтвердить юзера'}
    ])

    bot.on('message',  async msg=> {


        const text = msg.text
        const username = msg.chat.username
        const chatID = msg.chat.id

        if (text === '/start') {
            try {
                const admin = await User.findOne({tgid: msg.chat.username})
                if(admin == null) {
                    return bot.sendMessage(chatID, 'У вас нет админ прав')
                }
                const users = await User.find({roles: ['NONVERIFIED']})
                async function nonVerifiedUsersOutput(){
                    let i = 1

                    for await (const user of users) {
                        await bot.sendMessage(chatID, `Заявка на регистрацию #${i}`)
                        i++
                        await bot.sendMessage(chatID, `ID: ${user.id}`)
                        await bot.sendMessage(chatID, `Email: ${user.email}`)
                        await bot.sendMessage(chatID, `Phone: ${user.phone}`)
                        await bot.sendMessage(chatID, `Name: ${user.name}`)
                    }
                }
                nonVerifiedUsersOutput();
            } catch (e) {
                console.log(e)
            }
        }

        if (text === '/verify') {
            try {
                const admin = await User.findOne({tgid: msg.chat.username})
                if(admin == null) {
                    return bot.sendMessage(chatID, 'У вас нет админ прав')
                }
                await bot.sendMessage(chatID, 'Введите ID юзера, которого хотите подтвердить:')
            } catch (e) {
                console.log(e)
            }
            bot.on('message', async msg => {

                user_id = msg.text
                const userRole = await Role.findOne({value: "USER"})
                User.findByIdAndUpdate(user_id, {roles: [userRole.value]},
                    function (err, docs) {
                        if (err){
                            console.log(err)
                            return bot.sendMessage(chatID, 'Ошибка')
                        }
                        else{
                            console.log("Updated User : ", docs);
                            return bot.sendMessage(chatID, 'Юзер подтверджен')
                        }
                    })

            })
        }
    })
}


start()