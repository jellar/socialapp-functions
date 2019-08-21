const functions = require("firebase-functions");
const admin = require("firebase-admin");
const firebase = require('firebase');
const app = require('express')();
firebase.initializeApp({
    apiKey: "AIzaSyCSwLAGqvK5fyNldWW7ULLmYh1mZtSbN2I",
    authDomain: "socialapp-b0f6c.firebaseapp.com",
    databaseURL: "https://socialapp-b0f6c.firebaseio.com",
    projectId: "socialapp-b0f6c",
    storageBucket: "socialapp-b0f6c.appspot.com",
    messagingSenderId: "682693961109",
    appId: "1:682693961109:web:ccec7f630d1eb4c6"
})
admin.initializeApp();

const db = admin.firestore();
// get all tweets 
app.get('/tweets', (req, res) => {
    db.collection("tweets").orderBy('createdAt', 'desc')
        .get()
        .then(data => {
            let tweets = [];
            data.forEach(doc => {
                tweets.push({
                    body: doc.data().body,
                    userHandle: doc.data().userHandle,
                    createdAt: doc.data().createdAt
                });
            });
            return res.json(tweets);
        })
        .catch(err => console.error(err));
})

// post a tweet
app.post('/tweet', (req, res) => {
    const newTweet = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    }

    db.collection('tweets').add(newTweet).then((data) => {
        return res.status(201).json({
            message: `new tweet ${data.id} has been created`
        })
    }).catch(err => {
        return res.status(500).json({
            error: `creation failed: ${err}`
        })
    })
})

const isEmpty = (string) => {
    if (string.trim() === '') return true;
    else return false;
}

const isEmail = (email) => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.match(regEx)) return true;
    else return false;
}

//sign up user
app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        handle: req.body.handle
    }
    let errors = {};
    if (isEmpty(newUser.email)) errors.email = 'Must not be empty';
    if (!isEmail(newUser.email)) errors.email = 'Must be a valid email address';
    if (isEmpty(newUser.password)) errors.password = 'Must not be empty';
    if (isEmpty(newUser.handle)) errors.handle = 'Must not be empty';

    if (Object.keys(errors).length > 0) return res.status(403).json(errors);

    let userId, token;
    db.doc(`/users/${newUser.handle}`)
        .get().then(doc => {
            if (doc.exists) {
                return res.status(400).json({
                    message: 'this handle is already taken'
                })
            } else {
                return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password);
            }
        }).then(data => {
            userId = data.user.uid;
            return data.user.getIdToken();
        }).then(IdToken => {
            token = IdToken;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId
            }
            return db.doc(`/users/${newUser.handle}`).set(userCredentials);

        }).then(() => {
            return res.status(201).json({
                token
            });
        })
        .catch(err => {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                return res.status(400).json({
                    email: 'Email is already is use'
                });
            } else {
                return res
                    .status(500)
                    .json({
                        general: 'Something went wrong, please try again'
                    });
            }
        })
})



// login 
app.post('/login', (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    }

    let errors = {};
    if (isEmpty(user.email)) errors.email = 'Must not be empty';
    if (!isEmail(user.email)) errors.email = 'Must be a valid email address';
    if (isEmpty(user.password)) errors.password = 'Must not be empty';
    if (Object.keys(errors).length > 0) return res.status(403).json(errors);
    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then((data) => {
            return data.user.getIdToken();
        }).then(token => {
            return res.json({
                token
            });
        })
        .catch(err => {
            return res.status(403).json({
                general: 'Wrong credentials, please try again'
            })
        })
})

exports.api = functions.region('europe-west1').https.onRequest(app);