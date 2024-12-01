const express = require('express');
const middleware = require("../../middleware/authmiddleware.js")
const Admin_route = express.Router();
const model = require('../../models/index.js')
const Admin_controller = require('../../Controller/Admin_Controller/Admin_controller.js')




//admin
Admin_route.get('/Admin_dashboard',middleware.authenticateJWT, Admin_controller.Admin_dashboard)
Admin_route.get('/Admin_register_user',middleware.authenticateJWT, Admin_controller.Admin_register_user)
Admin_route.get('/Admin_3A_verify_remittance',middleware.authenticateJWT, Admin_controller.Admin_3A_verify_remittance)
Admin_route.get('/Admin_3B_verify_remittance',middleware.authenticateJWT, Admin_controller.Admin_3B_verify_remittance)
Admin_route.get('/Admin_register_user',middleware.authenticateJWT, Admin_controller.Admin_register_user)



module.exports = Admin_route