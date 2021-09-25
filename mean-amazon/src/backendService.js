/*
  
    VARIANT SERVICE MODULE:
    Service for the application Variant. This module executes the calls dispatched by the router's controller
    Its API functions work asynchronously, allowing multiple requests at the same time

    Lorenzo Cativiela Martin
*/
const SellingPartnerAPI = require('amazon-sp-api')

const db = require('./database')
db.connect()

const { application, json, request } = require('express')

const backendService = {}
const markets = {}
sellingPartner = {}


var HashMap = require('hashmap')
var XMLmanager = require('./XMLmanager')


/*
 *  API FUNCTIONS
 *  This is the list of the API functions that are open to the users
 *  Every petition, excepting login, requires a JWT token to autenticate a previous connexion
 */



/*
 * Verifies that the user exists, downloads marketplace information for the vendor
 * Returns JWT token if login is successful
 */
backendService.login = (req,res) => {
    (async() => {
        try {              
          let user = req.body.user
          let password = req.body.password

          if(user == "" || password == "") throw Error("INPUT ERROR")
          //Access the database module to verify the login. Responds JWT Token or 0.
          let token = await db.verifyLogin(user,password)
          if(token != 0){
            
            //Connect to the SP-API, using our previously loaded credentials
            sellingPartner = new SellingPartnerAPI({
              region:'eu', // The region to use for the SP-API endpoints (NA not available for this account yet)
              refresh_token: process.env.refresh_token
            });
            //Await authentication
            await sellingPartner.refreshAccessToken();
  
            //Retrieve our active marketplaces
            let markets = await sellingPartner.callAPI({
              operation:'getMarketplaceParticipations',
              endpoint:'sellers'
            });            
            this.markets = markets;

            //Respond with the token
            response = {
              petition: 'Login',
              status: 0,
              message: "Logged succesfully",
              value: {
                token: token
              }

            }
            res.send( response )
          }else{
            throw Error("Login not correct on user" + user)
          }
        } catch(e){
          //In case of error, respond with a bad request
          console.log(e);
          response = {
            petition: 'Login',
            status: 1,
            message: "Login error: " + e
          }
          res.send( response )
        }
      })();    
}


/*
 * Verifies that the user exists, downloads marketplace information for the vendor
 * Returns JWT token if login is successful
 */
backendService.searchAsin = (req, res) => {
  (async() => {
    try{   

      let verified = await db.verifyToken(req.body.token)
      if(!verified){
          throw Error("Not logged in")
      }

      let response = {}

      //Get data from petition
      let asin = req.params.asin
      let marketplace = req.params.marketplace   
      
      
      if(asin=='' || marketplace=='' || asin.length!=10){
        //Incomplete petition
        throw Error("INPUT ERROR")
      }else{

        //Find market
        let marketId = '0'
        for (const i in this.markets){
          
          if( this.markets[i].marketplace.countryCode == marketplace &&
            this.markets[i].marketplace.name.substring(0,6) == 'Amazon'){

              marketId = this.markets[i].marketplace.id
              console.log("Marketplace " + marketplace + " encontrado: " + marketId);
          }
        }

        if(marketId == '0'){

          //Market not found
          response = {
            petition: 'AsinSearch',
            status: 2,
            message: "Unavailable market"
          }

        } else {
          //Market found, request information
          let asinReq = await getAsinData(asin, marketId)
          if(Object.keys(asinReq.Identifiers).length==0){
            //Listing does not exist
            console.log("Wrong listing")
            response = {
              petition: 'AsinSearch',
              status: 3,
              message: "Asin " + asin + " does not exist on platform " + marketplace
            }
          }else{
            //Listing does exist
            let relations = null
            relations = asinReq.Relationships;
            //Prepare information to frontend
            response = {
              petition: 'AsinSearch',
              status: 0,
              message: 'Petition succesful',
              value: {
                asin: asin,
                marketplace: marketId,
                asinInfo: asinReq,
                relations: relations
              }
            }      
          }                             
        }
      }
      //Return message
      res.send(response)
     
    } catch(e){
      console.log(e);
      response = {
        petition: 'AsinSearch',
        status: 1,
        message: e
      }
      res.send(response)
    }
  })();
}

