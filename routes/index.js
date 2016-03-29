var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var router = express.Router();
var basex = require('basex');
var client = new basex.Session("127.0.0.1", 1984, "admin", "admin");
var namespace = "declare namespace tei= 'http://www.tei-c.org/ns/1.0';"
var parseString = require('xml2js').parseString;

var url = require('url');

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index');
});

/* GET about page. */
router.get('/about', function (req, res) {
    res.render('about');
});

/* GET search page. */
router.get('/search', function (req, res) {
    res.render('search', {query: []});
});

router.post('/searching', function(req, res) {
    var query = req.body.query;
    res.redirect('/keyword?search='+query);
});

/* POST search page. */
router.get('/keyword', function (req, res) {
    var url_parts = url.parse(req.url, true);
    var search = url_parts.query.search;
    var input = namespace + " for $doc in collection('Colenso') where fn:contains($doc,'" + search + "') return document-uri($doc)";
    var query = client.query(input);

    console.log(input);

    query.execute(function (err, r) {
        if (err) {
            console.log("OH NO ERROR");
        }
        console.log(r.result);

        var results = r.result;
        var arr = results.toString().split("\n");
        console.log(arr);
        res.render('search', {query: arr});
    });

});

router.get ('/document', function(req, res) {
    var url_parts = url.parse(req.url, true);
    var file = url_parts.query.file;
    var input = namespace + " doc('" + file +"')";
    var query = client.query(input);

    query.execute(function (err, r) {
        parseString(r.result.toString(), function (err, result) {
            console.dir(result.TEI.text);
            res.render('docdisplay', {documentraw : r.result, document : result});
        });

    });
});

module.exports = router;
