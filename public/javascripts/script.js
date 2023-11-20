const validateInput = (inputFieldId) => {
    let inputFieldValue = document.getElementById(inputFieldId).value
    let regx
    switch (inputFieldId) {
        case 'emailid':
            regx = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
            break;
        case 'mobile':
            regx = /^(\d{10})$/;
            break;
        case 'username':
            regx = /([a-z])/;
            break;
        case 'password':
            regx = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
            break;
        default:
            break;
    }

    if (inputFieldValue.match(regx) == null || inputFieldValue == "") {
        document.getElementById(`${inputFieldId}_error`).innerHTML = `enter valid ${inputFieldId}`
        document.getElementById(`${inputFieldId}_error`).style.visibility = "visible"
        return false
    } else {
        document.getElementById(`${inputFieldId}_error`).style.visibility = "hidden"
        return true
    }
}

// validation for OTP in any page in front-end
const getOtp = () => {
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

const signupValidation = () => {
    let response = ['emailid', 'mobile', 'username', 'password'].map((name) => validateInput(name))

    if (response.some(a => !a)) return false
    else {
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
                    document.getElementById('emailid_error').innerHTML = 'sorry this users is already exist'
                    document.getElementById("emailid_error").style.visibility = "visible"
                } else {
                    location.reload()
                }
            })
        }
    }

}



/*==========================User Login Validation============================*/

const loginValidation = () => {
    let response = ['emailid', 'password'].map((name) => validateInput(name))

    if (response.some(a => !a)) {
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
                    if (data.error) {
                        document.getElementById('e_error').innerHTML = data.error
                    } else {
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
    let response = ['emailid', 'password'].map((name) => validateInput(name))

    if (response.some(a => !a)) {
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

            console.log(logObj);
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
                    document.getElementById('emailid_error').innerHTML = 'This email already exist'
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
    validateInput("mobile")
    if (!validateInput("mobile")) {
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
    validateInput('mobile')
    getOtp()
    if (!validateInput('mobile') || !getOtp()) {
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