var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var QuoteSchema = new Schema({
  ticker: {
    type: String,
    required: true
  },
  ceiling: {
    type: String,
    required: true
  },
  floor: {
    type: String,
    required: true
  },
  created: {
    type: Date,
    required: true
  }
});
var Quote = mongoose.model("Quote", QuoteSchema);
module.exports = Quote;
