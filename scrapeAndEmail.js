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
var PORT       = "4000";
var emailServer = "Gmail";
var emailFrom  = "NodeStockAlert@gmail.com";
var emailTo    = "NodeStockAlert@gmail.com";
var emailPassword = "monicaNguyen";
//var urlBase     = "https://finance.yahoo.com/quote/t-USD.SW?p=t-USD.SW";
var urlBase     = "https://www.marketwatch.com/investing/stock/googl";

var timeZoneUser= "America/New_York";

var app = express();

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++
//set this via MONGO
let priceBottom = 37; //when to BUY
let priceTop = 38;    //when to SELL
var StockTicker   = "t";

var time = timeStamp('MM/DD/YYYY HH:mm:ss');
console.log("Application Initiated: "+time);

var quoteMailer = nodemailer.createTransport({
    service: emailServer,
    auth: {
        user: emailFrom,
        pass: emailPassword
    }
});
//----------------------------------------------------------

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

//++++++++++++++++++++++++++++++++++++++++++++++
app.get('/scrape', function(req, res){    
    var $, priceAlert;
    //Hit the stocks site and scrape it, scrape it good
    request(urlBase, function(error, response, html) {
      if(!error) {
        $ = cheerio.load(html);
        priceAlert = parseFloat($('h3.intraday__price').children().text().replace("$","").replace(",",""));
        //priceAlert = ($("td.table__cell u-semi"));
        console.log("PriceAlert: ",priceAlert)
      }else{console.log("ERROR ON REQUEST")}
    });
//res.redirect("/")
});
// });

//-------------------------------------------------

app.get("/", function(req, res) {
  res.send(index.html);
});

// app.post("/submit", function(req, res) {
//   db.quoteTrack.insert(req.body, function(error, saved) {
//     if (error) {
//       console.log(error);
//     }
//     else {
//       res.send(saved);
//     }
//   });
// });

// app.get("/all", function(req, res) {
//   // Find all quotes in the quotes collection
//   db.quoteTrack.find({}, function(error, found) {
//     // Log any errors
//     if (error) {
//       console.log(error);
//     }
//     // Otherwise, send json of the quotes back to user
//     // This will fire off the success function of the ajax request
//     else {
//       res.json(found);
//     }
//   });
// });


// // Update just one quote by an id
// app.post("/update/:id", function(req, res) {
//   // Update the quote that matches the object id
//   db.quoteTrack.update({
//     "_id": mongojs.ObjectId(req.params.id)
//   }, {
//     $set: {
//       "ticker": req.body.ticker,
//       "ceiling": req.body.ceiling,
//       "floor": req.body.floor,
//       "modified": Date.now()
//     }
//   }, function(error, edited) {
//     if (error) {
//       console.log(error);
//       res.send(error);
//     }
//     else {
//       //console.log("edited: ",edited);
//       res.send(edited);
//     }
//   });
// });


// app.get("/delete/:id", function(req, res) {
//   db.quoteTrack.remove({
//     "_id": mongojs.ObjectID(req.params.id)
//   }, function(error, removed) {
//     if (error) {
//       console.log(error);
//       res.send(error);
//     }
//     else {
//       //console.log(removed);
//       res.send(removed);
//     }
//   });
// });

// app.get("/clearall", function(req, res) {
//   db.quoteTrack.remove({}, function(error, response) {
//     if (error) {
//       console.log(error);
//       res.send(error);
//     }
//     else {
//       //console.log(response);
//       res.send(response);
//     }
//   });
// });

// // Select just one quote by an id
// app.get("/find/:id", function(req, res) {
//   db.quoteTrack.findOne({
//     "_id": mongojs.ObjectId(req.params.id)
//   }, function(error, found) {
//     if (error) {
//       console.log(error);
//       res.send(error);
//     }
//     else {
//       res.send(found);
//     }
//   });
// });

// var upDateCronJob = new CronJob({
//   cronTime: '* * * * *', 
//   onTick: function() {request.get('http://localhost:'+PORT+'/scrape')},  
//   timeZone:timeZoneUser
// });

// //initiate CRON without opening the browser
// upDateCronJob.start()

app.listen(PORT, function() {
  console.log("App running on port "+PORT+"!");
})
