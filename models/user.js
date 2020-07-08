var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");


var UserSchema = new mongoose.Schema({
	username:{type : String, required: true},
	password: {type : String, required:true} ,
	resetPasswordToken : String,
	resetPasswordExpire : Date,
	firstName : String,
	lastName : String,
	email : {type : String, unquie : true, required:true} ,
	emailToken : String,
	isVerified  : Boolean,
	image: String,
	imageId:String,
	description : String,
	job : String,
	state : String,
	country : String
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User",UserSchema);