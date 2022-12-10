const Router = require('express')
const router = new Router()
const controller = require('./authController')
const {check} = require('express-validator')
const authMiddleware = require('./middleware/authMiddleware')
const roleMiddleware = require('./middleware/roleMiddleware')

router.post('/registration',
    [check('name', "Имя пользователя не может быть пустым").notEmpty(),
        check('password', "Пароль пользователя не может быть пустым").isLength({min:4, max:16}),
        check('email', "Email пользователя не может быть пустым").notEmpty(),
        check('phone', "Телефон пользователя не может быть пустым").notEmpty()
    ], controller.registration)
router.post('/login', controller.login)
router.post('/deskcreation', authMiddleware, roleMiddleware(['USER', 'ADMIN', 'OWNER']), controller.descCreation)
router.get('/users', roleMiddleware(['ADMIN', 'OWNER']), controller.getUsers)
router.put('/deskupdate', authMiddleware, roleMiddleware(['USER', 'ADMIN', 'OWNER']), controller.deskUpdate)
router.put('/updatetoadmin', authMiddleware, roleMiddleware(['OWNER']), controller.updateToAdmin)
router.get('/desks', roleMiddleware(['USER', 'ADMIN', 'OWNER']), controller.getDesks)
router.delete('/deskdelete', authMiddleware, roleMiddleware(['USER', 'ADMIN', 'OWNER']), controller.deskDelete)
router.put('/givetgadmin', authMiddleware, roleMiddleware(['OWNER']), controller.updateToAdminTelegram)

module.exports = router