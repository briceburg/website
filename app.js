var express = require('express')
var app = express()

app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res){
  res.render('index.jade')
})

app.get('/preview/code-of-conduct', function(req, res){
  res.render('coc.jade')
})

app.listen(process.env.PORT || 3000)
