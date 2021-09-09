const bcrypt = require('bcryptjs')
const userCollection = require('../db').db().collection('users')
const validator = require('validator')
const md5 = require('md5')

class User {
  constructor(reqBody, getAvatar) {
    this.reqBody = reqBody
    this.errors = []
    if (getAvatar == undefined) {
      getAvatar = false
    }
    if (getAvatar) {
      this.getAvatar()
    }
  }

  cleanUp() {
    if (typeof this.reqBody.username != 'string') {
      this.reqBody.username = ''
    }
    if (typeof this.reqBody.email != 'string') {
      this.reqBody.email = ''
    }
    if (typeof this.reqBody.password != 'string') {
      this.reqBody.password = ''
    }
    // get rid of any bogus (מְזוּיָף) properties
    this.reqBody = {
      username: this.reqBody.username.trim().toLowerCase(),
      email: this.reqBody.email.trim().toLowerCase(),
      password: this.reqBody.password
    }
  }

  validate() {
    return new Promise(async (resolve, reject) => {
      if (this.reqBody.username == '') {
        this.errors.push('You must provide a username.')
      }
      if (this.reqBody.username != '' && !validator.isAlphanumeric(this.reqBody.username)) {
        this.errors.push('Username can only contain letters and numbers')
      }
      if (!validator.isEmail(this.reqBody.email)) {
        this.errors.push('You must provide a valide email address.')
      }
      if (this.reqBody.password == '') {
        this.errors.push('You must provide a password.')
      }
      if (this.reqBody.password.length > 0 && this.reqBody.password.length < 4) {
        this.errors.push('Password must be at least 4 characters.')
      }
      if (this.reqBody.password.length > 100) {
        this.errors.push('Password cannot exceed 100 chracters.')
      }
      if (this.reqBody.username.length > 0 && this.reqBody.username.length < 3) {
        this.errors.push('Username must be at least 3 characters.')
      }
      if (this.reqBody.username.length > 30) {
        this.errors.push('Username cannot exceed 30 chracters.')
      }

      // Only if username is valid then check to see if it's already taken
      if (
        this.reqBody.username.length > 2 &&
        this.reqBody.username.length < 31 &&
        validator.isAlphanumeric(this.reqBody.username)
      ) {
        let usernameExist = await userCollection.findOne({ username: this.reqBody.username })
        if (usernameExist) this.errors.push('That username is already taken ')
      }

      // Only if email is valid then check to see if it's already taken
      if (validator.isEmail(this.reqBody.email)) {
        let emailExist = await userCollection.findOne({ email: this.reqBody.email })
        if (emailExist) this.errors.push('That email is already being used')
      }
      resolve()
    })
  }

  login() {
    this.cleanUp()
    return new Promise((resolve, reject) => {
      userCollection
        .findOne({ username: this.reqBody.username })
        .then(attemptedUser => {
          if (attemptedUser && bcrypt.compareSync(this.reqBody.password, attemptedUser.password)) {
            this.reqBody = attemptedUser
            this.getAvatar()
            resolve('Congrats!!!!')
          } else {
            reject('Invalid username / password')
          }
        })
        .catch(err => {
          reject('Please try again leter.\n ' + err)
        })
    })
  }

  register() {
    return new Promise(async (resolve, reject) => {
      // step #1: Validate user data
      this.cleanUp()
      await this.validate()
      // step #2: Only if there are no validation error
      // then save the user data into a database
      if (!this.errors.length) {
        // hash user password
        let salt = bcrypt.genSaltSync()
        this.reqBody.password = bcrypt.hashSync(this.reqBody.password, salt)
        await userCollection.insertOne(this.reqBody)
        this.getAvatar()
        resolve()
      } else {
        reject(this.errors)
      }
    })
  }

  getAvatar() {
    this.avatar = `https://gravatar.com/avatar/${md5(this.reqBody.email)}?s=128`
  }
}

User.findByUsername = function (username) {
  return new Promise(function (resolve, reject) {
    if (typeof username != 'string') {
      reject()
      return
    }
    userCollection
      .findOne({ username: username })
      .then(function (userDoc) {
        if (userDoc) {
          userDoc = new User(userDoc, true)
          userDoc = {
            _id: userDoc.reqBody._id,
            username: userDoc.reqBody.username,
            avatar: userDoc.avatar
          }
          resolve(userDoc)
        } else {
          reject()
        }
      })
      .catch(function () {
        reject()
      })
  })
}

module.exports = User
