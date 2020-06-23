require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ejs = require('ejs');
const encrypt = require('mongoose-encryption');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({

	username: String,
	password: String
});

userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});	//To take the variable from the env file

const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {

	res.render('home');
})

app.route('/register')

	.get((req, res) => {

		res.render('register');

	})

	.post((req, res) => {

		const newUser = new User({

			username: req.body.username,
			password: req.body.password
		});

		newUser.save(err => {

			if(err) {

				console.log(err);
			}

			else {

				res.render('secrets');
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

		User.findOne({username: username}, (err, found) => {

			if(err) {

				console.log(err);
			}

			else {

				if(found.password === password) {

					res.render('secrets');
				}
			}
		})
	})

app.listen(3000, () => {

	console.log('Server Started at 3000');
})