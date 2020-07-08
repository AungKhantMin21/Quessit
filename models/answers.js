var mongoose = require("mongoose");

var answersSchema = new mongoose.Schema({
	text:String,
	image:String,
	author:{
		id:{
			type : mongoose.Schema.Types.ObjectId,
			ref : "User"
		},
		username:String
	},
	created: {type:Date, default:Date.now}
});	

module.exports = mongoose.model("Answer",answersSchema);