
const mongoClient = require("mongodb").MongoClient

const state = {
    db: null
}


function connectDb(done){
   
    const url = `mongodb+srv://hasifazad:dIV4H7QLPYv5XnKN@cluster0.9i6hcim.mongodb.net/grocery?retryWrites=true&w=majority`
    const dbName = 'grocery'
    
    mongoClient.connect(url,(err,data)=>{
        if(err){
            done(err)
        }else{
           state.db = data.db(dbName)
           done()
        }
    })
}

function get(){
    return state.db
}


module.exports = {connectDb,get}