/*
 * Collection edit operation. This allows for relation creation, editing, and deleting
 * Updates relation attributes if neccesary
 */
backendService.editParent = (req, res) => {
  (async() => {
    

    let requestSent = 0
    let opID = 0
    try {

      let verified = await db.verifyToken(req.body.token)
      if(!verified){
          throw Error("Not logged in")
      }


      //Input: Parent, market, variationtype, list of children with ASIN and variation info
      let input = req.body  
      if(input=="" || input == null) throw Error("INPUT ERROR")
      console.log("New parent petition for "+input.asin)

      //Record the petition to the database
      let childrenList = createDBchildren(input.children)
      opID = await db.newParentLog(input.asin,input.marketplace,childrenList,req.body.token)

      let response = {
        petition: 'AsinEdit',
        status: 0,
        message: 'Petition created',
        value: {
          opID: opID, 
          asin: input.asin
        }
      }
      //Comunicate the front-end process, that the service is already working on his request
      res.send(response)
      requestSent=1
       
      
      
      //Get Amazon's product info for the parent in it's data scheme
      let parentInfo = await getAsinData(input.asin, input.marketplace)
      let parentReupload = 0
      let variationInfo = input.variation

      //Get the information of the new children to add, and check if they are part of the collection
      let childrenInfo = []
      let originalChildrenCount = 0
      for(let childRow of input.children){
        //Retrieve info for the children
        let child = await getAsinData(childRow.Identifiers, input.marketplace)

        //Check if the data is valid and add to the list
        if (Object.keys(child.Identifiers).length>0){
            try{  
              //Verify if the children is in this collection already
              let originalParent = child.Relationships[0].Identifiers.MarketplaceASIN.ASIN
              if(originalparent = input.asin) originalChildrenCount++
            }catch(e){
              //Its not a variation
            }
          childrenInfo.push(child)
        }else{
          //If the listing does not exist on Amazon. Mark the children as error on the list (logs)
          childrenList = changeChildrenStatus(childrenList, childRow.Identifiers, "ERROR", "ASIN does not exist on this platform")
        }        
      }    
      //Mark parent for reupload if at least one member of the original relation has been marked for removal
      if(parentInfo.Relationships.length > originalChildrenCount ){
        parentReupload = 1        
      }
      
      //Remove relations from children of other collections
      let removeParentResponse = await removeOtherParents(input.asin, childrenInfo, input.marketplace)
      await db.updateLog(opID, { parentRes: {removeParentResponse}})


      //Verify if the variation attributes require of a value update
      let verifyResponse = await verifyChildrenInfo(input.children, childrenInfo, input.marketplace, input.variation)
      await db.updateLog(opID, { verifyRes: verifyResponse})


      //Verify if the parent requires reuploading
      let sku = getSKU(parentInfo)      
      if(parentReupload==1){
        //If so, delete the parent
        let feed = await XMLmanager.createXMLDelete(sku)
        let deleteParentResponse = await feedAndReport(feed, input.marketplace, 'POST_PRODUCT_DATA')
        removeParentResponse.push(deleteParentResponse)
        //Reupload the parent
        let productInfo = {
          productType: parentInfo.AttributeSets[0].ProductTypeName,
          itemType: parentInfo.AttributeSets[0].ProductGroup
        }
        feed = await XMLmanager.createXMLCreate(sku, productInfo, variationInfo)
        let reuploadParentResponse = await feedAndReport(feed, input.marketplace, 'POST_PRODUCT_DATA')
        removeParentResponse.push(reuploadParentResponse)
      }

      //Update the relationships of the parent
      //If we deleted everything, do not reupload
      if(childrenInfo.length>0){
        let feed = await XMLmanager.createXMLRelationship(sku, retrieveSKUList(childrenInfo))
        let mainParentResponse = await feedAndReport(feed, input.marketplace, 'POST_PRODUCT_RELATIONSHIP_DATA')

        
        //Update the log with the responses     
        await processResponse(opID, mainParentResponse, childrenList)
      }else{
        await db.updateLog(opID, {status: 'DONE', message: "Operation completed", mainRes: "Parent deleted completely, do not reupload"})
      }
      
      
      console.log("Parent petition "+ opID + " finished successfully")
      
    } catch(e){
      console.log(e)
      //Send the user an error response, in case we had not answered already
      if(!requestSent){
        let response = {
          petition: 'AsinEdit',
          status: 1,
          message: 'Petition failed',
          value: {
            opID: opID
          }
        }
        res.send(response)
      }
      //Update the operation to reflect the error
      await db.updateLog(opID, {status: 'ERROR', message: e})
      console.log("Parent petition "+ opID + "finished with errors")
    }
  })(); 
}

