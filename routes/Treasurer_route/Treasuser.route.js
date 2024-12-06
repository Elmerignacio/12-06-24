
const express = require('express');
const middleware = require("../../middleware/authmiddleware.js");
const Treasurer_route = express.Router();
const Treasurer_controller = require('../../Controller/Treasurer_Controller/Treasurer_controller.js');


Treasurer_route.get('/login', Treasurer_controller.login);
Treasurer_route.post('/login', Treasurer_controller.login_post);
Treasurer_route.get('/logout', Treasurer_controller.logout);


Treasurer_route.post(
    '/register_user_by_role',
    middleware.authenticateJWT,
    middleware.authorizeRole('TREASURER'),
    Treasurer_controller.register_user_by_role
);

Treasurer_route.get(
    '/Treasurer_create_payable',
    middleware.authenticateJWT,
    middleware.authorizeRole('TREASURER'),
    Treasurer_controller.Treasurer_create_payable
);

Treasurer_route.get(
    '/Treasurer_dashboard',
    middleware.authenticateJWT,
    middleware.authorizeRole('TREASURER'),
    Treasurer_controller.Treasurer_dashboard
);

Treasurer_route.get(
    '/Treasurer_register_user',
    middleware.authenticateJWT,
    middleware.authorizeRole('TREASURER'),
    Treasurer_controller.Treasurer_register_user
);
Treasurer_route.get(
    '/Treasurer_3A_verify_remittance',
    middleware.authenticateJWT,
    middleware.authorizeRole('TREASURER'),
    Treasurer_controller.treasurer_3A_verify_remittance
);

Treasurer_route.get(
    '/Treasurer_3B_verify_remittance',
    middleware.authenticateJWT,
    middleware.authorizeRole('TREASURER'),
    Treasurer_controller.treasurer_3B_verify_remittance
);


Treasurer_route.get(
    '/Treasurer_BSIT_3A_remittance',
    middleware.authenticateJWT,
    middleware.authorizeRole('TREASURER'),
    Treasurer_controller.Display_BSIT_3A
);

Treasurer_route.get(
    '/Treasurer_BSIT_3B_remittance',
    middleware.authenticateJWT,
    middleware.authorizeRole('TREASURER'),
    Treasurer_controller.Display_BSIT_3B
);

Treasurer_route.post(
    '/create_payable',
    middleware.authenticateJWT,
    middleware.authorizeRole('TREASURER'),
    Treasurer_controller.create_payable
);

Treasurer_route.get(
    '/Display_Student_Info/:userId',
    middleware.authenticateJWT,
    middleware.authorizeRole('TREASURER'),
    Treasurer_controller.Display_Student_Info
);
Treasurer_route.post(
    '/Treasurer_update_student',
    middleware.authenticateJWT,
    middleware.authorizeRole('TREASURER'),
    Treasurer_controller.updateStudent
);


Treasurer_route.post(
    '/Treasurer_archieve',
    middleware.authenticateJWT,
    middleware.authorizeRole('TREASURER'),
    Treasurer_controller.Treasurer_archieve 
);

Treasurer_route.post(
    '/Treasurer_display_archive',
    middleware.authenticateJWT,
    middleware.authorizeRole('TREASURER'),
    Treasurer_controller.Treasurer_display_archive 
);

Treasurer_route.get(
    '/Treasurer_archieve', 
    middleware.authenticateJWT,
    middleware.authorizeRole('TREASURER'),
    Treasurer_controller.Treasurer_archieve_student
);

Treasurer_route.post(
    '/api/remittances',
    middleware.authenticateJWT,
    middleware.authorizeRole('TREASURER'),
    Treasurer_controller.save_remittance
);


Treasurer_route.get(
    '/Treasurer_funds',
    middleware.authenticateJWT,
    middleware.authorizeRole('TREASURER'),
    Treasurer_controller.Treasurer_fund
);

Treasurer_route.post(
    '/Treasurer_save_fund',
    middleware.authenticateJWT,
    middleware.authorizeRole('TREASURER'),
    Treasurer_controller.Treasurer_save_fund
);

Treasurer_route.get('/students',middleware.authenticateJWT,middleware.authorizeRole('TREASURER'),Treasurer_controller.student)

Treasurer_route.get(
    '/Treasurer_3A_verified_remittance',
    middleware.authenticateJWT,
    middleware.authorizeRole('TREASURER'),
    Treasurer_controller.Treasurer_3A_verified_remittance
);
Treasurer_route.get(
    '/Treasurer_3B_verified_remittance',
    middleware.authenticateJWT,
    middleware.authorizeRole('TREASURER'),
    Treasurer_controller.Treasurer_3B_verified_remittance
);


Treasurer_route.post(
    '/treasurer_3A_show_treasurer_save_fund',
    middleware.authenticateJWT,
    middleware.authorizeRole('TREASURER'),
    Treasurer_controller.treasurer_3A_show_treasurer_save_fund
);

Treasurer_route.get(
    '/Treasurer_create_expenses',
    middleware.authenticateJWT,
    middleware.authorizeRole('TREASURER'),
    Treasurer_controller.Treasurer_display_expenses
);


Treasurer_route.post(
    '/treasurer_create_expenses',
    middleware.authenticateJWT,
    middleware.authorizeRole('TREASURER'),
    Treasurer_controller.treasurer_create_expenses
);

Treasurer_route.get(
    '/Treasurer_view_expense',
    middleware.authenticateJWT,
    middleware.authorizeRole('TREASURER'),
    Treasurer_controller.Treasurer_view_expense
);

Treasurer_route.get(
    '/Treasurer_receivable',
    middleware.authenticateJWT,
    middleware.authorizeRole('TREASURER'),
    Treasurer_controller.Treasurer_receivable
);

Treasurer_route.get(
    '/Treasurer_expenses',
    middleware.authenticateJWT,
    middleware.authorizeRole('TREASURER'),
    Treasurer_controller.Treasurer_expenses
);




module.exports = Treasurer_route;

