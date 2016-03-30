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
    res.redirect('/keyword?search='+query+'&type=keyword');
});

router.post('/searchingXquery', function(req, res) {
    var query = req.body.query;
    res.redirect('/keyword?search='+query+'&type=xquery');
});

/* POST search page. */
router.get('/keyword', function (req, res) {
    var url_parts = url.parse(req.url, true);
    var search = url_parts.query.search;
    var type = url_parts.query.type;
    if(type == 'keyword') {
        var input = namespace + " for $doc in collection('Colenso') where fn:contains($doc,'" + search + "') return document-uri($doc)";
    } else if (type == 'xquery'){
        var input = namespace + search;
    }
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
            res.render('docdisplay', {document : r.result});

    });
});

module.exports = router;