/*
 * Parent creation operation. Creates a parent of the specified collection and variation type
 *
 */
backendService.createParentOP = (req, res) => {
  (async() => {
    let verified = await db.verifyToken(req.body.token)
      if(!verified){
          throw Error("Not logged in")
      }

    
    let opID = 0
    let requestSent = 0
    try{            
      //Get request information
      let sku = req.params.sku
      let marketplace = req.params.marketplace
      let productType = req.body.productType
      let variationType = req.body.variation
      if (sku=="" || marketplace =="" || productType=="" || variationType=="") throw Error("INPUT ERROR")

      //Find market code (user inputs country code like UK, FR,...)
      let marketId = '0'
      for (let i in this.markets){        
        if( this.markets[i].marketplace.countryCode == marketplace &&
            this.markets[i].marketplace.name.substring(0,6) == 'Amazon'){
            marketId = this.markets[i].marketplace.id
            console.log("Marketplace " + marketplace + " encontrado: " + marketId);
        }
      }

      if(marketId == '0'){
        //Market not found
        response = {
          petition: 'CreateParent',
          status: 2,
          message: "Unavailable market"
        } 
        res.send(response)

      }else{
        //Create a database log for this request and communicate it to the front-end
        opID = await db.newCreateLog(sku, marketId, productType, variationType, req.body.token)
        let response = {
          petition: 'CreateParent',
          status: 0,
          message: 'Petition created',
          value: {
            opID: opID
          }
        }
        res.send(response)
        requestSent=1


        //Parse input variations        
        let variations = []
        if( String(variationType).includes(',')){
          variations = String(variationType).split(',')
        }
        else{
          variations = [variationType]
        }

        //Upload the new parent
        let feed = await XMLmanager.createXMLNewParent(sku, productType, variations)
        let feedResponse = await feedAndReport(feed,marketId,'POST_PRODUCT_DATA')

        //Parse the result and update it to the log database
        feedSuccess = await XMLmanager.XMLValue(feedResponse, 'MessagesSuccessful')
        if(feedSuccess==0){
          await db.updateLog(opID, {status: 'PARTIAL', message: "Product creation failed ", mainRes: feedResponse})
          console.log("Parent creation petition "+ opID + " finished incorrectly")
        }else{
          await db.updateLog(opID, {status: 'DONE', message: "Created the listing", mainRes: feedResponse})
          console.log("Parent creation petition "+ opID + " finished successfully")
        }
        
        }

      
    }catch(e){
      //Send response to the frontEnd in case none has been sent
      if(!requestSent){
        let response = {
          petition: 'CreateParent',
          status: 1,
          message: 'Petition failed',
          value: {
            opID: opID
          }
        }
        res.send(response)
      }
      //Update the log
      await db.updateLog(opID, {status: 'ERROR', message: e})
      console.log("Parent creation petition "+ opID + "finished with errors")
    }
  })();   
}

/*
 * Log operation. Returns a log page requested by the front-end
 *
 */
backendService.logs = (req, res) => {
  (async() => {
    try {         
      let verified = await db.verifyToken(req.body.token)
      if(!verified){
          throw Error("Not logged in")
      }

      //Get the requested page
      let page =  req.params.page
      if (page=="") throw Error("INPUT ERROR")
      
      //Get the logs from the database
      let logResponse = await db.logs(page)

      //Return them to the user
      let response = {
        petition: 'Logs',
        status: 0,
        message: 'Logs',
        value: {
          logs: logResponse
        }
      }
      res.send(response)

    } catch(e){
      //Send the error message
      let response = {
        petition: 'Logs',
        status: 1,
        message: e
      }
      res.send(response)
    }
  })();    
}

