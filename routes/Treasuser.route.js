const express = require('express');
const middleware = require("../middleware/authmiddleware.js")
const Treasurer_route = express.Router();
const model = require('../models/index.js')
const   Treasurer_controller = require('../Constroller/Treasurer_controller.js');


Treasurer_route.get('/Admin_dashboard',middleware.authenticateJWT, Treasurer_controller.Admin_dashboard)
Treasurer_route.get('/Admin_register_user',middleware.authenticateJWT, Treasurer_controller.Admin_register_user)

Treasurer_route.post('/register_user_by_role',middleware.authenticateJWT, Treasurer_controller.register_user_by_role)

Treasurer_route.get('/Treasurer_create_payable',middleware.authenticateJWT, Treasurer_controller.Treasurer_create_payable)
Treasurer_route.get('/Treasurer_dashboard',middleware.authenticateJWT, Treasurer_controller.Treasurer_dashboard)
Treasurer_route.get('/Treasurer_register_user',middleware.authenticateJWT, Treasurer_controller.Treasurer_register_user)

Treasurer_route.get('/Treasurer_BSIT_3A_remittance',middleware.authenticateJWT,Treasurer_controller.Display_BSIT_3A)
Treasurer_route.get('/Treasurer_BSIT_3B_remittance',middleware.authenticateJWT,Treasurer_controller.Display_BSIT_3B)

Treasurer_route.get('/students',middleware.authenticateJWT,Treasurer_controller.student)
Treasurer_route.post('/create_payable',middleware.authenticateJWT,Treasurer_controller.create_payable)

Treasurer_route.get('/Display_Student_Info/:userId',middleware.authenticateJWT, Treasurer_controller.Display_Student_Info)

Treasurer_route.post('/api/remittances',middleware.authenticateJWT, Treasurer_controller.save_remittance)

Treasurer_route.get('/treasurer_3A_verify_remittance',middleware.authenticateJWT, Treasurer_controller.treasurer_3A_verify_remittance)
Treasurer_route.get('/treasurer_3B_verify_remittance',middleware.authenticateJWT, Treasurer_controller.treasurer_3B_verify_remittance)

Treasurer_route.post('/Treasurer_save_fund',middleware.authenticateJWT,Treasurer_controller.Treasurer_save_fund)
Treasurer_route.post('/updateStudent',middleware.authenticateJWT,Treasurer_controller.updateStudent)

Treasurer_route.post('/Treasurer_save_fund',middleware.authenticateJWT,Treasurer_controller.updateStudent)





module.exports = Treasurer_route