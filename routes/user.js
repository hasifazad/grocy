const express = require("express")
const router = express.Router()
const ObjectId = require("mongodb").ObjectId

const userHelpers = require("../helpers/userhelpers.js")

const accountSid = process.env.ACCOUNT_SID
const authToken = process.env.AUTH_TOKEN
const serviceSid = process.env.SERVICE_SID
const client = require('twilio')(accountSid, authToken);





let userName
let userId

const verifyLogin = (req, res, next) => {
    if (req.session.userLoggedIn && req.session.userStatus) {
        userName = req.session.userIn
        userId = req.session.userId
        return next()
    } else {
        userName = null
        userId = null
        req.session.userLoggedIn = null
        return next()
    }
}

const verifyUserLogin = (req, res, next) => {
    if (req.session.userLoggedIn && req.session.userStatus) {
        return next()
    } else {
        res.render('user/login')
    }

}


// =====================================================================================//====================================================//
// ======================               GET REQUESTS              ======================//====================================================//
// =====================================================================================//====================================================//

router.get('/', verifyLogin, async (req, res) => {
    
    let products = await userHelpers.getAllProducts()
    let categories = await userHelpers.getAllCategories()

    if (req.session.userLoggedIn && req.session.userStatus) {
        let [wishlist] = await userHelpers.getUserWishlist(userId)
        let [cart] = await userHelpers.getUserCart(userId)

        try {
            for (i = 0; i < products.length; i++) {
                products[i].cart_id = cart._id
                for (j = 0; j < wishlist.products.length; j++) {
                    let a = '' + products[i]._id
                    let b = '' + wishlist.products[j]
                    if (a == b) {
                        products[i].wishlist = true
                        break;
                    } else {
                        products[i].wishlist = false
                    }
                }
                for (k = 0; k < cart.products.length; k++) {
                    let a = '' + products[i]._id
                    let b = '' + cart.products[k].product_id
                    if (a == b) {
                        products[i].cart = true
                        products[i].quantity = cart.products[k].quantity
                        break;
                    } else {
                        products[i].cart = false
                        products[i].quantity = 0
                    }
                }
            }

        } catch (error) {

        }
    }
    
    res.render("user/home", { products, userName, userId, categories })
})

router.get('/login', (req, res,) => {
    if (req.session.userLoggedIn) {
        res.redirect('/')
    } else {
        res.render('user/login')
    }
})

router.get('/signup', (req, res) => {
    if (req.session.userLoggedIn) {
        res.redirect('/')
    } else {
        res.render('user/signup')
    }
})

router.get('/logout', (req, res) => {
    req.session.userId = null
    req.session.userIn = null
    req.session.userLoggedIn = null
    req.session.userStatus = null

    res.redirect('/')
})

router.get('/otp-login', verifyLogin, (req, res) => {
    res.render('user/otplogin')
})

// =====================================================================================//====================================================//
// ======================               POST REQUESTS              =====================//====================================================//
// =====================================================================================//====================================================//

router.post('/signup', async (req, res) => {
    let userData = req.body

    userData.status = true
    userData.created_on = new Date()
    let response = await userHelpers.doSignup(userData)

    if (response.acknowledged === true) {
        req.session.userId = response.insertedId
        req.session.userIn = userData.username
        req.session.userLoggedIn = true
        req.session.userStatus = true

        userName = req.session.userIn
        userId = req.session.userId
        await userHelpers.createWallet(userId)
        res.json({ userexist: false })
    } else {
        res.json({ userexist: true })
    }
})

router.post('/login', async (req, res) => {
    let userData = req.body

    let user = await userHelpers.doLogin(userData)

    if (user) {
        if (user.status) {
            req.session.userId = user._id
            req.session.userIn = user.username
            req.session.userLoggedIn = true
            req.session.userStatus = user.status

            userName = user.username
            userId = user._id
            res.json({ password: true, status: user.status })
        } else {
            res.json({ password: true, status: user.status })
        }
    } else {
        res.json({ password: false })
    }
})

router.post('/otp-login', async (req, res) => {
    let { mobile } = req.body
    let user = await userHelpers.doOtpLogin(mobile)

    if (user) {
        client.verify.v2.services(serviceSid)
            .verifications
            .create({ to: '+91' + mobile, channel: 'sms' })
            .then((verification) => {
                res.json({ userexist: true })
            });
    } else {
        res.json({ userexist: false })

    }
})

