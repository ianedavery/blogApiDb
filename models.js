const mongoose = require('mongoose');

//blogpost schema
const blogSchema = mongoose.Schema({
	title: {type: String, required: true},
	author: {
		firstName: {type: String, required: true},
		lastName: {type: String, required: true}
	},
	content: {type: String, required: true},
	date: {type: Date} 
});

blogSchema.virtual('nameString').get(function () {
	return `${this.author.firstName} ${this.author.lastName}`.trim()
});

blogSchema.methods.apiRepr = function() {
	return {
		id: this._id,
		title: this.title,
		author: this.nameString,
		content: this.content
	};
}

const BlogPost = mongoose.model('BlogPosts', blogSchema);

module.exports = {BlogPost};