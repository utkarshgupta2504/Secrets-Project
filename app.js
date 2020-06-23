require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ejs = require('ejs');
const bcrypt = require('bcrypt');

const saltRounds = 10;

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({

	username: String,
	password: String
});

const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {

	res.render('home');
})

app.route('/register')

.get((req, res) => {

	res.render('register');

})

.post((req, res) => {

		bcrypt.hash(req.body.password, saltRounds, (err, hash) => {	//Recieving the hash after 10 rounds of salting.

			const newUser = new User({

				username: req.body.username,
				password: hash
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

			if(found) {

				bcrypt.compare(password, found.password, (err, res1) => {

					if(res1) {

						res.render('secrets');
					}

					else {

						res.send('Incorrect Password, Please Try Again.')
					}
				})
			}

			else {

				res.send('Username not registered. You may want to register yourself up.')
			}
		}
	})
})

app.listen(3000, () => {

	console.log('Server Started at 3000');
})