router.post('/otp-verify', async (req, res) => {
    let { mobile, otp } = req.body
    let user = await userHelpers.doOtpLogin(mobile)

    if (user) {
        client.verify.v2.services(serviceSid)
            .verificationChecks
            .create({ to: '+91' + mobile, code: otp })
            .then((verify) => {
                if (verify.status === 'approved') {
                    req.session.userId = user._id
                    req.session.userIn = user.username
                    req.session.userLoggedIn = true
                    req.session.userStatus = user.status

                    userName = user.username
                    userId = user._id
                    res.json({ userexist: true })
                } else {
                    res.json({ userexist: false })
                }
            });
    } else {
        res.json({ userexist: false })

    }

})


//===============================================================================//
//==============================    CART & WISHLIST    ==========================//
//===============================================================================//

router.get('/wishlist', verifyUserLogin,verifyLogin, async (req, res) => {
    let products = await userHelpers.getWishlistProducts(userId)

    for (i = 0; i < products.length; i++) {
        products[i].sl_no = i + 1
    }

    res.render('user/wishlist', { userName, products })
})

router.get('/cart', verifyUserLogin,verifyLogin, async (req, res) => {
    let products = await userHelpers.getCartProducts(userId)
    let [total] = await userHelpers.getTotalAmount(userId)
    for (i = 0; i < products.length; i++) {
        products[i].sl_no = i + 1
    }

    res.render('user/cart', { products, userName, userId, total })
})

router.get('/remove-cart-product/:id',verifyLogin, async (req, res) => {
    let productId = req.params.id
    await userHelpers.removeCartProduct(productId, userId)
    res.redirect('/cart')
})

router.post('/add-to-cart', verifyUserLogin,verifyLogin, async (req, res) => {
    let { productId } = req.body

    await userHelpers.addToCart(userId, productId)
    res.json({})

})

router.post('/add-to-wishlist',verifyUserLogin,verifyLogin, async (req, res) => {
    let { productId } = req.body

    await userHelpers.addToWishlist(userId, productId)
    res.json({})
})

router.post('/change-quantity', verifyLogin, async (req, res) => {
    let quantityChangeData = req.body

    let response = await userHelpers.changeQuantity(quantityChangeData)
    let total = await userHelpers.getTotalAmount(userId)
    try {
        total = total[0].total
    } catch (error) {

    }
    res.json({ response, total })
})



//===============================================================================//
//===============================    CARD DETAILS    ============================//
//===============================================================================//

router.get('/card-details/:id',verifyLogin, async (req, res) => {
    let productId = req.params.id
    let product = await userHelpers.getProduct(productId)

    if (req.session.userLoggedIn && req.session.userStatus) {
        let wishlist = await userHelpers.getUserWishlistOfThisProduct(userId, productId)
        let cart = await userHelpers.getUserCartOfThisProduct(userId, productId)
        
        try {
            product.cart_id = cart._id
            if (wishlist) {
                product.wishlist = true
            }
            if (cart) {
                product.quantity = cart.products[0].quantity
                product.cart = true
            }
        } catch (error) {

        }
    }
    
    res.render('user/card-details', { product, userName })
})



//===============================================================================//
//================================    USER PROILE    ============================//
//===============================================================================//

router.get('/user-profile/:p',verifyLogin, async (req, res) => {
    if (req.params.p == 'personal') {
        let userData = await userHelpers.getProfileDetails(userId)
        res.render('user/profile-personal', { userName, userData })
    } else if (req.params.p == 'address') {
        let userAddressData = await userHelpers.getAllAddress(userId)

        res.render('user/profile-address', { userName, userAddressData })
    } else if (req.params.p == 'wallet') {
        let [walletAmount] = await userHelpers.getWallet(userId)
        
        res.render('user/profile-wallet', { userName, amount: walletAmount.amount })
    }
})

router.post('/save-address', verifyLogin, async (req, res) => {
    if (req.body.address_no == '') {
        let abc = new Date()
        req.body.address_no = '' + abc.getTime()
        await userHelpers.saveAddress(req.body, userId)
    } else {
        await userHelpers.updateAddress(req.body, userId)
    }

    res.redirect('/user-profile/address')
})

router.get('/remove-address/:addressNo',verifyLogin, async (req, res) => {
    await userHelpers.removeAddress(req.params.addressNo, userId)
    res.redirect('/user-profile/address')
})



//===============================================================================//
//==================================    ORDERS    ===============================//
//===============================================================================//

router.get('/place-order', verifyUserLogin,verifyLogin, async (req, res) => {
    let { userAddress, userDetails } = await userHelpers.placeOrder(userId)
    let total = await userHelpers.getTotalAmount(userId)
    
    total = total[0].total
    res.render('user/checkout', { userName, userAddress, userDetails, total })
})

router.get('/user-orders',verifyLogin, async (req, res) => {
    let orders = await userHelpers.getOrders(userId)

    for (i = 0; i < orders.length; i++) {
        let date = new Date(orders[i].ordered_on)
        orders[i].sl_no = i + 1;
        orders[i].ordered_on = date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear();
    }
    res.render('user/orders', { userName, orders })
})

