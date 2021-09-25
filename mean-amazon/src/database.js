/*
    Database access and login verification/authentication
    Lorenzo Cativiela Martín
*/

const { MongoClient, Double } = require("mongodb");


var database = {}
var collection = {}


const uri = process.env.mongoRoute;
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const client = new MongoClient(uri,{ useNewUrlParser: true, useUnifiedTopology: true})



/*
    Connect to the database
*/
async function connect() {
    try {
      await client.connect();
      
      database = client.db(process.env.mongoDB);
      collection = database.collection(process.env.mongoCollection);

      console.log("Connected to the database")
      
      
    } catch (e){
      throw e
    }
}

/*
    Get a page of logs
*/
async function logs(page) {
  let response = {
    pages: 0,
    logs: []
  }
    
    
    try {
      var query = { key: "MAX_ID"}
      let maxID = await collection.find(query).toArray()
      let id = maxID[0].value
      response.pages = Math.ceil(id/5)
      id = id - 5*(page-1)

      for(let i = id; i> Math.max(id-5,0); i--){
        query = { key: i }
        try{
          let op = await collection.find(query).toArray()
          response.logs.push(op[0])
        }catch(e){
          console.log(e)
        }
        
      }
           
    } catch(e){
      console.log(e)
    } 
  return response
}

/*
    Get logs for an specific parent identifier
*/
async function filterLogs(id){
  let page = 0
  let response = {
    pages: 0,
    logs: []
  }
    
    
    try {
      var query = { parent: {$regex : id}}
      let res = await collection.find(query).toArray()
      
      response.logs=res
    } catch(e){
      console.log(e)
    } 
  return response
}

/*
    Updates the field with key: id, and updates the value passed to the method
*/
async function updateLog(id, values) {
    try {      
      
      var query = { key: id }        
      var newValues = { $set: values }
      await collection.updateOne(query, newValues)
    } catch(e){
      console.log(e)
    } 
}

/*
  Verifies the login info with the stored (and cyphered) password
  If verified, returns new JWT
*/
async function verifyLogin(user, password) {
  try{
    query = { user: user }
    let result = await collection.findOne(query)
    let success = await bcrypt.compare(password, result.password)
    if(success) {
      console.log("LOGGED IN, GENERATING JWT")
      //Create JWT
      let payload = {
        user: result.user,
        email: result.email
      }
      let token = jwt.sign(payload, process.env.key)      
      return token
    }else{
      return 0
    }
  
  }catch(e){
    return 0
  }
}

/*
  Verifies that the token signature is valid
*/
async function verifyToken(token){
  try{
    let response = jwt.verify(token, process.env.key)
    return response
  }catch(JsonWebTokenError){
    return 0
  }
  
}
  
/*
    Add to the DB a new update parent log
*/
async function newParentLog(parent, marketplace, children, token) {
  let id = 0
  try {
    
    var query = { key: "MAX_ID"}
    let maxID = await collection.find(query).toArray()
    id = maxID[0].value + 1
      
    var newValues = { $set: { value: id}}
    await collection.updateOne(query, newValues)

    let time = new Date
    let date = time.getDate()+" "+time.getMonth()+" "+time.getFullYear()
    var newLog = { key: id , operation: "update", status: "PROCESSING", token: token, message: "", date: date, parent: parent, marketplace: marketplace, children: children }
    await collection.insertOne(newLog)
    
    console.log("Added registry " + id + " to the database")
    
  } catch(e){
    console.log(e)
    throw e
  } finally {
    return id
  }
}

/*
    Add to the DB a new create parent log
*/
async function newCreateLog(sku, marketplace, productType, variationType, token) {
  let id = 0
  try {
    
    var query = { key: "MAX_ID"}
    let maxID = await collection.find(query).toArray()
    id = maxID[0].value + 1
      
    var newValues = { $set: { value: id}}
    await collection.updateOne(query, newValues)

    let time = new Date
    let date = time.getDate()+" "+time.getMonth()+" "+time.getFullYear()

    var newLog = { key: id , operation: "create", status: "PROCESSING", token: token, message: "", date: date, parent: sku, 
                  marketplace: marketplace, productType: productType, variationType: variationType}
    await collection.insertOne(newLog)
    
    console.log("Added registry " + id + " to the database")
    
  } catch(e){
    console.log(e)
    throw e
  } finally {
    return id
  }
}







module.exports.connect = connect
module.exports.logs = logs
module.exports.filterLogs = filterLogs
module.exports.newParentLog = newParentLog
module.exports.newCreateLog = newCreateLog
module.exports.updateLog = updateLog
module.exports.verifyLogin = verifyLogin
module.exports.verifyToken = verifyToken