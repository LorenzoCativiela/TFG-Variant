/*
  XML feed creator and parser
  Lorenzo Cativiela Martin
*/
const jsdom = require("jsdom")
const { JSDOM } = jsdom

/*
    Create a relationship feed header (parent info)
*/
function XMLRelationshipHeader (parent){
  let response = 
  `<?xml version="1.0" encoding="utf-8" ?>
  <AmazonEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="amzn-envelope.xsd">
  <Header>
      <DocumentVersion>1.01</DocumentVersion>
      <MerchantIdentifier>`+ process.env.MERCHANT_TOKEN + `</MerchantIdentifier>
  </Header>
  <MessageType>Relationship</MessageType>
    <Message>
      <MessageID>1</MessageID>
      <OperationType>Update</OperationType>
        <Relationship>
          <ParentSKU>` + parent + `</ParentSKU>
          `
  return response
}

/*
    Create a relationship feed body (children info)
*/
function XMLRelationshipChildRows(childrenList){
  let response=``
  for(let childrenRow of childrenList){
    response = response + 
        ` <Relation>
            <SKU>` + childrenRow + `</SKU>
            <Type>Variation</Type>
          </Relation>
        `
  }
  return response
}

function XMLRelationshipend(){
  let response = 
  `   </Relationship>
    </Message>
  </AmazonEnvelope>`;
  return response
}


/*
    Create a delete feed
*/
function XMLDeleteFeed(sku){
let response = `<?xml version="1.0" encoding="UTF-8"?>
  <AmazonEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="amzn-envelope.xsd">
    <Header>
      <DocumentVersion>1.01</DocumentVersion>
      <MerchantIdentifier>`+ process.env.MERCHANT_TOKEN + `</MerchantIdentifier>
    </Header>
    <MessageType>Product</MessageType>
    <Message>
      <MessageID>1</MessageID>
      <OperationType>Delete</OperationType>
      <Product>
        <SKU>`+ sku + `</SKU>
      </Product>
    </Message>
  </AmazonEnvelope>
  `
  return response;
}


/*
    Create a product creation feed
*/
function XMLCreationFeed(sku,productType,itemType,variationInfo){
  let response = 
  `<?xml version="1.0" encoding="UTF-8"?>
<AmazonEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="amzn-envelope.xsd">
    <Header>
        <DocumentVersion>1.01</DocumentVersion>
        <MerchantIdentifier>`+ process.env.MERCHANT_TOKEN + `</MerchantIdentifier>
    </Header>
    <MessageType>Product</MessageType>
    <PurgeAndReplace>false</PurgeAndReplace>
    <Message>
        <MessageID>1</MessageID>
        <OperationType>PartialUpdate</OperationType>
        <Product>
            <SKU>`+ sku + `</SKU>
            <Condition>
              <ConditionType>New</ConditionType> 
            </Condition>
            <DescriptionData>
                <Title>`+ sku + `</Title>
                <ItemType>`+ itemType + `</ItemType>
            </DescriptionData>
            <ProductData>
            `+ productTypeData(productType, true) + `     
                         
                <Parentage>variation-parent</Parentage>
                <VariationData>
                  `+ parentVariationDataManual(variationInfo) + `
                </VariationData>
            `+ productTypeData(productType, false) + `
            </ProductData>              
        </Product>
    </Message>
</AmazonEnvelope>`
return response
}


/*
    Create a update attribute feed 
*/
function XMLUpdateFeed (list){

  let response = ''
  try{
    response = XMLUpdateHeader()
    for(let i = 0; i< list.length; i++){
      let [ attributes , input ] = list[i]
      let rowInfo = {
        id: i+1,
        sku: getSKU(attributes),
        asin: getASIN(attributes),
        title: getTitle(attributes),
        productType: getProductType(attributes),
        variationInfo: input
      }
      response = response + XMLUpdateRow(rowInfo)
    }
    response = response + XMLUpdateEnd()

  }catch (e){
    console.log(e)
  }
return response
}


