//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser =  require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose")


const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));

//setup app to use sessions
app.use(session({
    secret: "Our little secret",
    resave: false,
    saveUninitialized: false
}))


//setup app to use passport
app.use(passport.initialize());
app.use(passport.session());





const link = process.env.URL;
// connect mongoose with mongoDB
mongoose.connect(link, {useNewUrlParser: true});
// mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser());

//get home page
app.get("/", function(req, res){
    res.render("home");
})

app.route("/secrets")

.get(function(req, res){
    if(req.isAuthenticated()){
        res.render("secrets")
    } else {
        res.redirect("/login")
    }
})

// get register page
app.route("/register")

.get(function(req, res){
    res.render("register");
})

.post(function(req, res){
   User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err){
        console.log(err);
        res.redirect("/register");
    } else{
        passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
        })
    }
   })
})


//route for login 
app.route("/login")

//get login page
.get(function(req, res){
    res.render("login");
})

//post request 
.post(function(req, res){
    const user = new User({
        username: req.body.username, 
        password: req.body.password
    });

    req.login(user, function(err){
        if(err) {
            console.log(err);
        } else {
            passport.authenticate("local");
        }
    })

    });


//create logout route
app.route("/logout")

.get(function(req, res){
    req.logout();
    res.redirect("/");

})


app.listen(3000, function(){
    console.log("server started at port 3000");
})