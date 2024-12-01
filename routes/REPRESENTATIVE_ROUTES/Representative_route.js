const express = require("express");
const middleware = require("../../middleware/authmiddleware.js");
const Representative_route = express.Router();
const Representative_controller = require("../../Controller/Representative_Controller/Representative_Controller.js");

// Route for Representative Dashboard
Representative_route.get(
    "/Representative_dashboard",
    middleware.authenticateJWT,
    middleware.authorizeRole('REPRESENTATIVE'),
    Representative_controller.Representative_dashboard
);

// Route to verify remittance for BSIT 3A
Representative_route.get(
    "/Representative_3A_verify_remittance",
    middleware.authenticateJWT,
    middleware.authorizeRole('REPRESENTATIVE'),
    Representative_controller.Representative_3A_verify_remittance
);

Representative_route.get(
    "/Representative_3B_verify_remittance",
    middleware.authenticateJWT,
    middleware.authorizeRole('REPRESENTATIVE'),
    Representative_controller.Representative_3B_verify_remittance
);



// Route to display remittance for BSIT 3A
Representative_route.get(
    '/Representative_BSIT_3A_remittance',
    middleware.authenticateJWT,
    middleware.authorizeRole('REPRESENTATIVE'),
    Representative_controller.Display_BSIT_3A
);

// Route to display remittance for BSIT 3A
Representative_route.get(
    '/Representative_BSIT_3B_remittance',
    middleware.authenticateJWT,
    middleware.authorizeRole('REPRESENTATIVE'),
    Representative_controller.Display_BSIT_3B
);

Representative_route.post(
    '/api/remittance',
    middleware.authenticateJWT,
    middleware.authorizeRole('REPRESENTATIVE'),
    Representative_controller.save_remittance
);

// Shared or General Routes
Representative_route.post(
    '/Representative_funds',
    middleware.authenticateJWT,
    middleware.authorizeRole('REPRESENTATIVE'),
    Representative_controller.Representative_save_fund
);

Representative_route.get(
    '/Representative_display_Student_Info/:userId',
    middleware.authenticateJWT,
    middleware.authorizeRole('REPRESENTATIVE'),
    Representative_controller.Representative_display_Student_Info
);



module.exports = Representative_route;
