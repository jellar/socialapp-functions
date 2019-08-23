const {
    db
} = require('../util/admin');

exports.getAllTweets = (req, res) => {
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
}

exports.postTweet = (req, res) => {
    const newTweet = {
        body: req.body.body,
        userHandle: req.user.handle,
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
}

exports.getTweet = (req, res) => {
    let tweetData = {};
    db.doc(`/tweets/${req.params.tweetId}`).get().then(doc => {
        if (doc.exists) {
            tweetData = doc.data();
            tweetData.tweetId = req.params.tweetId;
            return db.collection('/comments').where('tweetId', '==', req.params.tweetId).orderBy('createdAt', 'desc').get();
        } else {
            return res.status(404).json({
                error: 'not found'
            });
        }
    }).then(data => {
        tweetData.comments = [];
        data.forEach(doc => {
            tweetData.comments.push(doc.data())
        })
        res.json(tweetData);
    }).catch(err => {
        console.log(err);
        return res.status(500).json('something went wrong please try again')
    })
}

exports.postComment = (req, res) => {
    const newComment = {
        tweetId: req.params.tweetId,
        userHandle: req.user.handle,
        body: req.body.body,
        createdAt: new Date().toISOString(),
        imageUrl: req.user.imageUrl
    }

    if (req.body.body.trim() === '') return req.status(403).json({
        error: 'Must not be empty'
    });

    db.doc(`/tweets/${req.params.tweetId}`).get().then(doc => {
        if (!doc.exists) {
            return res.status(404).json({
                error: 'not found'
            })
        }
        return db.collection('comments').add(newComment);
    }).then(() => {
        res.json(newComment);
    }).catch(err => {
        console.error(err);
        return res.status(500).json({
            error: 'something went wrong please try again!'
        });
    })
}