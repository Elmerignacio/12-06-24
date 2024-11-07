const express = require('express');
const route = express.Router();
const model = require('../models')
const admin_controller = require('../Constroller/route_controller');


route.get('/login', admin_controller.login)
route.get('/Admin_dashboard', admin_controller.Admin_dashboard)
route.get('/Admin_register_user', admin_controller.Admin_register_user)


route.post('/register_user_by_role', admin_controller.register_user_by_role)

route.get('/Treasurer_create_payable', admin_controller.Treasurer_create_payable)
route.get('/Treasurer_dashboard', admin_controller.Treasurer_dashboard)
route.get('/Treasurer_register_user', admin_controller.Treasurer_register_user)

route.get('/Treasurer_BSIT_3A_remittance',admin_controller.Display_BSIT_3A)
route.get('/Treasurer_BSIT_3B_remittance',admin_controller.Display_BSIT_3B)

route.get('/students',admin_controller.student)
route.post('/create_payable',admin_controller.create_payable)

route.get('/Display_Student_Info/:userId', admin_controller.Display_Student_Info)

route.post('/api/remittances', admin_controller.save_remittance)


module.exports = route