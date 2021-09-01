const express = require('express')
const router = express.Router()
const userController = require('./controller/userController')
const postController = require('./controller/postController')

// User related controller
router.get('/', userController.home)
router.post('/register', userController.register)
router.post('/login', userController.login)
router.post('/logout', userController.logout)

// Post related controller
router.get('/create-post', userController.mustBeLoggedIn, postController.viewCreateScreen)
router.post('/create-post', userController.mustBeLoggedIn, postController.create)
router.get('/post/:id', postController.viewSingle)
module.exports = router
