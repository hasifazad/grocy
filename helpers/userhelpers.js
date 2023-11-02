const db = require("../config/connection.js")
const bcrypt = require("bcrypt")
const ObjectId = require("mongodb").ObjectId
const razorpay = require('razorpay')
const paypal = require('paypal-rest-sdk')
const crypto = require('crypto')
const { resolve } = require("path")

const options = {
    'mode': 'sandbox',
    'client_id': process.env.PAYPAL_CLIENT_ID,
    'client_secret': process.env.PAYPAL_CLIENT_SECRET
}
paypal.configure(options);


const rzp = {
    key_id: process.env.RZP_ID,
    key_secret: process.env.RZP_SECRET
}
let instance = new razorpay(rzp)




module.exports = {

    doSignup: async (userData) => {
        let response = await db.get().collection('users').findOne({ $or: [{ emailid: userData.emailid }, { mobile: userData.mobile }] })


        if (response === null) {
            userData.password = await bcrypt.hash(userData.password, 10)
            return await db.get().collection('users').insertOne(userData)
        } else {
            return 'user exist'
        }
    },


    doLogin: async (userData) => {
        let userExist = await db.get().collection('users').findOne({ emailid: userData.emailid })

        if (userExist) {
            let passwordTrue = await bcrypt.compare(userData.password, userExist.password)
            if (passwordTrue === true) {
                return userExist
            } else {
                return false
            }
        } else {
            return false
        }
    },


    doOtpLogin: async (mobile) => {
        let user = await db.get().collection('users').findOne({ mobile: mobile })

        if (user) {
            return user
        } else {
            return false
        }
    },


    getAllProducts: async () => {
        try {

            return await db.get().collection('products').find().toArray()
        } catch (error) {

        }

    },


    getAllCategories: async () => {
        return await db.get().collection('categories').find({}, { projection: { category_name: true, image: true } }).toArray()
    },


    getProduct: async (productId) => {
        return await db.get().collection('products').findOne({ _id: ObjectId(productId) })
    },


    addToCart: async (userId, productId) => {

        let obj = {
            product_id: ObjectId(productId),
            quantity: 1
        }
        let userCartExist = await db.get().collection('carts').findOne({ user_id: ObjectId(userId) })

        if (userCartExist) {
            let productExist = await userCartExist.products.findIndex((product) => { return product.product_id == productId })

            if (productExist != -1) {
                await db.get().collection('carts').updateOne(
                    { user_id: ObjectId(userId), 'products.product_id': ObjectId(productId) },
                    {
                        $inc:
                            { 'products.$.quantity': 1 }
                    })
            } else {
                await db.get().collection('carts').updateOne({ user_id: ObjectId(userId) },
                    {
                        $push: { products: obj }
                    })
            }
        } else {
            let cart = {
                user_id: ObjectId(userId),
                products: [obj]
            }
            await db.get().collection('carts').insertOne(cart)
        }

    },


    addToWishlist: async (userId, productId) => {
        let obj = {
            user_id: ObjectId(userId),
            products: [ObjectId(productId)]
        }

        let wishListExist = await db.get().collection('wishlists').findOne({ user_id: ObjectId(userId) })
        if (wishListExist) {
            let productExist = await wishListExist.products.findIndex((product) => { return product == productId })
            if (productExist == -1) {
                await db.get().collection('wishlists').updateOne({ user_id: ObjectId(userId) }, {
                    $push: { products: ObjectId(productId) }
                })

            } else {
                await db.get().collection('wishlists').updateOne({ user_id: ObjectId(userId) }, {
                    $pull: { products: ObjectId(productId) }
                })
            }
        } else {
            await db.get().collection('wishlists').insertOne(obj)
        }
    },


    getCartProducts: async (userId) => {
        return await db.get().collection('carts').aggregate([
            {
                $match: { user_id: ObjectId(userId) }
            },
            {
                $unwind: '$products'
            },
            {
                $project: {
                    product_id: '$products.product_id',
                    quantity: '$products.quantity'
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'product_id',
                    foreignField: '_id',
                    as: 'products'
                }
            },
            {
                $project: {
                    product_id: 1,
                    quantity: 1,
                    products: { $arrayElemAt: ['$products', 0] }
                }
            },
            {
                $project: {
                    product_id: 1,
                    quantity: 1,
                    products: 1,
                    total: { $multiply: ['$quantity', '$products.offer_price'] }
                }
            }
        ]).toArray()
    },


    getTotalAmount: async (userId) => {
        return await db.get().collection('carts').aggregate([
            {
                $match: { user_id: ObjectId(userId) }
            },
            {
                $unwind: '$products'
            },
            {
                $project: {
                    product_id: '$products.product_id',
                    quantity: '$products.quantity'
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'product_id',
                    foreignField: '_id',
                    as: 'products'
                }
            },
            {
                $project: {
                    product_id: 1,
                    quantity: 1,
                    products: { $arrayElemAt: ['$products', 0] }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: { $multiply: ['$quantity', '$products.offer_price'] } }
                }
            }
        ]).toArray()
    },


    getCategoryProducts: async (category) => {
        if (category === 'All') {
            return await db.get().collection('products').find().toArray()
        } else {
            return await db.get().collection('products').find({ category: category }).toArray()
        }
    },


    changeQuantity: async (cartData) => {
        if (cartData.quantity == 1 && cartData.count == -1) {
            await db.get().collection('carts').updateOne(
                { _id: ObjectId(cartData.cartId) },
                {
                    $pull: {
                        products: { product_id: ObjectId(cartData.productId) }
                    }
                }
            )
            return 'product removed'
        } else {
            await db.get().collection('carts').updateOne(
                { _id: ObjectId(cartData.cartId), 'products.product_id': ObjectId(cartData.productId) },
                {
                    $inc: { 'products.$.quantity': cartData.count }
                }
            )
            return 'product updated'
        }
    },


    removeCartProduct: async (productId, userId) => {

        await db.get().collection('carts').updateOne(
            { user_id: ObjectId(userId) },
            {
                $pull: {
                    products: { product_id: ObjectId(productId) }
                }
            }
        )
    },


    getProfileDetails: async (userId) => {
        return await db.get().collection('users').findOne({ _id: ObjectId(userId) })
    },


    saveAddress: async (address, userId) => {
        let user = await db.get().collection('useraddress').findOne({ user_id: ObjectId(userId) })
        if (user) {
            await db.get().collection('useraddress').updateOne(
                { user_id: ObjectId(userId) },
                {
                    $push: { address: address }
                })
        } else {
            let obj = {
                user_id: ObjectId(userId),
                address: [address]
            }
            return await db.get().collection('useraddress').insertOne(obj)
        }
    },


    updateAddress: async (address, userId) => {
        let no = address.address_no
        await db.get().collection('useraddress').updateOne(
            { user_id: ObjectId(userId), 'address.address_no': no },
            {
                $set: {
                    'address.$.housename': address.housename,
                    'address.$.locality': address.locality,
                    'address.$.landmark': address.landmark,
                    'address.$.city': address.city,
                    'address.$.district': address.district,
                    'address.$.country': address.country,
                    'address.$.state': address.state,
                    'address.$.pincode': address.pincode,
                }
            })
    },


    removeAddress: async (addressNo, userId) => {
        await db.get().collection('useraddress').updateOne(
            { user_id: ObjectId(userId) },
            {
                $pull: {
                    address: { address_no: addressNo }
                }
            })
    },


    placeOrder: async (userId) => {
        let userAddress = await db.get().collection('useraddress').findOne({ user_id: ObjectId(userId) })
        let userDetails = await db.get().collection('users').findOne({ _id: ObjectId(userId) })
        return { userAddress, userDetails }
    },


    setOrders: async (userId, orderDetails) => {
        let cart = await db.get().collection('carts').findOne({ user_id: ObjectId(userId) }, { user_id: false })

        let order = {
            user_id: ObjectId(userId),
            cart_id: cart._id,
            products: cart.products,
            delivery_details: {
                housename: orderDetails.housename,
                locality: orderDetails.locality,
                landmark: orderDetails.landmark,
                city: orderDetails.city,
                district: orderDetails.district,
                pincode: orderDetails.pincode,
                mobile: orderDetails.mobile
            },
            original_amount: parseInt(orderDetails.originalAmount),
            offer_amount: parseInt(orderDetails.offerAmount),
            discount: parseInt(orderDetails.discount),
            payment: orderDetails.payment,
            status: 'pending',
            coupon_applied: orderDetails.couponApplied,
            ordered_on: new Date()
        }

        await db.get().collection('coupons').updateOne({ code: order.coupon_applied }, { $addToSet: { users_used: ObjectId(userId) } })
        return await db.get().collection('orders').insertOne(order)
    },


    confirmOrder: async (userId, orderId) => {
        await db.get().collection('orders').updateOne({ _id: ObjectId(orderId) }, { $set: { status: 'ordered' } }).then(async () => {
            await db.get().collection('carts').deleteOne({ user_id: ObjectId(userId) })
        })
    },


    generatePaypal: async (orderId) => {
        const create_payment_json = {
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": `https://grocy.ga/paypal-success/${orderId}`,
                "cancel_url": "https://grocy.ga/paypal-cancel"
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": "Red Sox Hat",
                        "sku": "001",
                        "price": "1.00",
                        "currency": "USD",
                        "quantity": 1
                    }]
                },
                "amount": {
                    "currency": "USD",
                    "total": "1.00"
                },
                "description": "Hat for the best team ever"
            }]
        };
        return new Promise((res, rej) => {
            paypal.payment.create(create_payment_json, (error, payment) => {
                if (error) {
                    throw error;
                } else {
                    for (let i = 0; i < payment.links.length; i++) {
                        if (payment.links[i].rel === 'approval_url') {
                            res(payment.links[i].href);
                        }
                    }
                }
            })
        })
    },


    verifyPaypal: async (payerId, paymentId, orderId, userId) => {
        const execute_payment_json = {
            "payer_id": payerId,
            "transactions": [{
                "amount": {
                    "currency": "USD",
                    "total": "1.00"
                }
            }]
        };

        return new Promise((resolve, reject) => {
            paypal.payment.execute(paymentId, execute_payment_json, async function (error, payment) {
                if (error) {
                    reject()
                } else {
                    confirmOrder(userId, orderId)
                    resolve()
                }
            });
        })
    },


    getOrders: async (userId) => {
        return await db.get().collection('orders').find({ user_id: ObjectId(userId) }).toArray()
    },


    removeOrder: async (userId, orderId, refundAmount) => {
        refundAmount = parseInt(refundAmount)
        return await db.get().collection('orders').updateOne({ _id: ObjectId(orderId) }, {
            $set: { status: 'cancelled' }
        }).then(async (res) => {
            await db.get().collection('wallets').updateOne({ user_id: ObjectId(userId) }, {
                $inc: { amount: refundAmount }
            })
        })

    },


    getUserWishlist: async (userId) => {
        return await db.get().collection('wishlists').find({ user_id: ObjectId(userId) }).toArray()
    },


    getUserCart: async (userId) => {
        return await db.get().collection('carts').find({ user_id: ObjectId(userId) }).project({ products: true }).toArray()
    },


    getUserWishlistOfThisProduct: async (userId, productId) => {
        return await db.get().collection('wishlists').findOne({ user_id: ObjectId(userId), products: { $elemMatch: { $eq: ObjectId(productId) } } },
            { projection: { products: { $elemMatch: { $eq: ObjectId(productId) } } } })

    },


    getUserCartOfThisProduct: async (userId, productId) => {
        return await db.get().collection('carts').findOne({ user_id: ObjectId(userId) },
            { projection: { products: { $elemMatch: { product_id: ObjectId(productId) } } } })

    },


    getWishlistProducts: async (userId) => {
        return await db.get().collection('wishlists').aggregate([
            {
                $match: { user_id: ObjectId(userId) }
            },
            {
                $unwind: '$products'
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'products',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            {
                $project: {
                    product: { $arrayElemAt: ['$product', 0] }
                }
            }

        ]).toArray()
    },


    generateRazorpay: async (orderId, paymentDetails) => {

        let total = parseInt(paymentDetails.offerAmount)
        let create_obj = {
            amount: total * 100,
            currency: "INR",
            receipt: "" + orderId
        }
        return new Promise(async (resolve, reject) => {
            instance.orders.create(create_obj, (err, order) => {
                if (order) {
                    resolve(order)
                } else {
                    console.log(err);
                }
            })
        })

    },


    verifyRazorpay: async (payment, order, userId) => {

        return new Promise((resolve, reject) => {
            let hmac = crypto.createHmac('sha256', 'COn7Bt0WUqkULBks5g3znowZ')
            hmac.update(payment.razorpay_order_id + '|' + payment.razorpay_payment_id)
            hmac = hmac.digest('hex')
            if (hmac == payment.razorpay_signature) {
                confirmOrder(userId, order.receipt)
                resolve()
            } else {
                reject()
            }
        })
    },


    viewOrderProduct: async (orderId) => {
        let orderedProducts = await db.get().collection('orders').aggregate([
            {
                $match: { _id: ObjectId(orderId) }
            },
            {
                $unwind: '$products'
            },
            {
                $project: {
                    item: '$products.product_id',
                    quantity: '$products.quantity'
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'item',
                    foreignField: '_id',
                    as: 'products'
                }
            },
            {
                $project: {
                    item: 1,
                    quantity: 1,
                    products: { $arrayElemAt: ['$products', 0] }
                }
            }
        ]).toArray()

        let orderData = await db.get().collection('orders').findOne({ _id: ObjectId(orderId) })

        return { orderedProducts, orderData }

    },


    couponCheck: async (userId, code, total) => {
        return db.get().collection('coupons').findOne({ code: code, status: true }).then((res) => {
            if (res) {
                return db.get().collection('coupons').findOne({ code: code, users_used: { $elemMatch: { $eq: ObjectId(userId) } } }).then((resp) => {
                    if (resp) {
                        return 'coupon used'
                    } else {
                        let percentage = parseInt(res.percentage)
                        let answer = total - (total * percentage) / 100
                        let discount = total - answer
                        return { answer, discount }

                    }
                })
            } else {
                return false
            }
        })
    },


    getAddress: async (address_no, userId) => {
        let userExist = await db.get().collection('useraddress').findOne({ user_id: ObjectId(userId) })
        for (i = 0; i < userExist.address.length; i++) {
            if (userExist.address[i].address_no == address_no) {
                return userExist.address[i]
            }
        }
    },


    getAllAddress: async (userId) => {
        let userAddressData = await db.get().collection('useraddress').findOne({ user_id: ObjectId(userId) })
        if (userAddressData) {
            return userAddressData.address
        }
    },


    createWallet: async (userId) => {
        await db.get().collection('wallets').insertOne({ user_id: ObjectId(userId), amount: 0 })
    },


    getWallet: async (userId) => {
        return await db.get().collection('wallets').find({ user_id: ObjectId(userId) }).project({ amount: true }).toArray()
    },


    getCoupon: async () => {
        return await db.get().collection('coupons').find().toArray()
    }

}