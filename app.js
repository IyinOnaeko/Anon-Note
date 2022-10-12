//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser =  require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));

//setup app to use sessions
app.use(session({
    secret: process.env.SESH,
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
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());


passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.displayName });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//////////////////get home page//////////////////////////
app.get("/", function(req, res){
    res.render("home");
})
/////////get route for submit////////////////////////
app.get("/submit", function(req, res){
    if(req.isAuthenticated()){
        res.render("submit")
    } else {
        res.redirect("/login")
    }
})

//////////////////////post route for submit///////////////////
app.post("/submit", function(req,res){
    const submittedSecret = req.body.secret;
    const ID = req.user.id;
    User.findById(ID, function(err, foundUser){
        if(err) {
            console.log(err)
        } else {
            if (foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets")
                })
            }
        }
    })
})




//route for google signup
app.get("/auth/google",
    passport.authenticate("google", {scope: ["profile"]})
);


app.get('/auth/google/secrets', 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    
    res.redirect("/secrets");
  }); 
//route for secrets - route only comes up if user is logged in and authenticated
app.route("/secrets")

.get(function(req, res){
    // if(req.isAuthenticated()){
    //     res.render("secrets")
    // } else {
    //     res.redirect("/login")
    // }

    User.find({"secret" : {$ne: null}}, function(err, foundUsers){
        if (err){ 
            console.log(err)
        } else{
            if (foundUsers) {
                res.render("secrets", {usersWithSecrets : foundUsers})
            }
        }
    })
})

//////////////get register page////////////////////
app.route("/register")

.get(function(req, res){
    res.render("register");
})

.post(function(req, res){
    //register acts as mailman to create document and save to db using passport
   User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err){
        console.log(err);
        res.redirect("/register");
    } else{
        //user authentication and login for secrets route
        passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
        })
    }
   })
})


//route for login 
app.route("/login")

///////////get login page//////////////////
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
            passport.authenticate("local")(req, res, function(){
                res.redirect("secrets");
            });
        }
    })

    });


/////////////create logout route////////////////////
app.route("/logout")

.get(function(req, res){
    req.logout(function(err){
        if (err) {
            console.log(err)
        } else {
            res.redirect("/");
        }
    });
    

})


app.listen(3000, function(){
    console.log("server started at port 3000");
})  