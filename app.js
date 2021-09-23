const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const router = require('./router')
const flash = require('connect-flash')
const app = express()

app.use(
  session({
    secret: 'abrakadabra hokuspokos bilibokus',
    store: MongoStore.create({ client: require('./db') }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      path: '/',
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60 * 48,
      expires: null
    }
  })
)
app.use(flash())

// res.locals
// An object that contains response local variables scoped to the request, and therefore available only to the view(s) rendered during that request / response cycle (if any). Otherwise, this property is identical to app.locals.
app.use(function (req, res, next) {
  // make current user id availabel on the req object
  if (req.session.user) {
    req.visitorId = req.session.user._id
  } else {
    req.visitorId = 0
  }
  // make user session data availabel from within view template
  res.locals.user = req.session.user
  next()
})

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use(express.static('public'))
app.set('views', 'views')
app.set('view engine', 'ejs')

app.use(router)
module.exports = app
