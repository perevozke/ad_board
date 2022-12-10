const User = require('./models/User')
const Role = require('./models/Role')
const Desk = require('./models/Desk')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const {validationResult} = require('express-validator')
const {secret} = require("./config")

const generateAccessToken = (id, roles) => {
    const payload = {
        id,
        roles
    }
    return jwt.sign(payload, secret, {expiresIn: "24h"})
}

class authController {
    async registration(req, res) {
        try {
            const errors = validationResult(req)
            if(!errors.isEmpty()) {
                return res.status(400).json({message: "Ошибка при регистрации", errors})
            }
            const {password, name, email, phone} = req.body
            const candidatePhone = await User.findOne({phone})
                if (candidatePhone) {
                    return res.status(400).json({message: "Пользователь с таким телефоном уже существует"})
                }
            const candidateEmail = await User.findOne({email})
                if (candidateEmail) {
                    return res.status(400).json({message: "Пользователь с такой почтой уже существует"})
                }
            let reEmail = /^[\w-\.]+@[\w-]+\.[a-z]{2,4}$/i;
            let validEmail = reEmail.test(email)
            if (!validEmail) {
                return res.status(400).json({message: "Неправильный формат почты"})
            }
            let rePhone = /^[\d\+][\d\(\)\ -]{4,14}\d$/;
            let valid = rePhone.test(phone);
            if (!validEmail) {
                return res.status(400).json({message: "Неправильный формат телефона"})
            }
            const hashPassword = bcrypt.hashSync(password, 5);
            const userRole = await Role.findOne({value: "NONVERIFIED"})
            const user = new User({name, password: hashPassword, phone, email, roles: [userRole.value], tgid: 'none'})
            await user.save()
            return res.json({message: "Пользователь успешно зарегестрирован"})
        } catch (e) {
            console.log(e)
            res.status(400).json({message: 'Reg error'})
        }
    }

    async login(req, res) {
        try {
            const{password, email} = req.body
            const user = await User.findOne({email})
            if (!user) {
                return res.status(400).json({message: `Пользователь с таким ${email} не найден`})
            }
            const validPassword = bcrypt.compareSync(password, user.password)
            if (!validPassword) {
                return res.status(400).json({message: `Введен неправильный пароль`})
            }
            const token = generateAccessToken(user._id, user.roles)
            return res.json({token})
        } catch (e) {
            console.log(e)
            res.status(400).json({message: 'Login error'})
        }
    }

    async getUsers(req, res) {
        try {
            const users = await User.find()
            res.json(users)
        } catch (e) {
            console.log(e)
        }
    }

    async getDesks(req, res) {
        try {
            const desks = await Desk.find()
            res.json(desks)
        } catch (e) {
            console.log(e)
        }
    }

    async descCreation(req, res) {
        try {
            const errors = validationResult(req)
            if(!errors.isEmpty()) {
                return res.status(400).json({message: "Ошибка при создании объявления", errors})
            }
            const {title, description} = req.body
            const desk = new Desk({title, description, ownership: req.user.id})
            await desk.save()
            return res.json({message: "Объявление успешно создано"})
        } catch (e) {
            console.log(e)
        }
    }

    async deskUpdate(req, res) {
        try {
            const errors = validationResult(req)
            if(!errors.isEmpty()) {
                return res.status(400).json({message: "Ошибка при обновлении объявления", errors})
            }
            const {newtitle, newdescription, deskID} = req.body
            const deskOwnershipCheck = await Desk.findOne({_id: deskID})
            if ((deskOwnershipCheck.ownership != req.user.id) && ((req.user.roles[0] != 'ADMIN') || (req.user.roles[0] != 'OWNER'))) {
                return res.status(400).json({message: "У вас нет доступа"})
            }
            const desk = await Desk.findOneAndUpdate({_id: deskID}, {title: newtitle, description: newdescription}, (err) => {
                if (err) {
                    console.log(err)
                    return res.status(400).json({message: "Не удалось обновить объявление или данные идентичны"})
                }
                return res.json({message: "Объявление успешно изменено"})
            })
            desk.save()
        } catch (e) {
            console.log(e)
        }
    }

    async deskDelete(req, res) {
        try {
            const errors = validationResult(req)
            if(!errors.isEmpty()) {
                return res.status(400).json({message: "Ошибка при удалении объявления", errors})
            }
            const {deskID} = req.body
            const deskOwnershipCheck = await Desk.findOne({_id: deskID})
            console.log(deskOwnershipCheck.ownership)
            console.log(req.user.id)
            if (deskOwnershipCheck.ownership != req.user.id && ((req.user.roles[0] != 'ADMIN') || (req.user.roles[0] != 'OWNER'))) {
                return res.status(400).json({message: "У вас нет доступа"})
            }
            const desk = await Desk.deleteOne({_id: deskID})
            return res.json({message: "Объявление успешно удалено"})
        } catch (e) {
            console.log(e)
        }
    }

    async updateToAdmin(req, res) {
        try {
            const errors = validationResult(req)
            if(!errors.isEmpty()) {
                return res.status(400).json({message: "Ошибка при обновлении пользователя", errors})
            }
            console.log(req.user.roles[0])
            if (req.user.roles[0] != 'OWNER') {
                return res.status(400).json({message: "У вас нет доступа"})
            }
            const {userID} = req.body
            const userRole = await Role.findOne({value: "ADMIN"})
            const user = await User.findOneAndUpdate({_id: userID}, {roles: [userRole.value]}, (err) => {
                if (err) {
                    console.log(err)
                    return res.status(400).json({message: "Не удалось обновить пользователя или он уже обладает админ правами"})
                }
                return res.json({message: "Пользователю успешно выданы админ права"})
            })
            user.save()
        } catch (e) {
            console.log(e)
        }
    }

    async updateToAdminTelegram(req, res) {
        try {
            const errors = validationResult(req)
            if(!errors.isEmpty()) {
                return res.status(400).json({message: "Ошибка при обновлении пользователя", errors})
            }
            if(req.user.roles[0] != 'OWNER') {
                return res.status(400).json({message: "У вас нет доступа"})
            }
            const {idInTelegram, userID} = req.body
                const admin = await User.findOne({_id: userID})
                if (admin.roles[0] != 'ADMIN' && admin.roles[0] != 'OWNER') {
                    return res.status(400).json({message: "Сперва дайте юзеру админ права"})
                }
            const user = await User.findOneAndUpdate({_id: userID}, {tgid: idInTelegram}, (err) => {
                if (err) {
                    console.log(err)
                    return res.status(400).json({message: "Не удалось обновить права админа"})
                }
                return res.json({message: "Админу успешно выданы админ права в телеграме"})
            })
            user.save()
        } catch (e) {
            console.log(e)
        }
    }
}

module.exports = new authController()