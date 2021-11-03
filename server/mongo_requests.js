const schemas = require('./schemas')
const mongoose = require("./db")

// Mongoose Models
const Article = mongoose.model("Article", schemas.article)
const Rating = mongoose.model("Rating", schemas.rating)
const Company = mongoose.model("Company", schemas.company)
const Review = mongoose.model("Review", schemas.review)

function getCompanyArticles(company) {
    return new Promise((resolve, reject) => {
        try{
            Article.find({ company: company }, (err, articles) => {
                if (err){
                    reject(err)
                }
                else{
                    resolve(articles)
                }
            })
        } catch (err){
            reject(err)
        }
    })
}

function getCompanyRating(company) {
    return new Promise((resolve, reject) => {
        try {
            Rating.aggregate([
                {$match: {company: company}}, 
                {$group: {_id: "$company", overallAverage: {$avg: "$overallRating"}}}
            ]).then(ratings => {
                console.log("Ratings from rating function: " + ratings)
                resolve(ratings[0])
            }, reason => {
                console.log(reason)
                reject(reason)
            })
        } catch (err){
            console.log(err)
            reject(err)
        }
    })
}

function getCompanyInfo(company){
    return new Promise((resolve, reject) => {
        try {
            Company.findOne({ company: company}, (err, res) => {
                if (err){
                    reject(err)
                }
                else {
                    resolve(res)
                }
            })
        } catch (err){
            console.log(err)
            reject(err)
        }
    })
}

function getUserReviews(company){
    return new Promise((resolve, reject)=>{
        try{
            Review.find({ company: company}, (err, res)=>{
                if(err){
                    reject(err)
                }
                else{
                    resolve(res)
                }
            })
        } catch (err){
            console.log(err)
            reject(err)
        }
    })
}

function insertCompanyArticle(article) {
    return new Promise((resolve, reject) => {
        try{
            Article.findOneAndUpdate(
                {url: article.url},
                article,
                {upsert: true, new: true, runValidators: true},
                (err, doc) => {
                    if (err) {
                        reject(err)
                    }
                    else {
                        resolve(doc)
                    }
                })
        } catch (err){
            reject(err)
        }
    })
}

function insertCompanyRating(rating) {
    return new Promise((resolve, reject) => {
        try{
            const companyRating = new Rating(rating)
            companyRating.save({}, (err, product) => {
                if (err){
                    reject(err)
                }
                else{
                    resolve(product)
                }
            })
        } catch (err){
            reject(err)
        }
    })
}

function insertCompanyInfo(companyInfo) {
    return new Promise((resolve, reject) => {
        try{
            Company.findOneAndUpdate(
                {company: companyInfo.company},
                companyInfo,
                {upsert: true, new: true, runValidators: true},
                (err, doc) => {
                    if (err) {
                        console.log(err)
                        reject(err)
                    }
                    else {
                        console.log(doc)
                        resolve(doc)
                    }
                })
        } catch (err){
            reject(err)
        }
    })
}

function insertUserReview(review){
    return new Promise((resolve, reject) =>{
        try{
            Review.findOneAndUpdate(
                {user : review.user, company: review.company},
                review,
                {upsert: true, new: true, runValidators: true},
                (err, doc) => {
                    if (err) {
                        console.log(err)
                        reject(err)
                    }
                    else {
                        console.log(doc)
                        resolve(doc)
                    }
                })
        }catch (err){
            reject(err)
        }   
    })
}

exports.insertCompanyArticle = insertCompanyArticle
exports.insertCompanyRating = insertCompanyRating
exports.insertCompanyInfo = insertCompanyInfo
exports.insertUserReview = insertUserReview
exports.getCompanyArticles = getCompanyArticles
exports.getCompanyRating = getCompanyRating
exports.getCompanyInfo= getCompanyInfo
exports.getUserReviews = getUserReviews