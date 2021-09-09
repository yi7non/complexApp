const express = require('express')
const router = express.Router()
const userController = require('./controller/userController')
const postController = require('./controller/postController')

// User related routes
router.get('/', userController.home)
router.post('/register', userController.register)
router.post('/login', userController.login)
router.post('/logout', userController.logout)

// Profile related routes
router.get('/profile/:username', userController.ifUserExists, userController.profilePsotsScreen)

// Post related routes
router.get('/create-post', userController.mustBeLoggedIn, postController.viewCreateScreen)
router.post('/create-post', userController.mustBeLoggedIn, postController.create)
router.get('/post/:id', postController.viewSingle)
module.exports = router
