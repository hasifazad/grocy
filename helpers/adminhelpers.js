const db = require("../config/connection.js")
const bcrypt = require("bcrypt")
const ObjectId = require("mongodb").ObjectId






async function doSignupAdmin(adminData) {
    let response = await db.get().collection('admins').findOne({ emailid: adminData.emailid })

    if (response === null) {
        adminData.password = await bcrypt.hash(adminData.password, 10)
        return await db.get().collection('admins').insertOne(adminData)
    } else {
        return 'admin exist'
    }
}

async function doLoginAdmin(adminData) {
    let admin = await db.get().collection('admins').findOne({ emailid: adminData.emailid })

    if (admin) {
        let passwordTrue = await bcrypt.compare(adminData.password, admin.password)
        if (passwordTrue === true) {
            return admin
        } else {
            return false
        }
    } else {
        return false
    }
}

async function getUsers() {
    return await db.get().collection('users').find().toArray()
}

async function getProducts() {
    let products = await db.get().collection('products').find().toArray()
    if (products) {
        return products
    } else {
        return false
    }
}

async function addProduct(product) {
    return await db.get().collection('products').insertOne(product)
}

async function blockUser(id, status) {
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
}
async function removeProductImage(productId){
    return await db.get().collection('products').findOne({_id:ObjectId(productId)},{projection:{_id:false,images:true}})
}
async function removeProduct(productId) {
    return await db.get().collection('products').deleteOne({ _id: ObjectId(productId) })
}

async function getEditProduct(productId) {
    return await db.get().collection('products').findOne({ _id: ObjectId(productId) })
}

async function editProduct(id, product) {
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
}

async function getCategories() {
    let categories = await db.get().collection('categories').find().toArray()
    if (categories) {
        return categories
    } else {
        return false
    }
}

async function addCategory(categoryData) {
    return await db.get().collection('categories').insertOne(categoryData).then(async (res) => {
        let categoryId = res.insertedId
        await createBrand(categoryId)
        return categoryId
    })
}

async function editCategory(categoryId, categoryData) {
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
}

async function createBrand(categoryId) {
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
}

async function getBrands() {
    return await db.get().collection('brands').find().toArray()
}
async function getCategory() {
    return await db.get().collection('categories').find().toArray()
}

async function getOrders() {

    return db.get().collection('orders').find().toArray()
}

async function take(value) {
    return db.get().collection('categories').findOne({ category_name: value })
}

async function removeOrder(orderId) {
    return await db.get().collection('orders').updateOne({ _id: ObjectId(orderId) }, {
        $set: { status: 'cancelled' }
    })
}
async function shipOrder(orderId) {
    return await db.get().collection('orders').updateOne({ _id: ObjectId(orderId) }, {
        $set: { status: 'shipped' }
    })
}
async function deliverOrder(orderId){
    return await db.get().collection('orders').updateOne({_id:ObjectId(orderId)},{
        $set: { status: 'deliverd' }
    })
}

async function getDashboardDatas() {
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

}

async function setCoupon(couponData) {
    await db.get().collection('coupons').insertOne(couponData)
}
async function deleteCoupon(couponId) {
    await db.get().collection('coupons').deleteOne({ _id: ObjectId(couponId) })
}

async function getThisCategory(categoryId) {
    return await db.get().collection('categories').findOne({ _id: ObjectId(categoryId) })
}

async function setBrandDiscount(brandId, percent) {
    await db.get().collection('brands').updateOne({ _id: ObjectId(brandId) }, {
        $set: {
            discount: percent
        }
    })
}
async function setCategoryDiscount(categoryId, percent) {
    await db.get().collection('categories').updateOne({ _id: ObjectId(categoryId) }, {
        $set: {
            discount: percent
        }
    })
}
async function setDiscountPriceOnProduct(percent, Name, a) {
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
}
async function deleteBrand(brandId, brandName) {
    await db.get().collection('brands').deleteOne({ _id: ObjectId(brandId) })
    await db.get().collection('categories').update({}, {
        $pull: {
            brand: brandName
        }
    })
}

async function getCoupon() {
    return await db.get().collection('coupons').find().toArray()
}
async function viewOrderDetails(orderId) {
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

}

async function getSalesByDay(date) {

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
}
async function getSalesByMonth(date) {

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
}
async function getSalesByYear(date) {

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

module.exports = {
    getSalesByDay,
    getSalesByMonth,
    getSalesByYear,
    doSignupAdmin,
    doLoginAdmin,
    getUsers,
    getProducts,
    addProduct,
    blockUser,
    removeProductImage,
    removeProduct,
    getEditProduct,
    editProduct,
    getCategories,
    addCategory,
    editCategory,
    getOrders,
    getCategory,
    take,
    removeOrder,
    shipOrder,
    deliverOrder,
    getDashboardDatas,
    setCoupon,
    deleteCoupon,
    getThisCategory,
    getBrands,
    setBrandDiscount,
    setCategoryDiscount,
    deleteBrand,
    setDiscountPriceOnProduct,
    getCoupon,
    viewOrderDetails
}