require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ejs = require('ejs');
var session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');	//For passport module.

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

app.use(session({	//Maintains our session 

	secret: "Our little secret.",
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());	//Initializes the passport module
app.use(passport.session());	//Starts the passport session and instructs to use cookies.

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({

	username: String,
	password: String
});

userSchema.plugin(passportLocalMongoose);	//Using the passport Plugin

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());	//Creating strategy.

passport.serializeUser(User.serializeUser());		//For serialising (Adding cookie).
passport.deserializeUser(User.deserializeUser());	//For deserialising (Removing Cookie).

app.get('/', (req, res) => {

	res.render('home');
})

app.route('/secrets')

.get((req, res) => {

	if(req.isAuthenticated()) {		//Checks the cookie if present. If yes, authenicates.

		res.render('secrets');
	}

	else {

		res.redirect('/login');
	}
})

app.route('/register')

.get((req, res) => {

	res.render('register');

})

.post((req, res) => {

		User.register({username: req.body.username}, req.body.password, (err, user) => {

			if(err) {

				console.log(err);
				res.redirect('/register');
			}

			else {

				passport.authenticate('local')(req, res, () => {	//Authenticates the user and add cookie.

					res.redirect('/secrets');
				})
			}
		})
		
	});

app.route('/login') 

.get((req, res) => {

	res.render('login');
	
})

.post((req, res) => {

	const username = req.body.username;
	const password = req.body.password;

	const user = new User({

		username: username,
		password: password
	});

	req.login(user, err => {

		if(err) {

			console.log(err);
		}

		else {

			passport.authenticate('local')(req, res, () => {

				res.redirect('/secrets');
			})
		}
	})
})

app.route('logout')

.get((req, res) => {

	req.logout();	//Destroys the cookie.

	res.redirect('/');
})

app.listen(3000, () => {

	console.log('Server Started at 3000');
})