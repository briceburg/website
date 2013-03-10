// Requires

var express    = require('express')
  , url        = require('url')
  , util       = require('util')
  , mongoose   = require('mongoose').connect(process.env.MONGOLAB_URL)
  , RedisStore = require('connect-redis')(express)
  , passport   = require('passport')
  , Github     = require('passport-github').Strategy
  , BitBucket  = require('passport-bitbucket').Strategy

// Setup Express

var redis_url = url.parse(process.env.OPENREDIS_URL)
var app = express()
var db  = mongoose.connection
var SessionStore = new RedisStore({
    host: redis_url.hostname
  , port: redis_url.port
  , pass: redis_url.auth.split(':')[1]
})

app.use(express.logger())
app.use(express.bodyParser())
app.use(express.methodOverride())
app.use(express.cookieParser())
app.use(express.session({
  store: SessionStore
, secret: '802894782dd90d95ed3b7e6d997bd9bae09d13446a133a28a965840645f40b85'
}))
app.use(passport.initialize())
app.use(passport.session({
  store: SessionStore
, secret: 'cf6078f4a5481fe7011e61271794de01e72f0aabc6b5686fe0101de94a892964'
}))
app.use(app.router)
app.use(express.static(__dirname + '/public'))

// Setup Mongo

db.on('error', console.error.bind(console, 'connection error:'))

var userSchema = mongoose.Schema({
  username: String
, provider: String
, gravatar: String
, created:  {type: Date, default: Date.now}
})

userSchema.statics.FindOneOrCreate = function(profile, func){
  this.model('User').findOne({'username': profile.username.toLowerCase(), 'provider': profile.provider.toLowerCase()}, function(err, user){
    if (err) {
      return func(err, null)
    } // or should I throw the exception?

    if (user) {
      func(null, user)
    } else {
      user = new User({
        username: profile.username.toLowerCase()
      , provider: profile.provider.toLowerCase()
      })

      user.save(function(err){
        if (err) {
          return func(err, null)
        } // same thing

        return func(null, user)
      })
    }
  })
}

var User = mongoose.model('User', userSchema)

var jobSchema = mongoose.Schema({
  slug:     {type: String, unique: true}
, body:     String
, user_id:  String
, created:  {type: Date, default: Date.now, expires: '25d'}
, edited:   {type: Date, default: Date.now}
})

var Job = mongoose.model('Job', jobSchema)

// Setup Passport

// TODO: reset bitbucket & github keys, put into env, and remove from version contol.

passport.serializeUser(function(user, done){
  done(null, user._id)
})

passport.deserializeUser(function(id, done){
  User.findOne(id, function (err, user) {
    done(err, user)
  })
})

passport.use(new BitBucket({
    consumerKey: "LNkTZHv6bKRCaY94Ac"
  , consumerSecret: "rQX5ptmNKGmG6QYGghAfHtarETctc7RD"
  , callbackURL: "http://staging.nashjs.jit.su/auth/bitbucket/callback"
  },
  function(token, tokenSecret, profile, done){
    User.FindOneOrCreate(profile, function(err, user){
      done(err, user)
    })
  }
))

passport.use(new Github({
    clientID: "f5c39d4f957679bc7c2e"
  , clientSecret: "4b9fad5294aed0080a77881e71d2c925666ec30d"
  , callbackURL: "http://staging.nashjs.jit.su/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done){
    User.FindOneOrCreate(profile, function(err, user){
      done(err, user)
    })
  }
))

// Routes

app.get('/', function(req, res){
  res.render('index.jade')
})

app.get('/login', function(req, res){
  res.render('login.jade')
})

app.get('/logout', function(req, res){
  req.logout()
  res.redirect('/')
})

app.get('/auth/bitbucket', passport.authenticate('bitbucket'))
app.get('/auth/bitbucket/callback', passport.authenticate('bitbucket', {successRedirect: '/', failureRedirect: '/'}))
app.get('/auth/github', passport.authenticate('github'))
app.get('/auth/github/callback', passport.authenticate('github', {successRedirect: '/', failureRedirect: '/'}))

app.get('/jobs', function(req, res){
  var now = new Date()
  var 25dAgo = now.setDate(now.getDate() - 25)

  Jobs.where('date').gt(25dAgo).exec(function(err, jobs){
    if (err) {
      console.log(err)
      res.send(500)
    }

    res.render('jobs.jade', {jobs: jobs})
  })
})

app.get('/job/:slug', function(req, res){
  Jobs.where('slug').equals(req.params.slug).exec(function(err, job){
    if (err) {
      console.log(err)
      res.send(500)
    }

    res.render('job.jade', {job: job})
  })
})

app.get('/job/:slug/edit', function(req, res){
  Jobs.where('slug').equals(req.params.slug).where('user_id').equals(req.user._id), function(err, job){
    res.render('job-edit.jade')
  })
})

app.get('/job/:slug/destroy', function(req, res){
  Jobs.where('slug').equals(req.params.slug).where('user_id').equals(req.user._id), function(err, job){
    res.redirect('jobs')
  })
})

app.get('/posts', function(req, res){
  res.send(404)
})

app.get('/post/:slug', function(req, res){
  res.send(404)
})

// Serve

app.listen(8080)
