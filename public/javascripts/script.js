// validation for email in any pages in front-end
function getEmail() {
    let mailId = document.getElementById("emailid").value
    let mailFormat = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/

    let mailCheck = mailId.match(mailFormat)

    if (mailCheck === null || mailId === "") {
        document.getElementById("e_error").innerHTML = "Please enter a valid email"
        document.getElementById("e_error").style.visibility = "visible"
        return false
    } else {
        document.getElementById("e_error").style.visibility = "hidden"
        return true
    }
}

// validation for mobile number in any page in front-end
function getMobile() {
    let mobile = document.getElementById("mobile").value
    let mobileFormat = /^(\d{10})$/

    let mobileCheck = mobile.match(mobileFormat)
    if (mobileCheck === null || mobile === "") {
        document.getElementById("m_error").innerHTML = "Please enter valid mobile number"
        document.getElementById("m_error").style.visibility = "visible"
        return false
    } else {
        document.getElementById("m_error").style.visibility = "hidden"
        return true
    }
}

// validation for username in any page in front-end
function getUsername() {
    let userName = document.getElementById("username").value
    let userNameFormat = /([a-z])/
    let userNameCheck = userName.match(userNameFormat)

    if (userNameCheck === null || userName.length <= 2) {
        document.getElementById("u_error").innerHTML = "Please enter atleast 3 characters"
        document.getElementById("u_error").style.visibility = "visible"
        return false
    } else {
        document.getElementById("u_error").style.visibility = "hidden"
        return true
    }
}

// validation for password in any page in front-end
function getPassword() {
    let password = document.getElementById("password").value
    let passwordFormat = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/
    let passwordCheck = password.match(passwordFormat)

    if (passwordCheck === null) {
        document.getElementById('p_error').innerHTML = 'Password must contain any of !@#$%^&* and 0-9'
        document.getElementById("p_error").style.visibility = "visible"
        return false
    } else {
        document.getElementById("p_error").style.visibility = "hidden"
        return true
    }
}

// validation for OTP in any page in front-end
function getOtp() {
    let otp = document.getElementById("otp").value

    if (otp === "") {
        document.getElementById("o_error").style.visibility = "visible"
        return false
    } else {
        document.getElementById("o_error").style.visibility = "hidden"
        return true
    }
}





/*==========================User Signup Validation============================*/

function signupValidation() {
    getEmail()
    getUsername()
    getPassword()
    getMobile()
    if (!getEmail() || !getUsername() || !getPassword() || !getMobile()) {
        return false
    } else {
        signup_form.onsubmit = (e) => {
            e.preventDefault()
            let emailid = document.getElementById('emailid').value
            let mobile = document.getElementById('mobile').value
            let username = document.getElementById('username').value
            let password = document.getElementById('password').value

            let logObj = {
                emailid,
                mobile,
                username,
                password
            }

            fetch("/signup", {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify(logObj)
            }).then((res) => {
                return res.json()
            }).then((data) => {
                if (data.userexist) {
                    document.getElementById('e_error').innerHTML = 'sorry this users is already exist'
                    document.getElementById("e_error").style.visibility = "visible"
                } else {
                    location.reload()
                }
            })
        }
    }

}



/*==========================User Login Validation============================*/

function loginValidation() {
    getEmail()
    getPassword()
    if (!getEmail() || !getPassword()) {
        return false
    } else {
        loginform.onsubmit = (e) => {
            e.preventDefault()
            let emailid = document.getElementById('emailid').value
            let password = document.getElementById('password').value

            let logObj = {
                emailid,
                password
            }
            fetch("/login", {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify(logObj)
            }).then((res) => {
                return res.json()
            }).then((data) => {
                if (data.password) {
                    if (data.status) {
                        location.reload()
                    } else {
                        document.getElementById('e_error').innerHTML = 'You are blocked'
                        document.getElementById("e_error").style.visibility = "visible"
                    }
                } else {
                    if(data.error){
                        document.getElementById('e_error').innerHTML = data.error
                    }else{
                        document.getElementById('e_error').innerHTML = 'password or email is incorrect'
                    }
                    document.getElementById("e_error").style.visibility = "visible"
                }
            })
        }
    }
}


/*==========================Admin Signup Validation============================*/

function adminSignupValidation() {
    getEmail()
    getUsername()
    getPassword()
    if (!getEmail() || !getPassword() || !getUsername()) {
        return false
    } else {
        signup_form.onsubmit = (e) => {
            e.preventDefault()
            let emailid = document.getElementById('emailid').value
            let username = document.getElementById('username').value
            let password = document.getElementById('password').value

            let logObj = {
                emailid,
                username,
                password
            }
            fetch("/admin/signup", {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify(logObj)
            }).then((res) => {
                return res.json()
            }).then((data) => {
                if (data.adminexist) {
                    location.reload()
                } else {
                    document.getElementById('message').innerHTML = 'This email already exist'
                }
            })
        }
    }
}



