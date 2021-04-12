# my authentication-practice notes

I'm following a udemy course by Angela Yu (Web Development Bootcamp)
I have a local .env file that contains my MongoDB URI as well as a secret key for mongoose-encryption.

Already learned express, bodyparser, mongoose, dotenv
I could probably implement those ones without reference

New stuff i learned here:

- Level 2. mongoose-encryption
- Level 3. md5
- Level 4. bcrypt
- Level 5. passport
- Level 6. OAuth

## ► mongoose-encryption (Level 2 - Database Encryption)

`npm install mongoose-encryption`

- It's basically an encryption library that I can use to encrypt and decrypt models. I'm not sure what to models are specifically, but it's kind of used as a way to access collections in mongodb so I would much prefer to refer to them as collections.
- Encryption is a weak way to secure passwords because it's you can encrypt and decrypt it if you have the secret key.

## ► md5 (Level 3 Hashing Passwords)

`npm install md5`

- Possibly the easiest to implement and very self-explanatory to use just `md5(string)` and it returns an hashed version of that string`
- **Hashing** is secure because:
  - It takes a lot of time to decrypt it back to its original string. From what I researched, it's theoretically irreversible the more characters you put.
  - You don't have store any secret keys within environment variables or whatever.
  - You only store the hashed string on the database. So even if database gets hacked, no one knows the contents of the password.

## ► bcrypt (Level 4 Salting)

`npm install bcrypt`

- Sometimes there are errors with installation so check the npm docs or github page.
- I got introduced to the concept of **Salting**:
  - It's basically: password + salt --hashing algorithm--> hashed string
  - You give users randomly generated salts. Which means even if they have the same password, their hashed string will always be different.
  - **Salt Rounds** are the number of times you rehash until it gets to the point that you can't even guess it anymore.
  - More salt rounds means the algorithm is slower too, so don't get carried away.
- The function isn't something I'm used to because it's not as simple to use as md5 but I guess it's ok.

## ► passport (Level 5 Using Passportjs to add cookies and sessions)

`npm install passport`
`npm install passport-local`
`npm install passport-local-mongoose`
`npm install express-session`

> It's like some sort of weird game - Angela (on the node package names)

- Dear God, there's a lot of boilerplate for this one. It wasn't that simple to implement. Or I just suck. :(

### My notes on how to use it. (order is important!)

#### Requires

```javascript
var session = require("express-session"); // read the docs why
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
// notice how we don't need to require passport-local, it's done by passport-local-mongoose so no worries.
```

#### After your other express uses and sets

```javascript
app.use(
  session({
    secret: "Our little secret.", // I personally recommend storing this in .env
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.intiialize()); // idk why, docs say so...
app.use(passport.session()); // docs say so as well... :C
```

#### After setting up your mongoose schema and model for user collection

```javascript
// Setting up user database (schema)
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});
// -- Finished setting up user schema here --

userSchema.plugin(passportLocalMongoose); // not sure if this is needed after OAuth

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// I got these from the docs.
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});
```

> Boilerplate is done so now time to try implementing it in your API routes

#### When you want to "Authenticate" someone (preferrably through POST)

```javascript
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
```

There are two functions you basically have to remember here:

- `User.register()`
  I might have to do more research so (note to self). But I think `User.register()` is there because of the 3 lines we wrote after creating the model for User. It also automatically hashes the password which is why we didn't need to install any hashing algorithm.
- `passport.authenticate('local')(req, res, customCallback)`
  Just read the docs on this one. I also think that after calling `res.redirect('/secrets')` here, we're basically passing data that contains the `.isAuthenticated()` method that the redirected route can access.
  After this method. That's probably how it stores the session as a cookie inside the user's browser.

#### When you want to see if someone is "Authenticated"

```javascript
app.get("/secrets", function (req, res) {
  console.log(req.isAuthenticated);
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});
```

We already know that redirecting in `.authenticate(...)` passes data that contains the `.isAuthenticated()` method. `/secrets` basically catches that and checks if the user is authenticated. If yes then the page is rendered. If not, then the page redirects to `/login`.

### OAuth (Level 6 - Google OAuth)

Read the docs here: http://www.passportjs.org/

1. `npm install passport-google-oauth20`
2. `npm install mongoose-findorcreate`

How to use:

```js
// 1. REQUIRES
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

// 2. PUT THIS AFTER DECLARING THE SCHEMA (make sure schema has a googleId field to store profile Id)
userSchema.plugin(findOrCreate);

// 3. SETUP GOOGLE STRATEGY (I got this from passport docs)
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets", // After logging in, google redirects user to this link.
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo", // Gets rid of the deprecated Google+ bug.
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);
```

Routes:

```js
// Path when clicking "Login with Google" button on your site.
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] }) //This takes you to the Google Login Page
);

// Path after clicking logging in. (The callback that you assign to the Google Cloud Platform for your API)
app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);
```
