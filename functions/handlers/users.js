const {
    db,
    admin
} = require('../util/admin');

const firebase = require('firebase');
const config = require('../util/config');
firebase.initializeApp(config);
const {
    validateSignupData,
    validateLoginData,
    reduceUserDetails
} = require('../util/validations');

exports.signUp = (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    }

    const {
        errors,
        valid
    } = validateSignupData(newUser);

    if (!valid) {
        return res.status(400).json(errors);
    }

    const noImage = 'no_avatar.jpg';
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
                imageUrl: `https://firebasestorage.googleapis.com/v0/b/socialapp-b0f6c.appspot.com/o/${noImage}?alt=media`,
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
}

exports.login = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    }
    const {
        errors,
        valid
    } = validateLoginData(user);
    if (!valid) {
        return res.status(400).json(errors);
    }

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
}

exports.imageUpload = (req, res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({
        headers: req.headers
    });

    let imageFileName;
    let imageToBeUpload = {};

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {

        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return res.status(400).json({
                error: 'Wrong file type submitted'
            });
        }

        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        imageFileName = `${Math.round(Math.random() * 100000000000)}.${imageExtension}`;
        const filePath = path.join(os.tmpdir(), imageFileName);
        imageToBeUpload = {
            filePath,
            mimetype
        };
        file.pipe(fs.createWriteStream(filePath));
    });

    busboy.on('finish', () => {

        admin.storage().bucket().upload(imageToBeUpload.filePath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imageToBeUpload.mimetype
                }
            }
        }).then(() => {
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${
            config.storageBucket
                }/o/${imageFileName}?alt=media`;

            return db.doc(`/users/${req.user.handle}`).update({
                imageUrl
            });
        }).then(() => {
            return res.json({
                message: 'image uploaded successfully'
            });
        }).catch((err) => {
            return res.status(500).json({
                error: 'somethig went wrong'
            })
        })
    })
    busboy.end(req.rawBody);
}

exports.updateUserDetails = (req, res) => {
    let userDetails = reduceUserDetails(req.body);
    db.doc(`/users/${req.user.handle}`).update(userDetails).then(() => {
        return res.status(200).json({
            message: 'Details added successfully'
        })
    }).catch((err) => {
        console.error(err);
        return res.status(500).json({
            error: err.code
        })
    })
}

exports.getAuthenticatedUser = (req, res) => {
    let userData = {};
    db.doc(`/users/${req.user.handle}`).get().then(doc => {
        if (doc.exists) {
            userData.credentials = doc.data();
            return db.collection('likes').where('userHandle', '==', req.user.handle).get();
        }
    }).then(data => {
        userData.likes = [];
        data.forEach(doc => {
            userData.likes.push(doc.data())
        })
        return res.json(userData);
    }).catch(err => {
        console.error(err)
        return res.status(500).json({
            message: err.code
        });
    })
}