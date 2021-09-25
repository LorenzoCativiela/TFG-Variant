/*
    CONTROLLER: Access services on the application on behalf of external http requests given by router
*/



const appCtrl = {}
const backendService = require('../backendService')



appCtrl.login = (req, res) => {
    backendService.login(req,res)      
}

appCtrl.searchAsin = (req, res) => {     
    backendService.searchAsin(req,res)
}

appCtrl.editParent = (req, res) => {
    backendService.editParent(req, res)
}

appCtrl.createParentOp = (req, res) => {
    backendService.createParentOP(req, res)
}

appCtrl.logs = (req, res) => {
    backendService.logs(req, res)
}

appCtrl.getASINLogs = (req, res) => {
    backendService.getASINLogs(req, res)
}



module.exports = appCtrl;