/*
 * Log filter. Returns the logs of the requested collection parent
 *
 */
backendService.getASINLogs = (req, res) => {
  (async() => {
    try{
      let verified = await db.verifyToken(req.body.token)
      if(!verified){
          throw Error("Not logged in")
      }

      //Request from the database the logs
      let parent = req.params.id
      if (parent=="") throw Error("INPUT ERROR")
      let logResponse = await db.filterLogs(parent)

      //Return them to the frontEnd
      let response = {
        petition: 'Logs',
        status: 0,
        message: 'Filter '+parent,
        value: {
          logs: logResponse
        }
      }
      res.send(response)


    }catch(e){
      //Return the error message
      let response = {
        petition: 'Logs',
        status: 1,
        message: e
      }
      res.send(response)
    }
  })();    
}


/*
* Secondary functions
* 
*/

/*
 * Verify which children require their relationships being removed
 * Listings may be retrieved from various parents. For each one of them
 * An operation to remove the connection must be done
*/
async function removeOtherParents(parent, childrenList, marketplace){
  console.log("Verifying previous listing relations")
  try{
    
  if(parent==undefined || marketplace==undefined) throw Error("INPUT ERROR")
  //Create a list of the children from different parents [ [ parent,[children] ] ]
  //Some of this children may be already children of the original parent
  let removeList = []

  for(let children of childrenList){
    //Empty relationships => Has no parent
    if(children.Relationships.length>0){
      //Get this listing's parent asin
      let childParent = children.Relationships[0].Identifiers.MarketplaceASIN.ASIN
      //Verify that the listing's parent is different than the one we chose
      if( childParent != parent ){
        let childAsin = children.Identifiers.MarketplaceASIN.ASIN
        //If it is on the list already, add it
        let found = 0;
        for(let i = 0; i<removeList.length; i++){
          if(removeList[i][0]==childParent){
            let [parent,children] = removeList[i]
            children.push(childAsin)
            removeList[i]=[parent,children]
            found = 1;
          }
        }        
        //If it was not on the list, add new
        if(!found){
          removeList.push([childParent,[childAsin]])
        }      
      }
    }
  }
    if(removeList>0){
        //Start the removal from parent operations
      //For each parent, launch a method to remove the connection
      const response = await Promise.all(
        removeList.map(async (row) => {
          return await removeFromParent(row[0],row[1], marketplace)
        })
      )
      return response
    }else{
      return []
    }    
  }catch(e){
    return "Error on parent reupload: " + e
  }

  
}

/*
 * Remove various childrens from a parent operation
 * Deletes and reuploads the parent, and assigns back
 * the children that are not on childrenList
*/
async function removeFromParent (parent, childrenList, marketplace){
  let response = "Processing deletion from parent "+parent
  try{
    if(parent==undefined||childrenList==undefined||marketplace==undefined) throw Error("INPUT ERROR")
    //Get info from parent
    let parentInfo = await getAsinData(parent, marketplace)
    if ( Object.keys(parentInfo.Identifiers).length==0) throw new Error

    //Get child variations
    let variations = Object.keys(parentInfo.Relationships[0])
    variations = variations.filter(e => e !== 'Identifiers')

    //The previous childrens of the parent (excepts the ones we want to extract.) will need to be reassigned
    let childrenToMantain = []
    for(let element of parseChildrenList(parentInfo.Relationships,childrenList)){
      let child = await getAsinData(element, marketplace)
      childrenToMantain.push(child)
    }
    
    //Delete parent
    let feed = await XMLmanager.createXMLDelete(getSKU(parentInfo))
    let deleteParentResponse = await feedAndReport(feed, marketplace, 'POST_PRODUCT_DATA')
   
    //Emptied parent: Do not reupload
    if(childrenToMantain.length==0){
      //Old parent empty, do not reupload
      response = "No children left, deleted parent" + parent

    } else{
      //Reupload parent
      //Set product info
      let productInfo = {
        productType: parentInfo.AttributeSets[0].ProductTypeName,
        itemType: parentInfo.AttributeSets[0].ProductGroup
      }
      //Create feed and upload
      feed = await XMLmanager.createXMLCreate(getSKU(parentInfo), productInfo, variations)
      let reuploadParentResponse = await feedAndReport(feed, marketplace, 'POST_PRODUCT_DATA')
      
      //Create variations feed and 
      feed = await XMLmanager.createXMLRelationship(getSKU(parentInfo), retrieveSKUList(childrenToMantain))
      let mainParentResponse = await feedAndReport(feed, marketplace, 'POST_PRODUCT_RELATIONSHIP_DATA')
      
      let response = mainParentResponse
    }    
  }catch(e){
    response = "Unsuccessful deletion from parent"
    console.log(e)
  }  
  return response
}

  