/*==========================Admin Login Validation============================*/

function adminLoginValidation() {
    getEmail()
    getPassword()
    if (!getEmail() || !getPassword()) {
        return false
    } else {
        login_form.onsubmit = (e) => {
            e.preventDefault()
            let emailid = document.getElementById('emailid').value
            let password = document.getElementById('password').value

            let logObj = {
                emailid,
                password
            }
            fetch("/admin/login", {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify(logObj)
            }).then((res) => {
                return res.json()
            }).then((data) => {
                if (data.password) {
                    location.reload()
                } else {
                    document.getElementById('message').innerHTML = 'This email already exist'
                }
            })
        }
    }
}



/*================Editing Validation of User from Admin Panel==================*/

function userEditValidation(currentEmail) {
    getEmail()
    getUserName()
    if (!getEmail() || !getUserName()) {
        return false
    } else {
        editform.onsubmit = (e) => {
            e.preventDefault()
            let emailid = document.getElementById('emailid').value
            let username = document.getElementById('username').value
            let editObj = {
                emailid,
                username,
                currentEmail
            }
            fetch("/admin/edit-user", {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify(editObj)
            }).then((res) => {
                return res.json()
            }).then((data) => {
                if (data.userexist) {
                    document.getElementById('message').innerHTML = 'This email already exist'
                } else {
                    document.getElementById('message').innerHTML = 'successfully edited'
                }
            })
        }
    }
}



/*================ Validation of User from Admin Panel==================*/

function mobileValidation() {
    getMobile()
    if (!getMobile()) {
        return false;
    } else {
        mobileform.onsubmit = (e) => {
            e.preventDefault()
            let mobile = document.getElementById('mobile').value
            let Obj = {
                mobile,
            }
            fetch("/otp-login", {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify(Obj)
            }).then((res) => {
                return res.json()
            }).then((data) => {
                if (data.userexist) {
                    document.getElementById('m_error').innerHTML = 'OTP send successfully'
                    document.getElementById('m_error').style.color = 'green'
                    document.getElementById("m_error").style.visibility = "visible"
                } else {
                    document.getElementById('m_error').innerHTML = 'No user exist'
                    document.getElementById('m_error').style.color = 'red'
                    document.getElementById("m_error").style.visibility = "visible"
                }
            })
        }
    }

}



/*================Editing Validation of User from Admin Panel==================*/

function otpValidation() {
    getMobile()
    getOtp()
    if (!getMobile() || !getOtp()) {
        return false;
    } else {
        otpform.onsubmit = (e) => {
            e.preventDefault()
            let mobile = document.getElementById('mobile').value
            let otp = document.getElementById('otp').value
            let Obj = {
                mobile,
                otp
            }
            fetch("/otp-verify", {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify(Obj)
            }).then((res) => {
                return res.json()
            }).then((data) => {
                if (data.userexist) {
                    document.getElementById('o_error').innerHTML = 'OTP Successful'
                    document.getElementById('o_error').style.color = 'green'
                    document.getElementById("o_error").style.visibility = "visible"
                    location.href = "/";
                } else {
                    document.getElementById('o_error').innerHTML = 'Incorrect OTP'
                    document.getElementById("o_error").style.visibility = "visible"
                }
            })
        }
    }
}


function changeQuantity(cartId, productId, userId, count, price) {
    let quantity = parseInt(document.getElementById(productId).innerHTML)

    count = parseInt(count)
    let obj = {
        cartId,
        productId,
        userId,
        count,
        quantity
    }
    fetch('/change-quantity', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(obj)
    }).then((res) => {
        return res.json()
    }).then((data) => {
        console.log(data);
        if (data.response == 'product removed') {
            location.reload()
        } else {
            document.getElementById(productId).innerHTML = quantity + count
            document.getElementById('total-' + productId).innerHTML = (quantity + count) * price
            document.getElementById('total').innerHTML = data.total
        }
    })

}


function addToCart(productId) {
    fetch('/add-to-cart', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({ productId })
    }).then((res) => {
        return res.json()
    }).then((data) => {
        location.reload()
    })

}
function addToWishlist(productId) {

    fetch('/add-to-wishlist', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({ productId })
    }).then((res) => {
        return res.json({})
    }).then((data) => {
        location.reload()
    })

}
// function saveAddress() {
//     onsubmit = (e) => {
//         e.preventDefault()
//         const formData = new FormData(document.getElementById('address_form'))
//         console.log(formData);
//     }
// }