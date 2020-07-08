var mongoose = require("mongoose");

//Schema Setup
var tagsSchema = new mongoose.Schema({
	tagname : String
});	

module.exports = mongoose.model("Tag",tagsSchema);