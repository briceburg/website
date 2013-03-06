var express = require('express')
var app = express()

app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.use(express.logger())
app.use(express.bodyParser())
app.use(express.methodOverride())
app.use(express.cookieParser())
app.use(app.router)
app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res){
  res.render('index')
})

app.listen(8080)
