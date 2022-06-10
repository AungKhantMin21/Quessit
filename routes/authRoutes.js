var express = require("express");
var router = express.Router();
var passport = require("passport");
var Question = require("../models/questions")
var User =  require("../models/user");
var Tag = require("../models/tags");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
//require @sendgrid/mail
const sgMail = require("@sendgrid/mail");

//sendgrid api key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
console.log(process.env.SENDGRID_API_KEY);
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})
var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'dwl2oe41y', 
  api_key: 666776153676289, 
  api_secret: 'n1Ab0cdwS6Rh7w3ahmgnIu-C64s'
});


//landing route
router.get("/",function(req,res){
	res.render("home");
});

// Auth Routes
//show sign up page
router.get("/signup",function(req,res){
	res.render("signup");
});

//handle sign up logic
router.post("/signup", function(req,res){
	var newUser = new User({
		username	: req.body.username,
		//description : req.body.description,
		//job			: req.body.job,
		password	: req.body.password,
		email		: req.body.email,
		emailToken	: crypto.randomBytes(64).toString('hex'),
		isVerified	: false
		//firstName	: req.body.firstName,
		//lastName	: req.body.lastName,
		//avatar		: req.body.avatar,
		//address		: req.body.address
	});
	User.register(newUser, req.body.password,async function(err,user){
		if(err){
			console.log(err);
			req.flash("error",err.message);
			return res.redirect("/signup");
		}
		const msg= {
			from: 'quessit.quess@gmail.com',
			to  : user.email,
			subject : 'Quess - Email Verification',
			text : 'Email Confirmation\n\nHey '+user.username+',\n\nThanks for registering on our site. Please click this link to complete your registering - \n'+
			'http://'+req.headers.host+'/verify-email?token='+user.emailToken,
		}
		try{
			await sgMail.send(msg);
			req.flash("success","Email sent. Check your email to verify.");
			res.redirect("/signup");
		} catch(error){
			console.log(error);
			req.flash("error","Error happening");
			res.redirect('/signup');
		}
	});
});

// Email verification route
router.get('/verify-email', async(req,res,next) => {
	try{
		const user = await User.findOne({emailToken :req.query.token});
		if(!user){
			req.flash("error","token is invalid");
			return res.redirect('/');
		}
		user.emailToken = null;
		user.isVerified = true;
		await user.save();
		await req.login(user,async (err) =>{
			if(err) return next(err);
			req.flash("success","Congratulations! Your account has been created successfully \n\n You can edit your 						profile <a href='https://quess-dylho.run-ap-south1.goorm.io/users/"+user._id+"/edit'>here</a>");
			const redirectUrl = req.session.redirectTo || '/';
			delete req.session.redirectTo;
			res.redirect(redirectUrl);
		});
	} catch(error) {
		console.log(error);
		req.flash("error","error happened");
		res.redirect('/');
}
});

//show login page
router.get("/login",function(req,res){
	res.render("login");
});

//handle login logic
router.post("/login", isNotVerified,passport.authenticate("local",
	{
	successRedirect : "/newsfeed",
	failureRedirect : "/login"
	}),function(req,res){
	
});

//LOOUT route
router.get("/logout",function(req,res){
	req.logout();
	req.flash("success","Successfully logout");
	res.redirect("/");
});

//forget password

router.get("/forget",function(req,res){
	 res.render("forgetpw");
});

