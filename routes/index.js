var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var router = express.Router();
var basex = require('basex');
var client = new basex.Session("127.0.0.1", 1984, "admin", "admin");
var namespace = "declare namespace tei= 'http://www.tei-c.org/ns/1.0';"
var parseString = require('xml2js').parseString;
var path = require('path');
var multer = require('multer');
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });
var log = require("debug");
basex.debug_mode = true;

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

router.post('/searchingLogical', function(req, res) {
    var query = req.body.query;
    query = query.replace("\'", "'");
    query = query.replace("AND", "ftand");
    query = query.replace("OR", "ftor");
    query = query.replace("NOT", "ftnot");
    res.redirect('/keyword?search='+query+'&type=logical');
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
    } else if (type == 'logical'){
        var input = namespace + " for $doc in collection('Colenso') where $doc [$doc contains text "+search+"] return document-uri($doc)";
    }
    var query = client.query(input);

    console.log(input);

    query.execute(function (err, r) {
        if (err) {
            console.log(err);
        }
        console.log(r.result);

        var results = r.result;
        var arr = [];
        if(typeof results != 'undefined') {
            arr = results.toString().split("\n");
        }
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
            res.render('docdisplay', {document : r.result, name : file});

    });
});

router.get('/download', function(req, res){ // this routes all types of file
    var url_parts = url.parse(req.url, true);
    var file = url_parts.query.file;

    var filePath = path.resolve("../")+'/'+file;

    res.download(filePath); // magic of download fuction

});

router.post('/upload', upload.single('file'), function(req, res) {
    console.log(req.file);
    if (typeof req.file === "undefined"){
        res.render('index', {message: "File not found"});
    }
    else {
        var doc = req.file.buffer.toString("utf-8", 0, req.file.buffer.length);
        client.execute("OPEN Colenso", function (e, r) {
            client.add(req.file.originalname, doc);
            client.execute("CLOSE");
        });
        res.render('index', {message: "Success"});
    }
});

module.exports = router;
