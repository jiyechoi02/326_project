const axios = require("axios")
const cheerio = require("cheerio")
const requests = require('./mongo_requests')

const fetchData = async (siteUrl) => {
    const result = await axios.get(siteUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36'
        }
    });
    return cheerio.load(result.data);
};

const getInfo = async (siteUrl) => {
    const $ = await fetchData(siteUrl);
    let info = {
        "product_name": $("#productTitle").text().trim(),
        "comp_name": $("#bylineInfo").text().trim(),
        "product_img": $('#landingImage').attr('src'),
        "articles": await getArticles($("#bylineInfo").text().trim()),
        "csrhub": await getRanks($("#bylineInfo").text().trim()),
        "links": requests.getCompanyInfo($("#bylineInfo").text().trim()).links
    };
    console.log(info)
    return info;
}

const fetchArticles = async (articlesUrl) => {
    const result = await axios.get(articlesUrl);
    return cheerio.load(result.data);
};

exports.getArticles = (name) => {
    return new Promise((resolve, reject) => {
        try{
            const companyPageURL = "https://www.csrhub.com/CSR_and_sustainability_information/" + name;
            fetchArticles(companyPageURL).then($ => {
                const articlesUrl = "https://www.csrhub.com/" + $(".company-section_news-and-jobs :first-child").attr('href')
                console.log(articlesUrl)
                fetchArticles(articlesUrl).then($ => {
                    let articles = [];
                    $(".content-page__news_feed a").each(function (i) {
                        var article = {
                            "title": $(this).text().trim(),
                            "url": $(this).attr('href'),
                            company: name
                        }
                        articles.push(article);
                    });
                    const articlePromises = []
                    articles.forEach(article => {
                        articlePromises.push(requests.insertCompanyArticle(article))
                    })
                    Promise.all(articlePromises).then(values => {
                        requests.getCompanyArticles(name).then(articles => {
                            resolve(articles)
                        })
                    }).catch(error => {
                        console.log("error inserting articles, returning empty array")
                        console.error(error)
                        resolve([])
                    })
                }).catch(err => {reject(err)})
            }).catch(err => reject(err))
        } catch (err){
            reject(err)
        }
    })
}

const fetchRank = async (rankUrl) => {
    const result = await axios.get(rankUrl);
    return cheerio.load(result.data);
};

exports.getRanks = (name) => {
    return new Promise((resolve, reject) => {
        try{
            var rankUrl = "https://www.csrhub.com/CSR_and_sustainability_information/" + name;
            fetchRank(rankUrl).then($ => {
                const csrhubInfo = {
                    "company": name,
                    "about": $("div.company-section_descr p").text(),
                    "phone": $("tr:contains('Phone') td").text().slice(8),
                    "industry": $("tr:contains('Industry') td ").text().slice(9),
                    "csrhubRating": $("span.value").html(),
                    links: {website: "www." + encodeURIComponent(name) + ".com", facebook: "Facebook.com/" + encodeURIComponent(name)}
                }
                requests.insertCompanyInfo(csrhubInfo).then(value => {
                    requests.getCompanyInfo(name).then(value => {
                        resolve(value)
                    })
                })
            }).catch(err => {
                requests.getCompanyInfo(name).then(value => {
                    resolve(value)
                })
            })
        } catch (err){
            resolve(err)
        }
    })

    
}


exports.getInfo = getInfo;