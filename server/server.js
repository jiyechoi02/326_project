const express = require('express')
const app = express()
const path = require('path')
const PORT = process.env.PORT || 2986
const mongoose = require('./db')
var mustacheExpress = require('mustache-express')
const bodyParser = require('body-parser');
const schemas = require('./schemas')
const requests = require('./mongo_requests')
const axios = require("axios")
const cheerio = require("cheerio")
const getInfo = require("./scrape")


// Mongoose Models
const Article = mongoose.model("Article", schemas.article)
const Rating = mongoose.model("Rating", schemas.rating)
const Company = mongoose.model("Company", schemas.company)

// Routing Setup
const UIRouter = express.Router()
app.use('/', UIRouter);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', './view');
app.engine('html', mustacheExpress());
app.set('view engine', 'html');
UIRouter.use(express.static(path.join(__dirname + './../view')))

// Routes
app.get('/companies/:company/articles', (req, res) => {
    const company = req.params.company
    requests.getCompanyArticles(company).then((value) => {
        res.json(value)
    }, (reason) => {
        console.log(reason)
        res.sendStatus(500)
    })
})

app.get('/companies/:company/rating', (req, res) => {
    const company = req.params.company
    requests.getCompanyRating(company).then(
        (rating) => {
            console.log(rating)
            res.json(rating)
        },
        (reason) => {
            console.log(reason)
            res.sendStatus(500)
        })
})

app.get('/companies/:company/info', (req, res) => {
    requests.getCompanyInfo(req.params.company).then((info) => {
        console.log(info)
        res.json(info)
    }, (reason) => {
        console.log(reason)
        res.sendStatus(500)
    })
})

app.get('/companies/:company/review',(req,res)=>{
    const company = req.params.company
    requests.getUserReview(company).then(
        (review)=>{
            console.log(review)
            res.json(review)
        },
        (reason) =>{
            console.log(reason)
            res.sendStatus(500)
        })
})

app.post('/companies/:company/article', (req,res) => {
    /* {
        url: (link to the article)
    } */
    let article = req.body
    article.company = req.params.company
    requests.insertCompanyArticle(article).then(value => {
        res.sendStatus(200)
    }, reason => {
        console.log(reason)
        res.sendStatus(500)
    })
    
})

app.post('/companies/:company/rating', (req,res) => {
    let rating = req.body 
    rating.company = req.params.company
    requests.insertCompanyRating(rating).then((value) => {
        res.sendStatus(200)
    }, (reason) => {
        console.log(reason)
        res.sendStatus(500)
    })
})

app.post('/companies/:company/info', (req,res) => {
    let companyInfo = req.body
    companyInfo.company = req.params.company
    requests.insertCompanyInfo(companyInfo).then((info) => {
        console.log("Successfully inserted company info")
        res.sendStatus(200)
    }, (reason) => {
        console.log(reason)
        res.sendStatus(500)
    })
    /* example companyInfo:
    {
        company: "CocaCola",
        industry: "Food Service",
        location: "Dallas, TX",
        about: "CocaCola is a company that blah blah blah",
        links: {
            website: "https://www.coca-cola.com/",
            facebook: "https://www.facebook.com/CocaColaUnitedStates/"
        }
    }
    */
})

app.post('/companies/:company/review', (req,res) => {
    let review = req.body
    review.company = req.params.company
    review.rating = Number(review.rating)
    req.app.set('url', review.siteURL)
    Promise.all([requests.insertUserReview(review), requests.insertCompanyRating({company: req.params.company, overallRating: review.rating})]).then((info) => {
        console.log("Successfully inserted review")
        res.redirect('/product')
    }, (reason) => {
        console.log(reason)
        res.sendStatus(500)
    })
})

app.get('/', function (req, res) {
    res.render('mainPage');
})

app.post('/processLink', function (req, res) {
    res.redirect(307, '/product');
})

