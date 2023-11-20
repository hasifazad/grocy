const db = require("../config/connection.js")
const bcrypt = require("bcrypt")
const ObjectId = require("mongodb").ObjectId





module.exports = {
    doSignupAdmin: async (adminData) => {
        let response = await db.get().collection('admins').findOne({ emailid: adminData.emailid })

        if (response === null) {
            adminData.password = await bcrypt.hash(adminData.password, 10)
            return await db.get().collection('admins').insertOne(adminData)
        } else {
            return 'admin exist'
        }
    },

    doLoginAdmin: async (adminData) => {
        console.log(adminData);
        let admin = await db.get().collection('admins').findOne({ emailid: adminData.emailid })
        console.log(admin);

        if (admin) {
            let passwordTrue = await bcrypt.compare(adminData.password, admin.password)
            console.log(passwordTrue);
            if (passwordTrue === true) {
                return admin
            } else {
                return false
            }
        } else {
            return false
        }
    },

    getUsers: async () => {
        return await db.get().collection('users').find().toArray()
    },


    getProducts: async () => {
        let products = await db.get().collection('products').find().toArray()
        if (products) {
            return products
        } else {
            return false
        }
    },


    addProduct: async (product) => {
        return await db.get().collection('products').insertOne(product)
    },

    blockUser: async (id, status) => {
        if (status) {
            return await db.get().collection('users').updateOne({ _id: ObjectId(id) },
                {
                    $set: { status: false }
                }
            )
        } else {
            return await db.get().collection('users').updateOne({ _id: ObjectId(id) },
                {
                    $set: { status: true }
                }
            )
        }
    },


    removeProductImage: async (productId) => {
        return await db.get().collection('products').findOne({ _id: ObjectId(productId) }, { projection: { _id: false, images: true } })
    },


    removeProduct: async (productId) => {
        return await db.get().collection('products').deleteOne({ _id: ObjectId(productId) })
    },


    getEditProduct: async (productId) => {
        return await db.get().collection('products').findOne({ _id: ObjectId(productId) })
    },


    editProduct: async (id, product) => {
        return await db.get().collection('products').updateOne(
            { _id: ObjectId(id) },
            {
                $set: {
                    name: product.name,
                    category: product.category,
                    price: product.price,
                    description: product.description,
                }
            }
        )
    },


    getCategories: async () => {
        let categories = await db.get().collection('categories').find().toArray()
        if (categories) {
            return categories
        } else {
            return false
        }
    },


    addCategory: async (categoryData) => {
        return await db.get().collection('categories').insertOne(categoryData).then(async (res) => {
            let categoryId = res.insertedId
            await createBrand(categoryId)
            return categoryId
        })
    },


    editCategory: async (categoryId, categoryData) => {
        return await db.get().collection('categories').updateOne(
            { _id: ObjectId(categoryId) },
            {
                $set: {
                    category_name: categoryData.category_name,
                    subcategory: categoryData.subcategory,
                    brand: categoryData.brand,
                    discount: categoryData.discount
                }
            }
        ).then(async (res) => {
            await createBrand(categoryId)
            return
        })
    },


    createBrand: async (categoryId) => {
        let a = await db.get().collection('categories').aggregate([
            {
                $match: { _id: ObjectId(categoryId) }
            },
            {
                $unwind: '$brand'
            },
            {
                $project: {
                    _id: 0,
                    brand: 1,
                    categories: ['$category_name']
                }
            }
        ]).toArray()

        for (i = 0; i < a.length; i++) {
            let br = await db.get().collection('brands').findOne({ brand: a[i].brand })
            if (br) {
                await db.get().collection('brands').updateOne({ brand: a[i].brand }, {
                    $addToSet: { categories: a[i].categories[0] }
                })
            } else {
                a[i].discount = 0
                let m = await db.get().collection('brands').insertOne(a[i])
            }
        }
        return
    },


    getBrands: async () => {
        return await db.get().collection('brands').find().toArray()
    },


    getCategory: async () => {
        return await db.get().collection('categories').find().toArray()
    },


    getOrders: async () => {

        return db.get().collection('orders').find().toArray()
    },


    take: async (value) => {
        return db.get().collection('categories').findOne({ category_name: value })
    },


    removeOrder: async (orderId) => {
        return await db.get().collection('orders').updateOne({ _id: ObjectId(orderId) }, {
            $set: { status: 'cancelled' }
        })
    },


    shipOrder: async (orderId) => {
        return await db.get().collection('orders').updateOne({ _id: ObjectId(orderId) }, {
            $set: { status: 'shipped' }
        })
    },


    deliverOrder: async (orderId) => {
        return await db.get().collection('orders').updateOne({ _id: ObjectId(orderId) }, {
            $set: { status: 'deliverd' }
        })
    },


    getDashboardDatas: async () => {
        let userCount = await db.get().collection('users').count()
        let productCount = await db.get().collection('products').count()
        let orderCount = await db.get().collection('orders').count()
        let brandCount = await db.get().collection('brands').count()

        let totalSale = await db.get().collection('orders').aggregate([
            {
                $group: {
                    _id: '',
                    total: { $sum: '$offer_amount' }
                }
            },
            {
                $project: {
                    _id: 0,
                    total: '$total'
                }
            }
        ]).toArray()

        let total
        let salesPerDay = []     // array of total sales per day of last 10 days
        let start = new Date()
        let end = new Date()
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)

        for (i = 0; i < 10; i++) {
            if (i == 0) {
                start.setDate(start.getDate())
                end.setDate(end.getDate())
            } else {
                start.setDate(start.getDate() - 1)
                end.setDate(end.getDate() - 1)
            }


            total = await db.get().collection('orders').aggregate([
                {
                    $match: { ordered_on: { $gte: start, $lt: end }, status: { $nin: ['cancelled'] } }
                },
                {
                    $group: {
                        _id: '',
                        total: { $sum: '$offer_amount' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        total: '$total'
                    }
                }
            ]).toArray()

            if (total.length == 0) {
                salesPerDay.push(0)
            } else {
                salesPerDay.push(total[0].total)
            }
        }

        try {
            return { userCount, productCount, brandCount, orderCount, totalSale: totalSale[0].total, salesPerDay }
        } catch (error) {
            return { userCount, productCount, brandCount, orderCount, salesPerDay }
        }

    },


    setCoupon: async (couponData) => {
        await db.get().collection('coupons').insertOne(couponData)
    },


    deleteCoupon: async (couponId) => {
        await db.get().collection('coupons').deleteOne({ _id: ObjectId(couponId) })
    },


    getThisCategory: async (categoryId) => {
        return await db.get().collection('categories').findOne({ _id: ObjectId(categoryId) })
    },


    setBrandDiscount: async (brandId, percent) => {
        await db.get().collection('brands').updateOne({ _id: ObjectId(brandId) }, {
            $set: {
                discount: percent
            }
        })
    },


    setCategoryDiscount: async (categoryId, percent) => {
        await db.get().collection('categories').updateOne({ _id: ObjectId(categoryId) }, {
            $set: {
                discount: percent
            }
        })
    },


    setDiscountPriceOnProduct: async (percent, Name, a) => {
        let products
        percent = parseInt(percent)
        if (a == 'brand') {
            products = await db.get().collection('products').find({ brand: Name }).toArray()
        } else {
            products = await db.get().collection('products').find({ category: Name }).toArray()
        }

        for (i = 0; i < products.length; i++) {
            let offerPrice = products[i].price - ((products[i].price * percent) / 100)
            await db.get().collection('products').updateOne(
                {
                    _id: ObjectId(products[i]._id)
                },
                {
                    $set: {
                        offer_price: offerPrice
                    }
                }
            )
        }
    },


    deleteBrand: async (brandId, brandName) => {
        await db.get().collection('brands').deleteOne({ _id: ObjectId(brandId) })
        await db.get().collection('categories').update({}, {
            $pull: {
                brand: brandName
            }
        })
    },


    getCoupon: async () => {
        return await db.get().collection('coupons').find().toArray()
    },


    viewOrderDetails: async (orderId) => {
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


    getSalesByDay: async (date) => {

        return await db.get().collection('orders').aggregate([
            {
                $project: {
                    user_id: '$user_id',
                    offer_amount: '$offer_amount',
                    ordered_on: { $dateToString: { format: "%Y-%m-%d", date: "$ordered_on" } }
                }
            },
            {
                $match: {
                    ordered_on: date
                }
            },
            {
                $lookup: {
                    from: 'userdetails',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $project: {
                    user_id: 1,
                    offer_amount: 1,
                    ordered_on: 1,
                    user: {
                        'user': { $arrayElemAt: ['$user.username', 0] },
                        'email': { $arrayElemAt: ['$user.emailid', 0] }
                    }
                }
            },
            {
                $project: {
                    user_id: 1,
                    offer_amount: 1,
                    ordered_on: 1,
                    user: { $arrayElemAt: ['$user', 0] }
                }
            }
        ]).toArray()
    },


    getSalesByMonth: async (date) => {

        return await db.get().collection('orders').aggregate([
            {
                $project: {
                    user_id: '$user_id',
                    offer_amount: '$offer_amount',
                    ordered_on: { $dateToString: { format: "%Y-%m", date: "$ordered_on" } }
                }
            },
            {
                $match: {
                    ordered_on: date
                }
            },
            {
                $lookup: {
                    from: 'userdetails',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $project: {
                    user_id: 1,
                    offer_amount: 1,
                    ordered_on: 1,
                    user: {
                        'user': { $arrayElemAt: ['$user.username', 0] },
                        'email': { $arrayElemAt: ['$user.emailid', 0] }
                    }
                }
            },
            {
                $project: {
                    user_id: 1,
                    offer_amount: 1,
                    ordered_on: 1,
                    user: { $arrayElemAt: ['$user', 0] }
                }
            }
        ]).toArray()
    },


    getSalesByYear: async (date) => {

        return await db.get().collection('orders').aggregate([
            {
                $project: {
                    user_id: '$user_id',
                    offer_amount: '$offer_amount',
                    ordered_on: { $dateToString: { format: "%Y", date: "$ordered_on" } }
                }
            },
            {
                $match: {
                    ordered_on: date
                }
            },
            {
                $lookup: {
                    from: 'userdetails',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $project: {
                    user_id: 1,
                    offer_amount: 1,
                    ordered_on: 1,
                    user: {
                        'user': { $arrayElemAt: ['$user.username', 0] },
                        'email': { $arrayElemAt: ['$user.emailid', 0] }
                    }
                }
            },
            {
                $project: {
                    user_id: 1,
                    offer_amount: 1,
                    ordered_on: 1,
                    user: { $arrayElemAt: ['$user', 0] }
                }
            }
        ]).toArray()
    }
}