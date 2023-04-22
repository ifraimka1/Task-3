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

app.post('/login', passport.authenticate('local',
    {
        failureRedirect: '/login'
    }),
    (req, res) => {
        // NOT OK
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
