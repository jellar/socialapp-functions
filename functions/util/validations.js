const isEmpty = (string) => {
    if (string.trim() === '') return true;
    else return false;
}

const isEmail = (email) => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.match(regEx)) return true;
    else return false;
}

exports.validateSignupData = (data) => {
    let errors = {};
    if (isEmpty(data.email)) errors.email = 'Must not be empty';
    if (!isEmail(data.email)) errors.email = 'Must be a valid email address';
    if (isEmpty(data.password)) errors.password = 'Must not be empty';
    if (data.password !== data.confirmPassword) errors.confirmPassword = "Passwords must be match";
    if (isEmpty(data.handle)) errors.handle = 'Must not be empty';


    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}

exports.validateLoginData = (data) => {
    let errors = {};
    if (isEmpty(data.email)) errors.email = 'Must not be empty';
    if (!isEmail(data.email)) errors.email = 'Must be a valid email address';
    if (isEmpty(data.password)) errors.password = 'Must not be empty';
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}

exports.reduceUserDetails = (data) => {
    let userData = {}
    if (!isEmpty(data.bio.trim())) userData.bio = data.bio.trim();
    if (!isEmpty(data.website.trim())) {
        if (data.website.substring(0, 4) !== 'http') {
            userData.website = `http://${data.website.trim()}`
        } else userData.website = data.website.trim()
    }
    if (!isEmpty(data.location.trim())) userData.location = data.location.trim();
    return userData;
}