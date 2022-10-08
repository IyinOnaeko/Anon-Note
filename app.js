//jshint esversion:6
const express = require("express");
const ejs = require("ejs");
const bodyParser =  require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();
const encrypt = require("mongoose-encryption");



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

//create encryption
const secret = process.env.SEC;
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});

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
    const password = req.body.password;

    User.findOne({email: userName}, function(err, foundUser){
        if(err) {
            console.log(err)
        } else {
            if(foundUser){
                console.log(foundUser);
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
        password : req.body.password
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