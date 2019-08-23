const functions = require("firebase-functions");
const firebase = require('firebase');
const app = require('express')();

const fbAuth = require('./util/fbAuth');

const {
    getAllTweets,
    postTweet,
    getTweet,
    postComment
} = require('./handlers/tweets');

const {
    signUp,
    login,
    imageUpload,
    updateUserDetails,
    getAuthenticatedUser
} = require('./handlers/users');

// tweets
app.get('/tweets', fbAuth, getAllTweets)
app.post('/tweet', fbAuth, postTweet)
app.get('/tweet/:tweetId', getTweet)
app.post('/tweet/:tweetId/comment', fbAuth, postComment)

// users
app.post('/signup', signUp)
app.post('/login', login)
app.post('/user/image', fbAuth, imageUpload)
app.post('/user', fbAuth, updateUserDetails)
app.get('/user', fbAuth, getAuthenticatedUser)

exports.api = functions.region('europe-west1').https.onRequest(app);