async function verifyChildrenInfo(input, childrenList, marketplace, variations){
    try{
      if(input==undefined || childrenList==undefined || marketplace==undefined || variations==undefined){
        throw Error("INPUT ERROR")
      } 
      let operationList = []
      //Go through children list, if their attributes are different from input, push into list
      for(let children of childrenList){
        let asin = children.Identifiers.MarketplaceASIN.ASIN
        for(let row of input){
          if(row.Identifiers==asin){
            isDifferent = 0;
            if(variations[0]=='Identifiers') variations.shift()
            //Check all variations for differences
            for(let variation of variations){              
              if(row[variation]!=children.AttributeSets[0][variation]){
                isDifferent=1
              }
            }
            if(isDifferent) operationList.push([children,row])     
          }
        }
      }

      //Found differences, create xml update list
      if(operationList.length>0 ){
        let feed = await XMLmanager.createXMLUpdate(operationList)
        //Upload and return response to main method
        let response = feedAndReport(feed, marketplace, 'POST_PRODUCT_DATA')
        return response
      } else{
        return "No children to change"
      }
  } catch (e){
    console.log(e)
    return "Failed altering children info " +e
  }
}

async function feedAndReport(feed, marketplace, feedType){
  try{
    if(feed=="" || marketplace=="" || feedType=="") throw Error("INPUT ERROR")
    //Upload feed
    feedResult = await uploadFeed(feed, marketplace, feedType)
    //Check feed reports    
    report = await retrieveReport(feedResult.feedId)
    return report
  }catch(e){
    console.log(e)
    return "Fatal error processing feeds"
  }
  
  
}

/*
 * Upload feed to amazon
*/
async function uploadFeed(feed, marketplace, feedType){
  //Create feed information
  let feed_upload_details = await sellingPartner.callAPI({
    operation:'createFeedDocument',
    endpoint:'feeds',
    body:{
      contentType: feed.contentType
    }
  });
  //Upload feed to the specified document
  let res = await sellingPartner.upload(feed_upload_details, feed)

  //Launch the feed, with the feed id category specified on the input
  let feed_creation_infos = await sellingPartner.callAPI({
    operation:'createFeed',
    endpoint:'feeds',
    body:{
      marketplaceIds:[marketplace],
      feedType: feedType,
      inputFeedDocumentId:feed_upload_details.feedDocumentId // retrieve the feedDocumentId from the "createFeedDocument" operation
    }
  })
  //Return feed info id
  return feed_creation_infos
}

/*
 * Download report when ready
*/
async function retrieveReport(feedId){
  console.log(feedId)
  let report_id
  /*
  * Amazon responds to the getFeed operation with the status of the operation
  * We have to await for some time until the process its done, and amazon does not
  * warn us when the petition ends, therefore, we have to actively wait
  */
 let max_tries = 70
  do { //Loop while feed is in process or in queue, continue when its finished
    //Wait for 20 seconds
    await sleep(20)
    //Get feed information
    report_id = await sellingPartner.callAPI({
      operation:'getFeed',          
      endpoint:'feeds',
      path:{
        feedId: feedId // retrieve the reportDocumentId from a "getReport" operation (when processingStatus of report is "DONE")
      }
    });
    //Show status
    //console.log("report id status"); console.log(report_id.processingStatus);
    max_tries--
    
  } while( report_id.processingStatus != 'DONE' && max_tries > 0)

  if(max_tries==0){
    return "Error downloading report, Amazon is not processing document results"
  }

  //Get report document from the report id
  let report_document = await sellingPartner.callAPI({
    operation:'getFeedDocument',
    endpoint:'feeds',
    path:{
      feedDocumentId: report_id.resultFeedDocumentId
    }
  });
  
  //Download document
  let report = await sellingPartner.download(report_document)
  //Return report
  return report
}

