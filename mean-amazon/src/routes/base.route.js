/*
    ROUTER: handles the rutes accessed by the frontend
*/

//Module startup
const express = require('express')
const router = express.Router()
//Controller load
const appCtrl = require('../controllers/app.controller.js')


//Supported routes

router.post('/login', appCtrl.login)
router.post('/searchAsin/:asin/:marketplace', appCtrl.searchAsin)
router.post('/editParent/:asin', appCtrl.editParent)
router.post('/createParentOp/:sku/:marketplace', appCtrl.createParentOp)

router.post('/logs/:page', appCtrl.logs)
router.post('/logs/get/:id', appCtrl.getASINLogs)




//Module export
module.exports = router