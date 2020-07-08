var express = require("express");
var router = express.Router();
var Question = require("../models/questions");
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


//newsfeed routes
router.get("/newsfeed",function(req,res){
	var noMatch = null;
	if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search),'gi');
		//get all questions from mongodb
		Question.find({title: regex},function(err,allQuestions){
			if(err){
				console.log(err);
			}
			else{
				if(allQuestions.length<1){
					noMatch = "There is no post with that title. Please try other titles.";
				}
				res.render("newfeed",{questions:allQuestions, noMatch: noMatch});
			}
		});
	} else{
		//get all questions from mongodb
		Question.find({},function(err,allQuestions){
			if(err){
				console.log(err);
			}
			else{
				res.render("newfeed",{questions:allQuestions,noMatch:noMatch});
			}
		});
	}
	console.log(req.user);
	
});

router.post("/newsfeed", isLoggedIn, upload.single('image'), function(req, res) {
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
      if(err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      // add cloudinary url for the image to the post object under image property
      req.body.question.image = result.secure_url;
      // add image's public_id to post object
      req.body.question.imageId = result.public_id;
      // add author to post
      req.body.question.author = {
        id: req.user._id,
        username: req.user.username,
		description : req.user.description,
		job : req.user.job,
		address : req.user.address
      }
      Question.create(req.body.question, function(err, question) {


        if (err) {
          req.flash('error', err.message);
          return res.redirect('back');
        }
        res.redirect('/newsfeed');
      });
    });
});

router.get("/newsfeed/post",isLoggedIn,function(req,res){
	res.render("post");
});

router.get("/newsfeed/:id",isLoggedIn,function(req,res){
	Question.findById(req.params.id).populate("answers").exec(function(err,foundQuestion){
		if(err){
			res.redirect("back");
			console.log(err);
		}
		else{
			res.render("show",{questions:foundQuestion});
		}
	});
});	

//Edit question route
router.get("/newsfeed/:id/edit",checkQuestionOwnership,function(req,res){
	Question.findById(req.params.id, function(err,foundQuestion){
		res.render("qedit",{questions:foundQuestion});
	});
});

//Update question route
router.put("/newsfeed/:id",upload.single('image'),checkQuestionOwnership,function(req,res){
	Question.findById(req.params.id, async function(err,question){
		if(err){ 
			req.flash("error", err.message);
			res.redirect("back");
			console.log(err);
		}
		else{
			if(req.file){
				try{
					await cloudinary.v2.uploader.destroy(question.imageId,question.image);
					var result = await cloudinary.v2.uploader.upload(req.file.path);
					question.imageId = result.public_id;
					question.image = result.secure_url;	 
				}catch(err){
					req.flash("error", err.message);
					res.redirect("back");
					console.log(err);
				}	
			}
			question.title = req.body.title;
			question.content = req.body.content;
			question.save();
			res.redirect("/newsfeed/"+req.params.id);
		}
	});
});

//Delete question route
router.delete("/newsfeed/:id",checkQuestionOwnership,function(req,res){
	Question.findById(req.params.id,async function(err,question){
		if(err){
			req.flash("error",err.message);
			return res.redirect("back");
			console.log(err);
		}
		try{
			await cloudinary.v2.uploader.destroy(question.imageId);
			question.remove();
			res.redirect("/newsfeed");
			req.flash("success","Post deleted");
		}catch(error){
			req.flash("error",err.message);
			return res.redirect("back");
		}
	});
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

function checkQuestionOwnership (req,res,next){
	//is user logged in
	if(req.isAuthenticated()){
		Question.findById(req.params.id, function(err,foundQuestion){
		if(err){
			req.flash("error","Post not found");
			res.redirect("back");
		}
		else{
			//does user own the question?
			if(foundQuestion.author.id.equals(req.user._id)){
				next();
			} else{
				req.flash("error","You don't have permission to do that");
				//otherwise redirect
				res.redirect("back");
			}
		}
		});
	} else {
		req.flash("error","You need to be logged in to do that");
		//if not redirect
		res.redirect("/login");
	}
};



function isLoggedIn(req,res, next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error","You need to login first to do that");
	res.redirect("/login");
};

module.exports = router;