router.post("/forget",function(req,res,next){
	async.waterfall([
		function(done){
			crypto.randomBytes(20,function(err,buf){
				var token = buf.toString("hex");
				done(err,token);
			});
		},
		function(token,done){
			User.findOne({email:req.body.email},function(err,user){
				if(!user){
					console.log("error");
					req.flash("error","Check your email address again");
					return res.redirect("/forget");
				}
			
				user.resetPasswordToken = token;
				user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
				
				user.save(function(err) {
					done(err,token,user);
				});
			});
		},
		function(token,user,done){
			var smtpTransport = nodemailer.createTransport({
				service : 'gmail',
				host: 'smtp.gmail.com',
				auth : {
					user : 'aungkhantmin212002@gmail.com',
					pass : 'a2zz#J0n'
				}
			});
			var mailOptions = {
				to : user.email,
				from : 'aungkhantmin212002@gmail.com',
				subject : "Quess account password reset",
				text : "Hi " + user.firstName +",\n\n"+
				"You are receving this because you have requested to reset of the password for your Quess account.\n\n"+
				"Please click on the following link, or paste this into your browser to complete the process:\n\n"+
				"http://"+req.headers.host+"/reset/"+token+"\n\n"+
				"If you did not request this, please ignore this email and your password will remain unchanged.\n"
			};
			smtpTransport.sendMail(mailOptions,function(err){
				console.log("email sent");
				req.flash("info","An email sent to "+user.email+"with further instructions.");
				done(err,"done");
			});
		}
	],function(err){
		if(err) return next(err);
		res.redirect("/forget");
	});
});

router.get("/reset/:token",function(req,res){
	User.findOne({
		resetPasswordToken : req.params.token,
		resetPasswordExpire: {$gt : Date.now()}
	}, function(err,user){
		if(!user){
			req.flash("error","Password reset code is invalid or has expired");
			return res.redirect("/forget");
		}
		res.render("resetpw",{token : req.params.token});
	});
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpire: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: "Gmail", 
        auth: {
          user: "quessit.quess@gmail.com",
          pass: "a2zz#J0n"
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'quessit.quess@gmail.com',
        subject: 'Your password has been changed',
        text: "Hi " + user.firstName +",\n\n" +
          "This is a confirmation that the password for your account " + user.email + " has just been changed.\n"
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash("success", "Success! Your password has been changed.");
        done(err);
      });
    }
  ], function(err) {
    res.redirect("/newsfeed");
  });
});

//User profile
router.get("/users/:id",function(req,res){
	User.findById(req.params.id, function(err,foundUser){
		if(err){
			console.log(err);
			req.flash("error","Something went wrong");
			return res.redirect("back");
		}
		Question.find().where('author.id').equals(foundUser._id).exec(function(err,questions) {
			if(err){
			console.log(err);
			req.flash("error","Something went wrong");
			return res.redirect("back");
		}
		res.render("profile",{user:foundUser,questions:questions});
		});
	});
});

router.get("/users/:id/edit",isLoggedIn,function(req,res){
	User.findById(req.params.id,function(err,foundUser){
		res.render("editpf",{user:foundUser});
	});
});

router.put("/users/:id",function(req,res){
	User.findByIdAndUpdate(req.params.id,req.body.profile,function(err,updatedProfile){
		if(err){
			res.redirect("back");
		} else{
			res.redirect("/users/"+req.params.id);
		}
	});
});

//contact route
/*
router.get("/contact",isLoggedIn,function(req,res){
	res.render("contact");
});

router.post("/contact",async function (req,res){
	const msg = {
  		to: 'aungkhantmin212002@gmail.com',
  		from: req.body.email, // Use the email address or domain you verified above
  		subject: 'Quess Contact Form',
  		text: req.body.message,
  		html: req.body.message,
	};
  	try {
   		await sgMail.send(msg);
		console.log("email sent");
 	} catch (error) {
   		console.error(error);
 
    	if (error.response) {
      		console.error(error.response.body)
    	}
 	}
	
}); */

function isLoggedIn(req,res, next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error","You need to login first to do that");
	res.redirect("/login");
};

async function isNotVerified(req,res,next){
	try{
		const user = await User.findOne({username: req.body.username});
		if(user.isVerified){
			return next();
		}
		else{
			req.flash("error","Your account has not been verified. Please check you email to verify account.");
			return res.redirect("/");
		}
	} catch(error){
		console.log(error);
		req.flash("error","Something went wrong. Please contact us for assitances.");
		res.redirect("/")
	}
};

module.exports = router;