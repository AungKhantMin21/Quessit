var mongoose = require("mongoose");

//Schema Setup
var questionsSchema = new mongoose.Schema({
	title:String,
	content:String,
	imageId:String,
	image:String,
	author : {
		id :{
			type : mongoose.Schema.Types.ObjectId,
			ref  : "User"
		},
		username : String,
		description : String,
		job : String,
		state : String,
		country : String
	},
	tag : {
		id:{
			type : mongoose.Schema.Types.ObjectId,
			ref  : "Tag"
		},
		tagname  : String
	},
	created: {type:Date, default:Date.now},
	answers:[
		{
			type : mongoose.Schema.Types.ObjectId,
			ref  : "Answer"
		}
	]
});	

module.exports = mongoose.model("Question",questionsSchema);