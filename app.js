//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser =  require("body-parser");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
const md5 = require("md5");



const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));


const link = process.env.URL;
// connect mongoose with mongoDB
mongoose.connect(link, {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

//create encryption using encryption key
// const secret = process.env.SEC;
// userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema);


//get home page
app.get("/", function(req, res){
    res.render("home");
})


//route for login 
app.route("/login")

//get login page
.get(function(req, res){
    res.render("login");
})

//post request 
.post(function(req, res){
    //store username and password
    const userName = req.body.username;
    const password = md5(req.body.password);

    User.findOne({email: userName}, function(err, foundUser){
        if(err) {
            console.log(err)
        } else {
            if(foundUser){
                if(foundUser.password === password) {
                    res.render("secrets")
                }
            }
        }
    })
})



// get register page
app.route("/register")


.get(function(req, res){
    res.render("register");
})

.post(function(req, res){
    const newUser = new User ({
        email : req.body.username,
        password : md5(req.body.password)
    });

    newUser.save(function(err){
        if(err) {
            console.log(err);
        } else {
            res.render("secrets");
        }
    })
})









app.listen(3000, function(){
    console.log("server started at port 3000");
})