require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ejs = require('ejs');
var session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');	//For passport module.
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

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

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
  	userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  function(accessToken, refreshToken, profile, cb) {
    
  	console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({

	username: String,
	password: String,
	googleId: String,
	secret: String
});

userSchema.plugin(passportLocalMongoose);	//Using the passport Plugin
userSchema.plugin(findOrCreate);

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());	//Creating strategy.

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

app.get('/', (req, res) => {

	res.render('home');
})

app.get('/auth/google',	
	passport.authenticate('google', {scope: ['profile']}));

app.get('/auth/google/secrets', 

	passport.authenticate('google', {failureRedirect: '/login'}),

	(req, res) => {

		res.redirect('/secrets');
	})


app.route('/secrets')

.get((req, res) => {

	User.find({"secret": {$ne: null}}, (err, found) => {

		if(err) {

			console.log(err);
		}

		else {

			if(found) {

				res.render('secrets', {usersWithSecrets: found});
			}
		}
	})
})

app.route('/submit')

.get((req, res) => {

	if(req.isAuthenticated()) {		//Checks the cookie if present. If yes, authenicates.

		res.render('submit');
	}

	else {

		res.redirect('/login');
	}
})

.post((req, res) => {

	const submittedSecret = req.body.secret;

	User.findById(req.user.id, (err, found) => {

		if(err) {

			console.log(err);
		}

		else {

			if(found) {

				found.secret = submittedSecret;
				found.save(() => {

					res.redirect('/secrets');
				})
			}
		}
	})
});

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

app.route('/logout')

.get((req, res) => {

	req.logout();	//Destroys the cookie.

	res.redirect('/');
})

app.listen(3000, () => {

	console.log('Server Started at 3000');
})