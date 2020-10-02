const express = require("express")
//express server
const app = express()
const bodyParser = require("body-parser")
//to parse the body of incoming request
const cors = require('cors');
// to enable cross origin resource sharing
var mysql = require('mysql');
// import mysql
var uuid = require('uuid');
// to create unique ids for user
app.use(cors());
app.use(bodyParser.json());
var CryptoJS = require("crypto-js");
// to hash the note here i have used crypto-js
const url = require('url');
// to parse incoming url
const querystring = require('querystring');
// to query and extract each params as json
require('dotenv').config({path: __dirname + '/.env'})
// requiring the environment variables
var secret = process.env['SECRET'];
// my secret key
app.use(bodyParser.urlencoded({ extended: true }));
var con = mysql.createConnection({
  host: process.env['DATABASE_HOST'],
  user: process.env['DATABASE_USER'],
  password: process.env['DATABASE_PASSWORD'],
  database: process.env['DATABASE_NAME']

})
// establishing a connection to the mysql database
con.connect(function (error) {
  if (error) {
    console.log(error)
  }
  else {
    console.log("database connected");
  }
})
// first api to insert user to the database
app.post('/app/user', (req, res) => {
  var username = req.body.username;
  var password = req.body.password;
  //extracting the username and password from the form data
  if (username == undefined || password == undefined) {
    res.json({
      success: false,
      status: 'account not created'
    })
  }
  // checking for null or undefined error
  else {
    var userId = uuid.v1();
    // getting a unique uuid for the new user
    var sql = "INSERT INTO users (userId,username,password) VALUES (?)";
    // sql query to save user
    var values = [userId, username, password];
    // values provided by user
    con.query(sql, [values], function (err, result) {
      if (err){
        res.json({
          success:false,
          status:400
        })
      }
      //if error then server will respond as 400
      res.json({
        success: true,
        status: 'account created'
      })
      //if success it will respond as account created
    });
  }
})
app.post('/app/user/auth', (req, res) => {
  var username = req.body.username;
  var password = req.body.password;
  //extracting the username and password from the form data
  if (username == undefined || password == undefined) {
    res.json({
      success: false,
      status: 'please check the credentials'
    })
  }
  else {
    var sql = "SELECT * FROM users WHERE username = (?)";
    //query to select all the users with the username provided by user
    var values = [username];
    con.query(sql, [values], function (err, result) {
      if (err){
        res.json({
          success:false,
          status:400
        })
      }
      if(result[0].password===password)
      // === to check the type as well as value
      // checking the password if the password matches with the user password it send the userId
      // else it responds as check your password
      {
      res.json({
        userId: result[0].userId,
        status: 'success'
      })
    }
    else{
      res.json({
        success: false,
        status: 'please check your password'
      })
    }
    });  
  }
})

app.get('/app/sites/list', (req, res) => {
  let parsedUrl = url.parse(req.url);
  let parsedQs = querystring.parse(parsedUrl.query);
  // parse the url using url module
  // querying the value for userId
  var userId = parsedQs.users;
  var sql = "SELECT * FROM notes WHERE userId= (?)";
  // query to find the userId from database
  var values = [userId];
  con.query(sql, [values], function (err, result) {
    if (err){
      res.json({
        success:false,
        status:400
      })
    }
    var list = [];
    // empty array to store decrypted data
    result.forEach(element => {
      // running a loop to get all the encrypted notes 
      var bytes = CryptoJS.AES.decrypt(element.note, secret);
      // to get the stored decrypted note
      var originalText = bytes.toString(CryptoJS.enc.Utf8);
      list.push(originalText);
      // pushing the decrypted data to the list
    });
    res.json({
      status: 'success',
      result: list
    })
    // giving back the response
  });
})

app.post('/app/sites', (req, res) => {
  let parsedUrl = url.parse(req.url);
  let parsedQs = querystring.parse(parsedUrl.query);
  // parse the url using url module
  // querying the value for userId
  var userId = parsedQs.users;
  var note = req.body.note;
  // extracting the note from form data
  var hashedNote = CryptoJS.AES.encrypt(note, secret).toString();
  // creating the encrypted note using crypto-js
  var sql = "INSERT INTO notes (userId,note) VALUES (?)";
  // query to save the note and userId
  var values = [userId, hashedNote];
  con.query(sql, [values], function (err, result) {
    if (err){
      res.json({
        success:false,
        status:400
      })
      // responding 400 if our saving fails and error occurs
      //while storing data
    }
    res.json({
      success: true,
      status: 'success'
    })
    // responding success if the data is saved on our database
  });

})

app.listen(8000, () => {
  // running the app on port 8000
  console.log("app listening on port 8080");
})