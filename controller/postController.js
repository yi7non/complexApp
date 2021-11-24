const { findSingleById } = require('../models/Post')
const Post = require('../models/Post')

exports.viewCreateScreen = function (req, res) {
  res.render('create-post')
}

exports.create = function (req, res) {
  let post = new Post(req.body, req.session.user._id)
  post
    .create()
    .then(function () {
      res.send('new post created')
    })
    .catch(function (errors) {
      res.send(errors)
    })
}

exports.viewSingle = async function (req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId)
    res.render('single-post-screen', { post })
  } catch (error) {
    res.render('404')
  }
}

exports.viewEditScreen = async function (req, res) {
  try {
    let post = await findSingleById(req.params.id)
    res.render('edit-post', { post: post })
  } catch {
    res.render('404')
  }
}

exports.edit = function (req, res) {
  let post = new Post(req.body, req.visitorId, req.params.id)
  post
    .update()
    .then(status => {
      // the post was successfully update in the database
      // or user did have permission, but there where validation errors
      if (status == 'success') {
        req.flash('success', 'Post Successfully update.')
        req.session.save(function () {
          res.redirect(`/post/${req.params.id}/edit`)
        })
      } else {
        post.errors.forEach(function (error) {
          req.flash('errors', error)
        })
        req.session.save(function () {
          res.redirect(`/post/${req.params.id}/edit`)
        })
      }
    })
    .catch(e => {
      // a post with the requested id doesn't exist
      // or if the current visitor is not the owner of the requested post
      req.flash('error', 'You do not have permission to perform that action.')
      req.session.save(function () {
        res.redirect('/')
      })
    })
}
