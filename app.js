require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
var session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

// Express
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// Express session
app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Mongoose
mongoose
  .connect(process.env.MONGODB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Connected to MongoDB...");
  })
  .catch((err) => {
    console.log(err.message);
  });

mongoose.set("useCreateIndex", true);

// Setting up user database (schema)
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);

// Creating a model (collection) from the schema
const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Routes
app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  if (req.user) {
    res.redirect("/secrets");
  } else {
    res.render("login");
  }
});

app.get("/secrets", function (req, res) {
  if (req.user) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    }
  );
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.listen(3000, function () {
  console.log("App started on port 3000");
});
