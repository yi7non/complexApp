const mongodb = require('mongodb')
const dotenv = require('dotenv').config()

mongodb.connect(
  process.env.CONNECTIONSTRING,
  { useNewUrlParser: true, useUnifiedTopology: true },
  function (err, client) {
    module.exports = client
    const app = require('./app')
    const port = process.env.PORT || 3333
    app.listen(port, () => console.log('app is runnig on http://localhost:' + port))
  }
)
