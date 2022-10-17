const yup = require("yup")



const userLoginValidation = async(req,res,next)=>{
    console.log(req.body);
    try {
        await yup.object({
            emailid : yup.string().email().required(),
            password : yup.string().min(6).required()
        }).validate(req.body)

        return next()
    } catch (err) {
        console.log(err);
        res.json({error:err.errors[0]})
    }
}

const userSignupValidation = async(req,res,next)=>{
    console.log(req.body);
    try {
        await yup.object({
            emailid : yup.string().email().required(),
            password : yup.string().min(6).required(),
            mobile : yup.string().min(10).max(10).required(),
            username : yup.string().min(3).required()
        }).validate(req.body)

        return next()
    } catch (err) {
        console.log(err);
        res.json({error:err.errors[0]})
    }
}

module.exports = userLoginValidation,userSignupValidation