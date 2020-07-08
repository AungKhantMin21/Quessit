require('dotenv').config();
var express = require("express");
var router = express.Router();
var Question = require("../models/questions"),
	Answer = require("../models/answers");
//landing route
router.get("/",function(req,res){
	res.render("home");
});

//Answers routes
router.get("/newsfeed/:id/answer/new",isLoggedIn,function(req,res){
	Question.findById(req.params.id,function(err,question){
		if(err){
			console.log(err);
		}
		else{
			res.render("newans",{questions:question})
		}
	});
});

router.post("/newsfeed/:id",function(req,res){
	Question.findById(req.params.id,function(err,question){
		if(err){
			console.log(err);
		}
		else{
			Answer.create(req.body.answer,function(err,answer){
				if(err){
					req.flash("error","Something went wrong")
					console.log(err);
				}else{
					//add username to answer
					answer.author.id = req.user._id;
					answer.author.username = req.user.username;
					//save the answers
					answer.save();
					question.answers.push(answer);
					question.save();
					res.redirect("/newsfeed/"+question._id);
				}
			});
		}
	});
});

//edit answers routes
router.get("/newsfeed/:id/answer/:answers_id/edit",checkAnswerOwnership,function(req,res){
	Answer.findById(req.params.answers_id , function(err,foundAnswer){
		if(err){
			res.redirect("back");
			console.log(err);
		}
		else{
			res.render("ansedit",{questions_id:req.params.id , answers:foundAnswer});	
		}
	});
});

//Update routes
router.put("/newsfeed/:id/answer/:answers_id",checkAnswerOwnership,function(req,res){
	Answer.findByIdAndUpdate(req.params.answers_id,req.body.answer,function(err,updatedAnswer){
		if(err){
			console.log(err);
			res.redirect("back");
		}
		else{
			
			res.redirect("/newsfeed/"+req.params.id);
		}
	});
});

//Delete routes
router.delete("/newsfeed/:id/answer/:answers_id",function(req,res){
	Answer.findByIdAndRemove(req.params.answers_id,function(err){
		if(err){
			req.flash("error","Something went wrong.");
			res.redirect("back");
			console.log(err);
		}
		else{
			req.flash("success","Comment deleted");
			res.redirect("/newsfeed/"+req.params.id);
		}
	})
});


//MIDDLEWARE
function checkAnswerOwnership(req,res,next){
	//is user logged in
	if(req.isAuthenticated()){
		
		Answer.findById(req.params.answers_id, function(err,foundAnswer){
		if(err){
			req.flash("error","Comment not found");
			res.redirect("back");
		}
		else{
			//does user own this answer?
			if(foundAnswer.author.id.equals(req.user._id)){
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
		res.redirect("back");
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