var mongojs = require("mongojs");
var bodyParser = require("body-parser");
var logger = require("morgan");
var timeStamp  = require('time-stamp');
var express    = require('express');
var request    = require('request');
var cheerio    = require('cheerio');
var nodemailer = require('nodemailer');
var CronJob    = require('cron').CronJob;
var fs         = require('fs');
var app        = express();
var PORT       = process.env.PORT || 8080;;
var emailServer = "Gmail";
var emailFrom  = "NodeStockAlert@gmail.com";
var emailTo    = "NodeStockAlert@gmail.com";
var emailPassword = "monicaNguyen";
var urlBase     = "https://www.marketwatch.com/investing/stock/";
var timeZoneUser= "America/New_York";
//mongodb://heroku_s0dpkg20:vnj4g7gd12b9cjm5ggd8g7ge85@ds129966.mlab.com:29966/heroku_s0dpkg20
var app = express();

var time = timeStamp('MM/DD/YYYY HH:mm:ss');
console.log("Application Initiated: "+time);

var quoteMailer = nodemailer.createTransport({
    service: emailServer,
    auth: {
        user: emailFrom,
        pass: emailPassword
    }
});

app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(express.static("public"));

// Database configuration
var databaseUrl = "quoteDB";
var collections = ["quoteTrack"];

// Hook mongojs config to db variable
var db = mongojs(databaseUrl, collections);

// Log any mongojs errors to console
db.on("error", function(error) {
  console.log("Database Error:", error);
});

app.get('/scrape', function(req, res){
  //Hit the stocks site and scrape it, scrape it good
  db.quoteTrack.find({},function(error, found) {
    if (error) {
      console.log("1: ",error);
    }
    else {
      for(let i=0; i<found.length; i++){
        let StockTicker = found[i].ticker;
        let priceBottom = found[i].floor; //when to BUY
        let priceTop = found[i].ceiling;    //when to SELL
        request(urlBase+StockTicker, function(error, response, html) {
          if(!error) {
            let $ = cheerio.load(html);
            let priceAlert = parseFloat($('h3.intraday__price').children().text().replace("$","").replace(",",""));
            console.log("priceAlert: ",priceAlert);
            console.log("1PriceAlert: "+priceAlert+" PriceBottom: "+priceBottom+" PriceTop: "+priceTop);
            if (priceAlert < priceBottom || priceAlert > priceTop){
              console.log("2PriceAlert: "+priceAlert+" PriceBottom: "+priceBottom+" PriceTop: "+priceTop);
              let mailOptions = {
                from: emailFrom,
                to: emailTo,
                subject: 'STOCK ALERT',
                text: 'URGENT STOCK ALERT $' + priceAlert + " For: "+StockTicker
                };
              quoteMailer.sendMail(mailOptions, function(error, info){
                if(error) {
                  return console.log("1: ",error);
                }
                let currentTime = timeStamp('MM/DD/YYYY:HH:mm:ss');
                console.log("Sent Update To: "+emailTo+" AT "+currentTime+ "for "+StockTicker);
              }); 
            }
          }else{console.log("ERROR ON REQUEST")}
        });
      }
      res.redirect("/")
    }
  });
});


app.get("/", function(req, res) {
  res.send(index.html);
});

app.post("/submit", function(req, res) {
  //console.log(req.body);
  db.quoteTrack.insert(req.body, function(error, saved) {
    if (error) {
      console.log(error);
    }
    else {
      res.send(saved);
    }
  });
});

app.get("/all", function(req, res) {
  // Find all quotes in the quotes collection
  db.quoteTrack.find({}, function(error, found) {
    //console.log(found);
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise, send json of the quotes back to user
    // This will fire off the success function of the ajax request
    else {
      res.json(found);
    }
  });
});


// Update just one quote by an id
app.post("/update/:id", function(req, res) {
  // Update the quote that matches the object id
  db.quoteTrack.update({
    "_id": mongojs.ObjectId(req.params.id)
  }, {
    $set: {
      "ticker": req.body.ticker,
      "ceiling": req.body.ceiling,
      "floor": req.body.floor,
      "modified": Date.now()
    }
  }, function(error, edited) {
    if (error) {
      console.log(error);
      res.send(error);
    }
    else {
      //console.log(edited);
      res.send(edited);
    }
  });
});


app.get("/delete/:id", function(req, res) {
  db.quoteTrack.remove({
    "_id": mongojs.ObjectID(req.params.id)
  }, function(error, removed) {
    if (error) {
      console.log(error);
      res.send(error);
    }
    else {
      //console.log(removed);
      res.send(removed);
    }
  });
});

app.get("/clearall", function(req, res) {
  db.quoteTrack.remove({}, function(error, response) {
    if (error) {
      console.log(error);
      res.send(error);
    }
    else {
      //console.log(response);
      res.send(response);
    }
  });
});

// Select just one quote by an id
app.get("/find/:id", function(req, res) {
  db.quoteTrack.findOne({
    "_id": mongojs.ObjectId(req.params.id)
  }, function(error, found) {
    if (error) {
      console.log(error);
      res.send(error);
    }
    else {
      //console.log(found);
      res.send(found);
    }
  });
});

var upDateCronJob = new CronJob({
  cronTime: '* * * * *', 
  onTick: function() {request.get('http://localhost:'+PORT+'/scrape')},  
  timeZone:timeZoneUser
});

//initiate CRON without opening the browser
upDateCronJob.start()

app.listen(PORT, function() {
  console.log("App running on port 4000!");
});
