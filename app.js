require('dotenv').config();

var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var passport =require("passport");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var methodOverride = require("method-override");
var flash = require("connect-flash");
var Localstrategy = require("passport-local");
var session = require("express-session");
var bcrypt = require("bcrypt-nodejs");
var expressSanitizer = require("express-sanitizer");


var app=express();
mongoose.connect("mongodb+srv://AungKhant:akm212002@cluster0.b1rjn.mongodb.net/quessit?retryWrites=true&w=majority", 
				 {useNewUrlParser: true, useCreateIndex : true,useUnifiedTopology: true }
				).then(() =>{ 
	console.log("Connected to DB");}).catch(err =>{console.log('Error: ',err.message);});
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine","ejs");
app.use(methodOverride("_method"));
app.use(flash());
app.use(expressSanitizer());


//models setup
var Question = require("./models/questions"),
	Answer = require("./models/answers"),
	User = require("./models/user"),
	Tag = require("./models/tags"),
	seedDB = require("./seeds");

var questionRoutes = require("./routes/questionRoutes"),
	answerRoutes = require("./routes/answerRoutes"),
	authRoutes = require("./routes/authRoutes");
//seedDB();

//Password configuration route
app.use(require("express-session")({
	secret : "quessitforstudent",
	resave : false,
	saveUninitialized : false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new Localstrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
	res.locals.currentUser= req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});


app.use(questionRoutes);
app.use(answerRoutes);
app.use(authRoutes);


var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Server Has Started!");
});