/*
    Create a update attribute feed header
*/
function XMLUpdateHeader(){
let response = `<?xml version="1.0" encoding="UTF-8"?>
<AmazonEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="amzn-envelope.xsd">
    <Header>
        <DocumentVersion>1.01</DocumentVersion>
        <MerchantIdentifier>`+ process.env.MERCHANT_TOKEN + `</MerchantIdentifier>
    </Header>
    <MessageType>Product</MessageType>
    <PurgeAndReplace>false</PurgeAndReplace>`

return response
}

/*
    Create a update attribute row
*/
function XMLUpdateRow(rowInfo){
let response = `
    <Message>
        <MessageID>`+ rowInfo.id + `</MessageID>
        <OperationType>PartialUpdate</OperationType>
        <Product>
            <SKU>`+ rowInfo.sku + `</SKU>
            <StandardProductID>
                <Type>ASIN</Type>
                <Value>`+ rowInfo.asin + `</Value>
              </StandardProductID>
            <DescriptionData>
              <Title>`+ rowInfo.title + `</Title>
            </DescriptionData>
            <ProductData>
            `+ productTypeData(rowInfo.productType, true) + `
                <VariationData>`
                  + productVariation(rowInfo.variationInfo) + `
                </VariationData>
            `+ productTypeData(rowInfo.productType, false) + `
            </ProductData>              
        </Product>
    </Message>`
return response
}

function XMLUpdateEnd(){
return `</AmazonEnvelope>`
}


/*
    Return string, in given text, that its contained by given value tags
*/
function parseXMLValue(text, value){
  try{
    let dom = new JSDOM(text)
    let res = dom.window.document.querySelector(value).textContent
    return res
  }catch(e){
    return ''
  }
}


/*
    Product data info for various feeds
    Parse Amazon category into the needed tags
    More tags will need to be added, for now, the ones that nacnic uses
*/
function productTypeData (productType, isHeader){
let result = ''
if(productType='HOME_FURNITURE_AND_DECOR'){
  
  if(isHeader){
    result = `<Home>       
                <ProductType>
                  <FurnitureAndDecor/>
                </ProductType>`
  }else{
    result = `</Home>`
  }
}else{
  if(isHeader){
    result = `<Home>`
  }else{
    result = `</Home>`
  }
}
return result
}


/*
    Parse variation theme for parent data row
*/
function parentVariationDataManual (variationTypes){

  
  if(variationTypes.includes('Size') && variationTypes.includes('Color')){
    return `<VariationTheme>Size-Color</VariationTheme>
                          <Size>ParentSize</Size>
                          <Color>ParentColor</Color>`
  }else if(variationTypes.includes('Size')){
    return `<VariationTheme>Size</VariationTheme>
                          <Size>ParentSize</Size>`
  }else if(variationTypes.includes('Color')){
    return `<VariationTheme>Color</VariationTheme>
                          <Color>ParentColor</Color>`
  }else if(variationTypes.includes('Material')){
    return `<VariationTheme>Material</VariationTheme>
                          <Material>ParentColor</Material>`
  }
  else return ''

}

function parentVariationData (variationTypes){
  let response
  if(variationTypes.length==1){
    response =  `
          <VariationTheme>` + variationTypes[0] + `</VariationTheme>` +
          `<` + variationTypes[0] + `>` + variationTypes[0] + `</` + variationTypes[0] + `>`
  } else if(variationTypes.length==2){
    response =  `
          <VariationTheme>` + variationTypes[0]+'-'+variationTypes[1] + `</VariationTheme>`+
          `<` + variationTypes[0] + `>` + variationTypes[0] + `</` + variationTypes[0] + `>` +
          `<` + variationTypes[1] + `>` + variationTypes[1] + `</` + variationTypes[1] + `>` 
  }else{
  }
  return response
}


