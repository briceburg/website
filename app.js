var express    = require('express')
  , url        = require('url')
  , redis      = require('redis')
  , RedisStore = require('connect-redis')(express)
  , passport   = require('passport')
  , Github     = require('passport-github').Strategy
  , BitBucket  = require('passport-bitbucket').Strategy

var redis_url = url.parse(process.env.OPENREDIS_URL)

var app = express()
  , db  = redis.createClient(redis_url.port, redis_url.hostname).auth(redis_url.auth.split(':')[1])

var storeConfig = {
    host: redis_url.hostname
  , port: redis_url.port
  , pass: redis_url.auth.split(':')[1]
}

app.use(express.logger())
app.use(express.bodyParser())
app.use(express.methodOverride())
app.use(express.cookieParser())
app.use(express.session({
  store: new RedisStore(storeConfig)
, secret: '802894782dd90d95ed3b7e6d997bd9bae09d13446a133a28a965840645f40b85'
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(app.router)

app.set('views', __dirname + '/views')
app.use(express.static(__dirname + '/public'))

passport.serializeUser(function(user, done){

})

passport.deserializeUser(function(user, done){

})

// TODO: reset bitbucker & github keys, put into env, and remove from version contol.

passport.use(new BitBucket({
    consumerKey: "LNkTZHv6bKRCaY94Ac"
  , consumerSecret: "rQX5ptmNKGmG6QYGghAfHtarETctc7RD"
  , callbackURL: "http://nashjs.org/auth/bitbucket/callback"
  },
  function(token, tokenSecret, profile, done) {
    User.findOrCreate({bitbucketId: profile.username}, function(err, user){
      return done(err, user)
    })
  }
))

passport.use(new Github({
    clientID: "f5c39d4f957679bc7c2e"
  , clientSecret: "4b9fad5294aed0080a77881e71d2c925666ec30d"
  , callbackURL: "http://nashjs.org/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOrCreate({githubId: profile.username}, function(err, user){
      return done(err, user)
    })
  }
))

app.get('/', function(req, res){
  res.render('index.jade')
})

app.get('/logout', function(req, res){
  req.logout()
  res.redirect('/')
})

app.get('/auth/bitbucket', passport.authenticate('bitbucket'))

app.get('/auth/bitbucket/callback', passport.authenticate('bitbucket', {successRedirect: '/', failureRedirect: '/'}), function(req, res) {
  res.send(404)
})

app.get('/auth/github', passport.authenticate('github'))

app.get('/auth/github/callback', passport.authenticate('github', {successRedirect: '/', failureRedirect: '/'}), function(req, res) {
  res.send(404)
})

app.get('/jobs', function(req, res) {
  res.render('jobs.jade')
})

app.get('/jobs/:id', function(req, res) {
  res.render('job.jade')
})

app.get('/jobs/:id/edit', function(req, res) {
  res.render('job-edit.jade')
})

app.get('/jobs/:id/destroy', function(req, res) {
  res.send(404)
})

app.listen(8080)
