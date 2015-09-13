var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('client-sessions');
var bcrypt = require('bcryptjs');
var csrf = require('csurf');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId; // for creating primary key
var User = mongoose.model('User',new schema({
	id : ObjectId,
	firstName: {type: String},
	lastName: {type: String},
	email: {type: String, required:'{Path} is required.',unique:true},
	password: {type: String},

}));

var app = express();

app.set('view engine','jade');

app.locals.pretty = true;
//connect to mongodb using mongoose
mongoose.connect('mongodb://localhost/testdb');

//configure middleware
app.use(bodyParser.urlencoded({extended:true})); //for form post

//session configuration with cookies
app.use(session({
	cookieName:'session',
	secret:'sathyablablabla',
	duration:30*60*1000,
	activeDuration:5*60*1000
}));

//configure csrf
app.use(csrf()); //next in register,add token

//config routes
app.get('/',function(req,res){
	res.render('index.jade');
});

app.get('/register',function(req,res){
	//add csrf token here
	res.render('register.jade',{csrfToken:req.csrfToken()});
	//res.render('register.jade');
});

app.post('/register',function(req,res){
	//apply bcrypt to hash your pwd
	var hash = bcrypt.hashSync(req.body.password,bcrypt.genSaltSync(10));
	//res.json(req.body)
	var user = new User({
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		email: req.body.email,
		// apply hash here
		password:hash
	});
	user.save(function(err){
		if(err){
			var error = 'Something bad happened';
			if(err.code===11000){ //unique for email
				error = "sorry..email already exists";
			}
			res.render('register.jade',{error:error});
		}else{
			res.redirect('/dashboard');
		}
	});

});

app.get('/login',function(req,res){
	res.render('login.jade');
});

app.post('/login',function(req,res){
	user.findOne({email:req.body.email},function(err,user){
		if(!user){
			res.render('login.jade',{error:'Invalid email or password'});
		}
		else{
			//if(req.body.password === user.password){
				if(bcrypt.compareSync(req.body.password,user.password)){
				//write user details in session with cookie here
				req.session.user = user; //set cookie:session={email}
				res.redirect('/dashboard');
			}
			else{
				res.render('login.jade',{error:'Invalid password'});
			}
		}

	})
});

// app.get('/dashboard',function(req,res){
// 	res.render('dashboard.jade');
// });

app.get('/dashboard',function(req,res){
	//add below code to check session of user
	if(req.session && req.session.user){
		user.findOne({email:req.session.user.email},function(err,user){
			if(!user){
				req.session.reset();
				res.redirect('/login');
			}else{
				res.locals.user = user; //jade will refer values from locals..so we will store in locals
				res.render('dashboard.jade');

			}
		});
	}else{
		res.redirect('/login');
	}
});

app.get('/logout',function(req,res){
	res.redirect('/');
});

app.listen(3000);
console.log("Server running at localhost:3000");