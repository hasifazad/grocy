const express = require("express")
const router = express.Router()
const fs = require('fs')

let puppeteer = require("puppeteer")
let fsextra = require("fs-extra")
let hbs = require("handlebars")

const adminHelpers = require("../helpers/adminhelpers.js")
const upload = require("../middleware/multer.js")




let adminName
const verifyAdminLogin = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        return next()
    } else {
        res.render('admin/login', { admin: true })
    }
}




// =====================================================================================//
// ======================               GET REQUESTS              ======================//
// =====================================================================================//

router.get('/login', verifyAdminLogin, (req, res) => {
    res.redirect('/admin', { admin: true })
})

router.get('/signup', (req, res) => {
    if (req.session.adminLoggedIn) {
        res.redirect('/admin')
    } else {
        res.render('admin/signup', { admin: true })
    }
})

router.get('/logout', (req, res) => {
    req.session.adminLoggedIn = false
    res.redirect('/admin')
})


// =====================================================================================//
// ======================               POST REQUESTS              =====================//
// =====================================================================================//

router.post('/signup', async (req, res) => {
    let adminData = req.body
    let response = await adminHelpers.doSignupAdmin(adminData)

    if (response.acknowledged === true) {
        req.session.admin = adminData.username
        req.session.adminLoggedIn = true

        adminName = req.session.admin
        res.json({ adminexist: true })
    } else {
        res.json({ adminexist: false })
    }
})

router.post('/login', async (req, res) => {
    let admin = await adminHelpers.doLoginAdmin(req.body)

    if (admin) {
        req.session.admin = admin.username
        req.session.adminLoggedIn = true

        adminName = admin.username
        res.json({ password: true })
    } else {
        res.json({ password: false })
    }

})



//===================================    dashboard    ====================================//

router.get('/', verifyAdminLogin, async (req, res) => {
    let { userCount, productCount, brandCount, orderCount, totalSale, salesPerDay } = await adminHelpers.getDashboardDatas()

    res.render('admin/dashboard', { adminName, admin: true, userCount, productCount, brandCount, orderCount, totalSale, ar: salesPerDay })
})



//====================================    sales    ===================================//

router.get('/sales', verifyAdminLogin, async (req, res) => {
    // let date = new Date()
    // let v = date.getFullYear() + '-' + ((date.getMonth) < 10 ? '0' : '') + (date.getMonth() + 1) + '-' + (date.getDate() < 10 ? '0' : '') + (date.getDate() - 1);
    // let a = await adminHelpers.getSalesByDay(v)

    res.render('admin/sales', { admin: true, adminName })
})

router.post('/get-day-sales', verifyAdminLogin, async (req, res) => {
    let duration = req.body.duration
    let timePeriod = req.body.time_period

    if (duration == 'day') {
        let data = await adminHelpers.getSalesByDay(timePeriod)


        let browser = await puppeteer.launch()
        let page = await browser.newPage()
        let html = await fsextra.readFile('C:/Users/hasifazad/Desktop/pr/form.hbs', 'utf8')
        console.log(data);
        let content = hbs.compile(html)({ a: data })
        console.log(content);
        await page.setContent(content)
        await page.pdf({
            path: 'output.pdf',
            format: 'A4',
            printBackground: true
        })
        await browser.close()


        res.render('admin/sales', { admin: true, adminName, data })
    } else if (duration == 'month') {
        let data = await adminHelpers.getSalesByMonth(timePeriod)
        res.render('admin/sales', { admin: true, adminName, data })
    } else {
        let data = await adminHelpers.getSalesByYear(timePeriod)
        res.render('admin/sales', { admin: true, adminName, data })
    }

})



// ===================================    users    ===================================//

router.get('/users', verifyAdminLogin, async (req, res) => {
    let userDetails = await adminHelpers.getUsers()
    for (i = 0; i < userDetails.length; i++) {
        let date = new Date(userDetails[i].created_on)
        userDetails[i].sl_no = i + 1;
        userDetails[i].created_on = date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear();
    }
    res.render('admin/users', { userDetails, adminName, admin: true })
})

