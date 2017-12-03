const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');

//using ES6 promises
mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');
const {BlogPost} = require('./models');

const app = express();
app.use(bodyParser.json());

app.get('/posts', (rep, res) => {
	BlogPost
		.find()
		.then(posts => {
			res.json({
				posts: posts.map(
					(post) => post.apiRepr())
			});
		})
		.catch(
			err => {
				console.error(err);
				res.status(500).json({message: 'Internal server error'});
			});
});

app.get('/posts/:id', (req, res) => {
	BlogPost
		.findById(req.params.id)
		.then(post => res.json(post.apiRepr()))
		.catch(err => {
			console.error(err);
		res.status(500).json({message: 'Internal server error'});
		});
});

app.post('/posts', (req, res) => {
	const requiredFields = ['title', 'author', 'content'];
	for(let i=0; i<requiredFields.length; i++) {
		const field = requiredFields[i];
		if(!(field in req.body)) {
			const message = `Missing ${field} in request body`;
			console.error(message);
			return res.status(400).send(message);
		}
	}
	BlogPost
		.create({
			title: req.body.title,
			author: req.body.author,
			content: req.body.content
		})
		.then(post => res.status(201).json(post.apiRepr()))
		.catch(err => {
			console.error(err);
			res.status(500).json({message: 'Internal server error'});
		});
});

app.put('/posts/:id', (req, res) => {
	if(!(req.params.id && req.body.id && req.params.id === req.body.id)) {
		const message = (`Request path ID (${req.params.id}) and request body ID ` + `(${req.body.id}) must match`);
		console.error(message);
		return res.status(400).json({"message": message});
	}
	const toUpdate = {};
	const updateableFields = ['title', 'author', 'content'];
	updateableFields.forEach(field => {
		if(field in req.body) {
			toUpdate[field] = req.body[field];
		}
	});
	BlogPost
		.findByIdAndUpdate(req.params.id, {$set: toUpdate})
		.then(post => res.status(200).json(post.apiRepr()))
		.catch(err => res.status(500).json({message: 'Internal server error'}));
});

app.delete('/posts/:id', (req, res) => {
	BlogPost
		.findByIdAndRemove(req.params.id)
		.then(res.status(204).end())
		.catch(err => res.status(500).json({message: 'Internal server error'}));
});

let server;

function runServer(databaseUrl=DATABASE_URL, port=PORT) {
	return new Promise((resolve, reject) => {
		mongoose.connect(databaseUrl, err => {
			if(err) {
				return reject(err);
			}
			server = app.listen(port, () => {
				console.log(`Your app is listening on port ${port}`);
				resolve();
			})
			.on('error', err => {
				mongoose.disconnect();
				reject(err);
			});
		});
	});
}

function closeServer() {
	return mongoose.disconnect().then(() => {
		return new Promise((resolve, reject) => {
			console.log('Closing Server');
			server.close(err => {
				if(err) {
					return reject(err);
				}
				resolve();
			});
		});
	});
}

if(require.main === module) {
	runServer().catch(err => console.error(err));
};

module.exports = {app, runServer, closeServer};