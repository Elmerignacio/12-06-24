const express = require('express');
const middleware = require("../middleware/authmiddleware.js")
const route = express.Router();
const model = require('../models')
const admin_controller = require('../Constroller/route_controller');


route.get('/login', admin_controller.login)
route.post('/login',admin_controller.login_post);
route.get('/Admin_dashboard',middleware.authenticateJWT, admin_controller.Admin_dashboard)
route.get('/Admin_register_user',middleware.authenticateJWT, admin_controller.Admin_register_user)


route.post('/register_user_by_role',middleware.authenticateJWT, admin_controller.register_user_by_role)

route.get('/Treasurer_create_payable',middleware.authenticateJWT, admin_controller.Treasurer_create_payable)
route.get('/Treasurer_dashboard',middleware.authenticateJWT, admin_controller.Treasurer_dashboard)
route.get('/Treasurer_register_user',middleware.authenticateJWT, admin_controller.Treasurer_register_user)

route.get('/Treasurer_BSIT_3A_remittance',middleware.authenticateJWT,admin_controller.Display_BSIT_3A)
route.get('/Treasurer_BSIT_3B_remittance',middleware.authenticateJWT,admin_controller.Display_BSIT_3B)

route.get('/students',middleware.authenticateJWT,admin_controller.student)
route.post('/create_payable',middleware.authenticateJWT,admin_controller.create_payable)

route.get('/Display_Student_Info/:userId',middleware.authenticateJWT, admin_controller.Display_Student_Info)

route.post('/api/remittances',middleware.authenticateJWT, admin_controller.save_remittance)

route.get('/treasurer_3A_verify_remittance',middleware.authenticateJWT, admin_controller.treasurer_3A_verify_remittance)
route.get('/treasurer_3B_verify_remittance',middleware.authenticateJWT, admin_controller.treasurer_3B_verify_remittance)

route.post('/Treasurer_save_fund',middleware.authenticateJWT,admin_controller.Treasurer_save_fund)
route.post('/updateStudent/:id',middleware.authenticateJWT,admin_controller.updateStudent)







module.exports = route