/*
* Support functions
* 
*/

//Await this to sleep the required seconds
function sleep(s) {
  return new Promise((resolve) => {
    setTimeout(resolve, s*1000);
  });
}


//Retrieve asin from amazon. Returns {Identifiers: {}} if it does not exist
async function getAsinData(asin,marketId) { 
  let asinRes = await sellingPartner.callAPI({
    operation:'getCatalogItem',
    endpoint:'catalogItems',
    path:{
      asin: asin
    },
    query:{
      MarketplaceId: marketId,
      includedData:'attributes,identifiers,variations,productTypes'
    }
  })
  console.log(asinRes)
  return asinRes
}

//Get SKU list from Product data list
function retrieveSKUList(list){
  console.log(list)
  let response = []
  for(let row of list){
    response.push(getSKU(row))
  }
  return response
}

//Get Nacnic's current SKU values for the parents
function getSKU(listing) {
  let res = listing.AttributeSets[0].PartNumber
  if(res==undefined){
    res = String(listing.AttributeSets[0].Title).toUpperCase()
  } 
  return res
}

/*
   * Return a list with the children of parentRelationships, excepting the children to remove (childrenList)
  */
function createDBchildren(children){
  let response = []
  for (let row of children){
    let varInfo = []
    try{
      for (let i of row.VariationType){
        if(i!='Identifiers'){
          varInfo.push(i+': '+row[i])
        }
      }
    }catch(TypeError){

    }
    let childRow = {
      asin: row.Identifiers,
      variation: varInfo,
      status: 'PROCESSING',
      message: ''
    }
    response.push(childRow)
  }
  return response
}

  /*
   * Edit children status from the list to later upload to log
  */
function changeChildrenStatus (childrenList, cancelASIN, status , message){
  let response = childrenList
  for(let i=0;i<childrenList.length;i++){
    if(childrenList[i].asin == cancelASIN){
      childrenList[i].status = status
      childrenList[i].message.push(message)
    }
  }
  return response
}


/*
   * Return a list with the children of parentRelationships, excepting the children to remove (childrenList)
  */
function parseChildrenList(parentRelationships, childrenList){
  try{
    let childrenToMantain = []
    for(let row of parentRelationships){    
    let found = 0;
    for(let children of childrenList){
      if(row.Identifiers.MarketplaceASIN.ASIN == children){
        found = 1;
      }
    }
    if(!found){

      childrenToMantain.push(row.Identifiers.MarketplaceASIN.ASIN)
    }
  }

  return childrenToMantain
  }catch(e){
    console.log(e)
    return parentRelationships
  }

  
}

  /*
   * Parse response from amazon
  */
async function parseXMLResponse (response){
  let result= {
    processed: XMLmanager.XMLValue(response,'MessagesProcessed'),
    successful: XMLmanager.XMLValue(response,'MessagesSuccessful'),
    error: XMLmanager.XMLValue(response,'MessagesWithError'),
    warning: XMLmanager.XMLValue(response,'MessagesWithWarning'),
    errorMsg: XMLmanager.XMLValue(response,'ResultDescription')
  }
  return result
}

  /*
   * Update the database at the end of the operation
  */
async function processResponse(opID, xmlResponse, childrenList){
  try{
    let response = await parseXMLResponse(xmlResponse)
    let status = 'PARTIAL'
    let message = response.successful + ' out of ' + response.processed  + 'children assigned'
    if(response.processed == response.successful){
      status = 'DONE'
      message = 'All children assigned'
    }
    for(let i = 0; i<childrenList.length; i++){
      if(childrenList[i].status == 'PROCESSING'){
        childrenList[i].status = status
      }
    }
    await db.updateLog(opID, {status: status, message: message, mainRes: xmlResponse, children: childrenList })
  }catch(e){
    await db.updateLog(opID, {status: 'ERROR', message: String(e)})
  }
  

}



/////////////////////////////////TEST ZONE

backendService.test = (req, res) => {
(async() => {
  })();
}




module.exports = backendService;