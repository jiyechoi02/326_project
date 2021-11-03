const mongoose = require('./db')

// Mongoose Schemas
const CompanyArticleSchema = new mongoose.Schema({
    company: {type: String, required: true},
    url: {type: String},
    title: {type: String, default: "No Title Provided"},
    published_date: {type: String, default: "Month Day, Year"},
    excerpt: {type: String, default: "No excerpt Provided"}
})

const CompanyRatingSchema = new mongoose.Schema({
    company: {type: String, required: true},
    overallRating: {type: Number, min: 0, max: 100}
})

const CompanyInfoSchema = new mongoose.Schema({
    company: {type: String, required: true},
    industry: {type: String},
    location: {type: String},
    csrhubRating: {type: String},
    phone: {type: String},
    about: {type: String},
    links: {
        type: {website: {type: String}, facebook: {type: String}},
        default: null
    }
})

const UserReviewSchema = new mongoose.Schema({
    company: {type : String, required : true},
    title : {type : String},
    user : {type : String},
    review : {type : String},
    rating : {type : Number}
})

module.exports = {company: CompanyInfoSchema, rating: CompanyRatingSchema, article: CompanyArticleSchema, review: UserReviewSchema}