router.get('/block-user/:id/:status', verifyAdminLogin, async (req, res) => {
    let { id, status } = req.params

    await adminHelpers.blockUser(id, status)
    req.session.userStatus = false
    res.redirect('/admin/users')
})

router.get('/block-user/:id', verifyAdminLogin, async (req, res) => {
    let { id } = req.params
    let status = false

    let a = await adminHelpers.blockUser(id, status)
    req.session.userStatus = true
    res.redirect('/admin/users')
})


//==============================    products    ================================//

router.get('/products', verifyAdminLogin, async (req, res) => {
    let products = await adminHelpers.getProducts()
    for (i = 0; i < products.length; i++) {
        let date = new Date(products[i].added_on)
        products[i].sl_no = i + 1;
        products[i].added_on = date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear();
    }
    res.render('admin/products', { products, admin: true, adminName })
})

router.get('/add-product', verifyAdminLogin, async (req, res) => {
    let category = await adminHelpers.getCategory()
    
    res.render('admin/add-product', { admin: true, adminName, category })
})

router.get('/edit-product/:id', verifyAdminLogin, async (req, res) => {
    let productId = req.params.id

    let product = await adminHelpers.getEditProduct(productId)
    res.render('admin/edit-product', { product, admin: true, adminName })
})

router.get('/remove-product/:id', async (req, res) => {
    let productId = req.params.id
    let { images } = await adminHelpers.removeProductImage(productId)
    console.log(images);
    for (i = 0; i < images.length; i++) {
        fs.unlinkSync('./public/images/products/' + images[i])
    }
    await adminHelpers.removeProduct(productId)
    res.redirect('/admin/products')
})

router.post('/add-product', verifyAdminLogin, upload.array('images', 4), async (req, res) => {
    let productData = req.body

    productData.price = parseInt(productData.price)
    productData.offer_price = productData.price            //initially there will be no offer so 'price' is equal to 'offer_price'

    productData.added_on = new Date()

    let imagesFileNames = req.files.map((file) => {
        return file.filename
    })

    productData.images = imagesFileNames

    // image = req.files.image
    let productId = await adminHelpers.addProduct(productData)
    // image.mv('./public/images/products/' + productId.insertedId + '.png')
    res.redirect('/admin/products')
})

router.post('/edit-product/:id', verifyAdminLogin, upload.array('images', 4), async (req, res) => {
    let productData = req.body
    let productId = req.params.id

    productData.price = parseInt(productData.price)
    let imagesFileNames = req.files.map((file) => {
        return file.filename
    })

    productData.images = imagesFileNames

    await adminHelpers.editProduct(productId, productData)
    res.redirect('/admin/products')

})



//==============================    categories    ================================//

router.get('/categories', verifyAdminLogin, async (req, res) => {
    let categories = await adminHelpers.getCategories()
    for (i = 0; i < categories.length; i++) {
        categories[i].sl_no = i + 1;
    }
    res.render('admin/categories', { categories, admin: true, adminName })
})

router.get('/add-category', verifyAdminLogin, async (req, res) => {
    res.render('admin/add-category', { admin: true, adminName })
})

router.get('/edit-category/:id', verifyAdminLogin, async (req, res) => {

    let categoryId = req.params.id

    let category = await adminHelpers.getThisCategory(categoryId)
    res.render('admin/edit-category', { category, admin: true, adminName })
})

router.post('/change-category-discount', async (req, res) => {
    let { categoryName, categoryId } = req.body
    let percent = parseInt(req.body.percent)
    await adminHelpers.setCategoryDiscount(categoryId, percent)
    await adminHelpers.setDiscountPriceOnProduct(percent, categoryName, 'category')
    res.json({})
})

router.post('/add-category', verifyAdminLogin, upload.single('image'), async (req, res) => {
    let categoryData = req.body
    
    let imageFileName = req.file.filename

    categoryData.discount = parseInt(categoryData.discount)
    
    if(!Array.isArray(categoryData.subcategory)){
        categoryData.subcategory = [categoryData.subcategory]
    }
    if(!Array.isArray(categoryData.brand)){
        categoryData.brand = [categoryData.brand]
    }
   
    categoryData.image = imageFileName

    let categoryId = await adminHelpers.addCategory(categoryData)

    res.redirect('/admin/categories')
})