/*
    Parse variation theme for children row
*/
function productVariation(variations){

  let varType = variations.VariationType
  if(varType[0]=='Identifiers'){
    varType.shift()
  }
  let response
  if(varType.length==1){
    response =  `
          <Parentage>child</Parentage>
          <VariationTheme>` + varType[0] + `</VariationTheme>` +
          `<` + varType[0] + `>` + variations[varType[0]] + `</` + varType[0] + `>`
  } else{
    var0 = varType[0]
    var1 = varType[1]
    if(var0=="Color" && var1=="Size"){
      var0="Size"
      var1="Color"
    }
    response =  `
          <Parentage>child</Parentage> 
          <VariationTheme>` + var0+'-'+var1 + `</VariationTheme>\n`+
          `<` + varType[0] + `>` + variations[varType[0]] + `</` + varType[0] + `>\n` +
          `<` + varType[1] + `>` + variations[varType[1]] + `</` + varType[1] + `>\n`
  }
   
  return response
}



/*
    Get various attributes per listing
*/
function getSKU(listing) {
return listing.AttributeSets[0].PartNumber
}

function getTitle(listing) {
return listing.AttributeSets[0].Title
}

function getProductType(listing) {
return listing.AttributeSets[0].ProductTypeName
}

function getASIN(listing) {
return listing.Identifiers.MarketplaceASIN.ASIN
}

function createXMLUpdateFeed2(sku,productType,itemType,variationInfo){
  let response = `<?xml version="1.0" encoding="UTF-8"?>
  <AmazonEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="amzn-envelope.xsd">
      <Header>
          <DocumentVersion>1.01</DocumentVersion>
          <MerchantIdentifier>`+ process.env.MERCHANT_TOKEN + `</MerchantIdentifier>
      </Header>
      <MessageType>Product</MessageType>
      <PurgeAndReplace>false</PurgeAndReplace>
      <Message>
          <MessageID>1</MessageID>
          <OperationType>PartialUpdate</OperationType>
          <Product>
              <SKU>`+ sku + `</SKU>
              <StandardProductID>
                <Type>ASIN</Type>
                <Value>B09DLC78V3</Value>
              </StandardProductID>
              <DescriptionData>
                <Title>Vater TFG Nummer 5 - Kind 2 A4 SM</Title>
              </DescriptionData>
              <ProductData>
              `+ productTypeData(productType, true) + `
                  <VariationData>
                    <Parentage>child</Parentage>
                    <VariationTheme>Size-Color</VariationTheme>
                    <Size>Awfdd</Size>
                    <Color>Abhzxcvc</Color> 
                  </VariationData>
              `+ productTypeData(productType, false) + `
              </ProductData>              
          </Product>
      </Message>
  </AmazonEnvelope>`
  return response
}

function createFeed(content){
  let feed = {
    content: content,
    contentType:'text/xml; charset=utf-8'
  }
  return feed
}

function productInfoCreation (productType){
  if(productType=='Furniture'){
    let response = {
      ProductGroup: 'Furniture',
      ProductTypeName: 'HOME_FURNITURE_AND_DECOR',
    }
    return response
  }
  return null
}


module.exports = {
  createXMLRelationship: createXMLRelationship = (parent, childrenList) => {
      let content = XMLRelationshipHeader(parent) + XMLRelationshipChildRows(childrenList) + XMLRelationshipend()
      return createFeed(content)
  },

  createXMLDelete: createXMLDelete = (sku) => {
    let content = XMLDeleteFeed(sku)
    return createFeed(content)
  },
  createXMLCreate: createXMLCreate = (sku, productInfo, variationInfo) => {
    let content = XMLCreationFeed(sku, productInfo.productType, productInfo.itemType,variationInfo)
    return createFeed(content)
  },
  createXMLNewParent: createXMLNewParent = (sku, itemType, variationInfo) => {
    let productType = productInfoCreation(itemType).productType
    let content = XMLCreationFeed(sku, productType, itemType, variationInfo)
    
    return createFeed(content)
  },
  createXMLUpdate: createXMLUpdate = (list) => {
    let content = XMLUpdateFeed(list)
    //content = content.split("\n").join("")
    return createFeed(content)
  },
  XMLValue: XMLValue = (text, value) => {
    let response = parseXMLValue(text, value)
    return response
  },
  productInfoCreation: productInfoCreation
  
}