const User = require('../models/User')
const Post = require('../models/Post')

exports.mustBeLoggedIn = function (req, res, next) {
  if (req.session.user) {
    next()
  } else {
    req.flash('errors', 'you msut be logged in to perform this action')
    req.session.save(function () {
      res.redirect('/')
    })
  }
}

exports.login = async function (req, res) {
  let user = new User(req.body)
  try {
    await user.login()
    req.session.user = { avatar: user.avatar, username: req.body.username, _id: user.reqBody._id }
    await req.session.save() //This save is because we dont want the automaticly save of session on change
    // so the redirect happen only after the user is authenticated in db.
    res.redirect('/')
  } catch (error) {
    // What the flash() function actually does is
    // keep the message inside the session obj so that
    // it is saved even after the redirect,
    // Therefore we would like to manually save the session
    // so that the redirect is made only after we have saved
    // what the flash adds to the session object in DB
    req.flash('errors', error)
    req.session.save(function () {
      res.redirect('/')
    })
  }
}

exports.logout = async function (req, res) {
  await req.session.destroy() //This await is because we want be sure the user is logout befor the redirect
  res.redirect('/')
}

exports.register = function (req, res) {
  let user = new User(req.body)
  user
    .register()
    .then(() => {
      req.session.user = {
        username: user.reqBody.username,
        avatar: user.avatar,
        _id: user.reqBody._id
      }
      req.session.save(function () {
        res.redirect('/')
      })
    })
    .catch(regErrors => {
      regErrors.forEach(function (error) {
        req.flash('regErrors', error)
      })
      req.session.save(function () {
        res.redirect('/')
      })
    })
}

exports.home = function (req, res) {
  if (req.session.user) {
    res.render('home-dashbord')
  } else {
    // Technically to display the error message to the user we could
    // pull it directly from the req by req.session.flash, but what the
    // flash function does for us is to delete the flash message
    // from the DB after we have presented it once to the user
    res.render('home-guest', { regErrors: req.flash('regErrors') })
  }
}

exports.ifUserExists = function (req, res, next) {
  User.findByUsername(req.params.username)
    .then(function (userDocument) {
      req.profileUser = userDocument
      next()
    })
    .catch(function () {
      res.render('404')
    })
}

exports.profilePsotsScreen = function (req, res) {
  // ask our post model for posts by a certain author id
  Post.findByAuthorID(req.profileUser._id)
    .then(function (posts) {
      res.render('profile', {
        posts: posts,
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar
      })
    })
    .catch(function () {
      res.render('404')
    })
}
