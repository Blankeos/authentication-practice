# my authentication-practice notes

I'm following a udemy course by Angela Yu (Web Development Bootcamp)
I have a local .env file that contains my MongoDB URI as well as a secret key for mongoose-encryption.

Already learned express, bodyparser, mongoose, dotenv
I could probably implement those ones without reference

New stuff i learned here:

- mongoose-encryption
- md5
- bcrypt
- passport

## mongoose-encryption (Level 2 - Database Encryption)

`npm install mongoose-encryption`

- It's basically an encryption library that I can use to encrypt and decrypt models. I'm not sure what to models are specifically, but it's kind of used as a way to access collections in mongodb so I would much prefer to refer to them as collections.
- Encryption is a weak way to secure passwords because it's you can encrypt and decrypt it if you have the secret key.

## md5 (Level 3 Hashing Passwords)

`npm install md5`

- Possibly the easiest to implement and very self-explanatory to use just `md5(string)` and it returns an hashed version of that string`
- **Hashing** is secure because:
  - It takes a lot of time to decrypt it back to its original string. From what I researched, it's theoretically irreversible the more characters you put.
  - You don't have store any secret keys within environment variables or whatever.
  - You only store the hashed string on the database. So even if database gets hacked, no one knows the contents of the password.

## bcrypt (Level 4 Salting)

`npm install bcrypt`

- Sometimes there are errors with installation so check the npm docs or github page.
- I got introduced to the concept of **Salting**:
  - It's basically: password + salt --hashing algorithm--> hashed string
  - You give users randomly generated salts. Which means even if they have the same password, their hashed string will always be different.
  - **Salt Rounds** are the number of times you rehash until it gets to the point that you can't even guess it anymore.
  - More salt rounds means the algorithm is slower too, so don't get carried away.
- The function isn't something I'm used to because it's not as simple to use as md5 but I guess it's ok.

## passport (Level 5 Using Passportjs to add cookies and sessions)

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

userSchema.plugin(passportLocalMongoose); //

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
```

Basically, you add passportLocalMongoose as a plugin to the schema.
Then after creating the model, you execute those three functions there which are the use, serializeUser, and deserializeUser.

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