app.get('/product', function (req, res) {
    let siteURL = req.app.get('url')
    let modifiedSiteURL = siteURL.substring(0, siteURL.lastIndexOf('?'))
    if (modifiedSiteURL.length != 0) {
        if (modifiedSiteURL.includes("ref=")) {
            siteURL = modifiedSiteURL.substring(0, modifiedSiteURL.lastIndexOf('/'))
        } else {
            siteURL = modifiedSiteURL
        }
    }
    console.log(siteURL)
    const info = {}
    axios.get(siteURL)
        .then((response) => {
            if (response.status === 200) {
                const html = response.data;
                const $ = cheerio.load(html);

                info.product_name = $("#productTitle").text().trim();
                info.comp_name = $("#bylineInfo").text().trim();
                info.product_img = $('#landingImage').attr('src');

                companyarticles = getInfo.getArticles(info.comp_name)
                companyrating = requests.getCompanyRating(info.comp_name)
                companyinfo = getInfo.getRanks(info.comp_name)
                companyReviews = requests.getUserReviews(info.comp_name)

                Promise.all([companyarticles, companyrating, companyinfo, companyReviews])
                    .then((companyinfofields) => {
                        let articles = companyinfofields[0]
                        const ratings = companyinfofields[1]
                        const compInfo = companyinfofields[2]
                        let reviews = companyinfofields[3]

                        articles = articles.map((object) => {
                            return {
                                url: object.url,
                                title: object.title,
                                published_date: object.published_date,
                                excerpt: object.excerpt
                            }
                        })
                        reviews = reviews.map((doc) => {
                            return {
                                title: doc.title,
                                user: doc.user,
                                rating: doc.rating,
                                review: doc.review
                            }
                        })

                        info.articles = articles;
                        info.reviews = reviews
                        info.location = compInfo.location;
                        info.about = compInfo.about;
                        info.links = compInfo.links;
                        info.industry = compInfo.industry;
                        info.phone = compInfo.phone
                        info.csrhubRating = compInfo.csrhubRating;
                        info.siteURL = siteURL;
                        if (ratings) {
                            info.ratings = 20*(ratings.overallAverage).toFixed(0);
                        }
                        else {
                            info.ratings = "None"
                        }
                        res.render('product', info);
                    }).catch((err) => {
                        console.log(err)
                    })
            } else { res.sendStatus(400) }
        }, (error) => { console.log(error); res.redirect('/product')})
        .catch(error => { console.log(error); res.redirect('/product') })


})

//example of rendering a page with json object
app.post('/product', function (req, res) {
    let siteURL = req.body.searchBar
    req.app.set('url', siteURL)
    res.redirect('/product')
   
    
})

app.listen(PORT, () => {console.log("Main server listening")})

// const AmazonInfo = {
//     company: "Amazon",
//     location: "Seattle, WA",
//     industry: "Online Marketplace",
//     about: "Amazon.com, Inc., is an American multinational technology company based in Seattle that focuses on e-commerce, cloud computing, digital streaming, and artificial intelligence. It is considered one of the Big Four tech companies, along with Google, Apple, and Facebook",
//     links: {
//         website: "https://amazon.com",
//         facebook: "https://facebook.com"
//     }
// }

// const CocaColaInfo = {
//     company: "CocaCola",
//     industry: "Food Service",
//     location: "Dallas, TX",
//     about: "CocaCola is a company that blah blah blah",
//     links: {
//         website: "https://www.coca-cola.com/",
//         facebook: "https://www.facebook.com/CocaColaUnitedStates/"
//     }
// }

// const GoogleInfo = {
//     company: "Google",
//     industry: "Technology",
//     location: "San Francisco, CA",
//     about: "Google is a company that blah blah blah",
//     links: {
//         website: "https://www.google.com/",
//         facebook: "https://www.facebook.com/Google/"
//     }
// }

// console.log("Attempting to insert article: ")
// requests.insertCompanyArticle({url: "www.google.com"}).then(value => {
//     console.log(value)
// })

// let testInsertInfo = (AmazonInfo, CocaColaInfo, GoogleInfo) => {
//     console.log("Attempting to insert to Company Info schema")

//     Company.findOneAndUpdate(
//         {company: AmazonInfo.company},
//         AmazonInfo,
//         {upsert: true, new: true, runValidators: true},
//         (err, doc) => {
//             if (err) {
//                 console.log("error" + err)
//             }
//             else {
//                 console.log(doc)
//             }
//         })

//         Company.findOneAndUpdate(
//             {company: CocaColaInfo.company},
//             CocaColaInfo,
//             {upsert: true, new: true, runValidators: true},
//             (err, doc) => {
//                 if (err) {
//                     console.log("error" + err)
//                 }
//                 else {
//                     console.log(doc)
//                 }
//             })

//             Company.findOneAndUpdate(
//                 {company: GoogleInfo.company},
//                 GoogleInfo,
//                 {upsert: true, new: true, runValidators: true},
//                 (err, doc) => {
//                     if (err) {
//                         console.log("error" + err)
//                     }
//                     else {
//                         console.log(doc)
//                     }
//                 })
// }

// testInsertInfo(AmazonInfo, CocaColaInfo, GoogleInfo)

// let company = "CocaCola"
// companyArticles = requests.getCompanyArticles(company)
// companyRating = requests.getCompanyRating(company)
// companyInfo = requests.getCompanyInfo(company)

// Promise.all([companyArticles, companyRating, companyInfo]).then((companyInfoFields) => {
//     let articles = companyInfoFields[0]
//     const ratings = companyInfoFields[1]
//     const compInfo = companyInfoFields[2]

//     console.log("articles: \n" + articles)
//     console.log("ratings: \n" + ratings)
//     console.log("info: \n" + compInfo)

//     articles = articles.map((object) => { return { url: object.url}})

//     console.log("\n\n mapped articles: " + articles[0].url)
// })