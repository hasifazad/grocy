require("dotenv").config()
const express = require("express")
const path = require("path")
const fileUpload = require("express-fileupload")
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser');
const session = require('express-session')
const hbs = require("express3-handlebars")



const port = 3000
const app = express()





const db = require("./config/connection.js")
db.connectDb((err) => {
    if (err) {
        console.log(err);
        console.log('db error');
    } else {
        console.log('database connected');
    }
})




app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())
app.use(session({ name: "user-loggedin", secret: "userkey", cookie: { maxAge: 1000 * 60 * 60 } }))
// app.use(fileUpload())
let habs = hbs.create({})
habs.handlebars.registerHelper('eq', function (arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});
habs.handlebars.registerHelper('neq', function (arg1, arg2, options) {
    return (arg1 != arg2) ? options.fn(this) : options.inverse(this);
});
// app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs')
app.engine('hbs', hbs({
    extname: 'hbs',
    defaultLayout: 'layout',
    layoutDir: __dirname + '/views/layouts',
    partialDir: __dirname + '/views/partials'
}));


const userRouter = require('./routes/user.js')
const adminRouter = require('./routes/admin.js')
app.use("/", userRouter)
app.use("/admin", adminRouter)






app.listen(port, (err) => {
    if (err) {
        console.log(err)
    } else {
        console.log("Server is connected to port " + port);
    }
})