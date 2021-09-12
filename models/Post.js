const postCollection = require('../db').db().collection('posts')
const ObjectID = require('mongodb').ObjectID
const User = require('./User')

class Post {
  constructor(data, userid) {
    this.data = data
    this.userid = userid
    this.errors = []
  }

  cleanUp() {
    if (typeof this.data.title != 'string') this.data.title = ''
    if (typeof this.data.body != 'string') this.data.body = ''

    // get rid of any bogus properties
    this.data = {
      title: this.data.title.trim(),
      body: this.data.body.trim(),
      createdDate: new Date(),
      author: ObjectID(this.userid)
    }
  }

  validate() {
    if (this.data.title == '') this.errors.push('you must provide a title')
    if (this.data.body == '') this.errors.push('you must provide post content')
  }

  create() {
    return new Promise((resolve, reject) => {
      this.cleanUp()
      this.validate()
      if (!this.errors.length) {
        postCollection
          .insertOne(this.data)
          .then(() => resolve())
          .catch(() => {
            this.errors.push('Please try again later.')
            reject(this.errors)
          })
      } else {
        reject()
      }
    })
  }
}

Post.reusablePostQuery = function (uniqueOperations) {
  return new Promise(async (resolve, reject) => {
    let aggOperations = uniqueOperations.concat([
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'authorDocument'
        }
      },
      {
        $project: {
          title: 1,
          body: 1,
          createdDate: 1,
          author: { $arrayElemAt: ['$authorDocument', 0] }
        }
      }
    ])

    let posts = await postCollection.aggregate(aggOperations).toArray()
    // clean up author property in each post object
    posts = posts.map(function (post) {
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar
      }
      return post
    })
    resolve(posts)
  })
}

Post.findSingleById = function (id) {
  return new Promise(async (resolve, reject) => {
    if (typeof id != 'string' || !ObjectID.isValid(id)) {
      reject()
      return
    }
    let posts = await Post.reusablePostQuery([{ $match: { _id: new ObjectID(id) } }])
    if (posts.length) {
      resolve(posts[0])
    } else {
      reject()
    }
  })
}

Post.findByAuthorID = function (authorId) {
  return Post.reusablePostQuery([{ $match: { author: authorId } }, { $sort: { createdDate: -1 } }])
}
module.exports = Post

/*
Post.findSingleById = function (id) {
  return new Promise(async (resolve, reject) => {
    if (typeof id != 'string' || !ObjectID.isValid(id)) {
      reject()
      return
    }
    let posts = await postCollection
      .aggregate([
        // In the first operation we are interested in finding a match
        // between the ID obtained in the function and the corresponding
        // document from the collection of posts in DB.
        { $match: { _id: new ObjectID(id) } },
        // In the second operation we are interested in looking for a
        // document in another collection. The name of the collection
        // is "users" and from this collection we want a document whose
        // ID will match the "author" field from the original collection
        // of posts.
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'authorDocument'
          }
        },
        // The project operation allows us to select the fields we want
        // to pull from the aggregate operation instead of pulling
        // everything automatically

        // In this specific case we tell mongoDB that instead of returning
        // to us in the "author" field the ID that was supposed to return
        // we want the entry to be there is the item placed in index 0 from
        // what came under "authorDocument"
        {
          $project: {
            title: 1,
            body: 1,
            createdDate: 1,
            author: { $arrayElemAt: ['$authorDocument', 0] }
          }
        }
      ])
      .toArray()
    // clean up author property in each post object
    posts = posts.map(function (post) {
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar
      }
      return post
    })

    if (posts.length) {
      resolve(posts[0])
    } else {
      reject()
    }
  })
}
*/