router.post('/edit-category/:id', verifyAdminLogin, upload.single('image'), async (req, res) => {

    let categoryData = req.body
    let categoryId = req.params.id
    let imageFileName = req.file.filename

    categoryData.discount = parseInt(categoryData.discount)

    categoryData.image = imageFileName

    await adminHelpers.editCategory(categoryId, categoryData)
    res.redirect('/admin/categories')
})



//=====================================    brands    =========================================//

router.get('/brands', verifyAdminLogin, async (req, res) => {
    let brands = await adminHelpers.getBrands()
    for (i = 0; i < brands.length; i++) {
        brands[i].sl_no = i + 1
    }
    res.render('admin/brands', { admin: true, adminName, brands })
})

router.post('/delete-brand', async (req, res) => {
    let { brandId, brandName } = req.body
    let a = await adminHelpers.deleteBrand(brandId, brandName)
    res.json({})
})


//======================================    orders    ======================================//

router.get('/orders', verifyAdminLogin, async (req, res) => {
    let orders = await adminHelpers.getOrders()

    for (i = 0; i < orders.length; i++) {
        let date = new Date(orders[i].ordered_on)
        orders[i].sl_no = i + 1;
        orders[i].ordered_on = date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear();
    }
    res.render('admin/orders', { adminName, admin: true, orders })
})

router.get('/view-order/:orderId', verifyAdminLogin, async (req, res) => {

    let { orderedProducts, orderData } = await adminHelpers.viewOrderDetails(req.params.orderId)

    try {
        let date = orderData.ordered_on
        orderData.ordered_on = date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear();
        for (i = 0; i < orderedProducts.length; i++) {
            orderedProducts[i].sl_no = i + 1
            orderedProducts[i].total = orderedProducts[i].quantity * orderedProducts[i].products.offer_price
        }
    } catch (error) {

    }

    res.render('admin/view-order-details', { adminName, admin: true, orderedProducts, orderData })
})

router.get('/remove-order/:id', async (req, res) => {
    let a = await adminHelpers.removeOrder(req.params.id)
    res.redirect('/admin/orders')
})

router.get('/ship-order/:id', async (req, res) => {
    let orderId = req.params.id
    await adminHelpers.shipOrder(orderId)
    res.redirect('/admin/orders')
})
router.get('/deliver-order/:id', async (req, res) => {
    let orderId = req.params.id
    await adminHelpers.deliverOrder(orderId)
    res.redirect('/admin/orders')
})


//====================================    coupons    =======================================//

router.get('/coupon', verifyAdminLogin, async (req, res) => {
    let coupons = await adminHelpers.getCoupon()
    res.render('admin/coupon', { admin: true, adminName, coupons })
})

router.get('/add-coupon', verifyAdminLogin, (req, res) => {
    res.render('admin/add-coupon', { admin: true, adminName })
})

router.get('/edit-coupon', verifyAdminLogin, (req, res) => {

})

router.get('/delete-coupon/:couponId', async (req, res) => {
    await adminHelpers.deleteCoupon(req.params.couponId)
    res.redirect('/admin/coupon')
})

router.post('/coupon-submit', verifyAdminLogin, async (req, res) => {
    req.body.status = true
    await adminHelpers.setCoupon(req.body)
    res.redirect('/admin/coupon')
})



router.post('/change-discount', async (req, res) => {
    let { brandName, brandId } = req.body
    percent = parseInt(req.body.percent)
    let a = await adminHelpers.setBrandDiscount(brandId, percent)
    await adminHelpers.setDiscountPriceOnProduct(percent, brandName, 'brand')
    res.json({})
})







router.post('/take', async (req, res) => {
    let cat = await adminHelpers.take(req.body.value)
    res.json({ cat })
})







router.get('/download', async (req, res) => {
    res.download('output.pdf')
})


module.exports = router