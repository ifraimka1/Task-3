const express = require('express');
const { Liquid } = require('liquidjs');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const GoogleStrategy = require('passport-google-oidc');

const userRoutes = require('./user');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const fs = require('fs');
const userList = [];

fs.readFile('./users.json', (err, data) => {
    if (err) {
        throw err;
    }
    Object.assign(userList, JSON.parse(data));
    console.log(userList);
});

const app = express();
const port = 3000;
const engine = new Liquid();
// register liquid engine
app.engine('liquid', engine.express());
app.set('views', './views');            // specify the views directory
app.set('view engine', 'liquid');       // set liquid to default

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

app.use(bodyParser.urlencoded());
app.use(cookieParser());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
    function (username, password, done) {
        const user = userList.find(item => item.username == username);
        console.log(user);
        if (user && user.password == password) {
            done(null, {
                login: user.username,
                name: user.name,
                role: user.role
            });
        } else {
            done(null, false);
        }
    }
));

passport.use(new GoogleStrategy({
    clientID: '307820205013-b1crdfgc0ll3k4qqimihd5joleabn89c.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: 'http://localhost:3000/oauth2/redirect/google'
},
    function (issuer, profile, done) {
        done(null, {
            login: profile.emails[0].value,
            name: profile.displayName
        });
    }
));


function auth(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/login/google', passport.authenticate('google', {
    scope: ['email', 'profile']
}));

app.post('/login', passport.authenticate('local',
    {
        failureRedirect: '/login'
    }),
    (req, res) => {
        // NOT OK
        res.redirect('/');
    });

app.get('/oauth2/redirect/google',
    passport.authenticate('google', { failureRedirect: '/login', failureMessage: true }),
    function (req, res) {
        res.redirect('/');
    });

app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/login');
    })
});

app.get('/', auth, (req, res) => {
    res.render('home', {
        name: req.user.name,
        role: req.user.role
    });
});

app.get('/admin', (req, res) => {
    res.render('admin', {
        role: req.user.role,
        userList: userList
    });
});

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

app.use('/user', auth, userRoutes);

app.listen(port, () => console.log('started'));
