var mongoose = require("mongoose");
var Question = require("./models/questions"),
	Tag = require("./models/tags"),
	Answer = require("./models/answers");

var data = [
	{tagname : "Architect"},
	{tagname : "Arts"},
	{tagname : "Business"},
	{tagname : "Education"},
	{tagname : "Engineering"},
	{tagname : "Entrepreneur"},
	{tagname : "Gaming"},
	{tagname : "Healthcare"},
	{tagname : "Hospitality"},
	{tagname : "IT"},
	{tagname : "Marketing"},
	{tagname : "Media"},
	{tagname : "Influencer"},
	{tagname : "Sport"}
];
function seedDB(){
	data.forEach (function(seed){
		Tag.create(seed,function(err,tag){
			if(err){
				console.log(err);
			}
			else{
				console.log("added new tag");
			}
		});
	});
};

module.exports = seedDB	;