router.get('/remove-order/:id/:amount',verifyLogin, async (req, res) => {
    let orderId = req.params.id
    let refundAmount = req.params.amount
    
    let a = await userHelpers.removeOrder(userId,orderId,refundAmount)
    res.redirect('/user-orders')
})


router.get('/view-details',verifyLogin, async (req, res) => {
    await userHelpers.viewDetails()
})

router.get('/view-order-product/:id', verifyUserLogin,verifyLogin, async (req, res) => {
    let orderId = req.params.id
    let { orderedProducts, orderData } = await userHelpers.viewOrderProduct(orderId)
    try {
        let date = orderData.ordered_on
        orderData.ordered_on = date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear();
        for (i = 0; i < orderedProducts.length; i++) {
            orderedProducts[i].sl_no = i + 1
            orderedProducts[i].total = orderedProducts[i].quantity * orderedProducts[i].products.offer_price
        }
    } catch (error) {

    }
    if(orderData.original_amount == orderData.offer_amount){
        orderData.coupon_applied=false
    }else{
        orderData.coupon_applied=true
    }
    res.render('user/view-order-product', { orderedProducts, orderData, userName })
})








router.get('/category-wise/:category',verifyLogin, async (req, res) => {
    let products = await userHelpers.getCategoryProducts(req.params.category)
    if (req.session.userLoggedIn && req.session.userStatus) {
        let [wishlist] = await userHelpers.getUserWishlist(userId)
        let [cart] = await userHelpers.getUserCart(userId)
        try {
            for (i = 0; i < products.length; i++) {
                products[i].cart_id = cart._id
                for (j = 0; j < wishlist.products.length; j++) {
                    let a = '' + products[i]._id
                    let b = '' + wishlist.products[j]
                    if (a == b) {
                        products[i].wishlist = true
                        break;
                    } else {
                        products[i].wishlist = false
                    }
                }
                for (k = 0; k < cart.products.length; k++) {
                    let a = '' + products[i]._id
                    let b = '' + cart.products[k].product_id
                    if (a == b) {
                        products[i].cart = true
                        products[i].quantity = cart.products[k].quantity
                        break;
                    } else {
                        products[i].cart = false
                        products[i].quantity = 0
                    }
                }
            }
        } catch (error) {

        }
    }
    res.render('user/category-wise', { products, userName, userId })
})







router.post('/coupon-check',verifyLogin, async (req, res) => {
    let code = req.body.code
    let total = parseInt(req.body.total)
    
    let result = await userHelpers.couponCheck(userId,code,total)
   
    res.json({ result })
})







// -----------------------------------------------------------------//
//                       CHECKOUT & PAYMENT                         //
// -----------------------------------------------------------------//
router.post('/checkout', verifyLogin, async (req, res) => {
    let orderDetails = req.body
   
    let orderPlaced = await userHelpers.setOrders(userId, orderDetails)

    if (orderDetails.payment == 'COD') {
        await userHelpers.confirmOrder(userId, orderPlaced.insertedId)
        res.json({ paymentType: 'COD' })
    } else if (orderDetails.payment == 'razorpay') {
        let response = await userHelpers.generateRazorpay(orderPlaced.insertedId, orderDetails)
        req.body.username = userName
        let user = req.body
        res.json({ response, user, paymentType: 'razorpay' })
    } else if (orderDetails.payment == 'paypal') {
        let a = await userHelpers.generatePaypal(orderPlaced.insertedId)
        res.json({ link: a, paymentType: 'paypal', })
    }
})


// -----------------------------------------------------------------//
//                               PAYPAL                             //
// -----------------------------------------------------------------//
router.get('/paypal-success/:orderId',verifyLogin, async (req, res) => {
    let orderId = req.params.orderId
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    userHelpers.verifyPaypal(payerId, paymentId, orderId, userId).then(() => {
        res.render('user/successful', { userName })
    })
})
router.get('/paypal-cancel',verifyLogin, (req, res) => {
})


// -----------------------------------------------------------------//
//                             RAZORPAY                             //
// -----------------------------------------------------------------//
router.post('/razorpay-success',verifyLogin, async (req, res) => {
    let { payment, order } = req.body

    await userHelpers.verifyRazorpay(payment, order, userId)
    res.json({ status: true })
})


// -----------------------------------------------------------------//
//                          PAYMENT SUCCESS                         //
// -----------------------------------------------------------------//
router.get('/order-success',verifyLogin, (req, res) => {
    res.render('user/successful', { userName })
})



router.post('/getaddress', verifyUserLogin,verifyLogin, async (req, res) => {
    let address = await userHelpers.getAddress(req.body.address_no, userId)
    res.json({ address })
})









module.exports = router