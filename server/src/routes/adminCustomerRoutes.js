const express = require("express");

const router = express.Router();


// ============================================================
// IMPORT MIDDLEWARE
// ============================================================

// Authentication
const protect =
    require("../middleware/authMiddleware");

// Authorization
const authorize =
    require("../middleware/roleMiddleware");


// ============================================================
// IMPORT CONTROLLERS
// ============================================================

const {

    getAllCustomers,

    updateCustomerStatus

} = require(
    "../controllers/adminCustomerController"
);


// ============================================================
// ADMIN CUSTOMER ROUTES
// ============================================================


// ------------------------------------------------------------
// GET ALL CUSTOMERS
// ------------------------------------------------------------

// GET /api/admin/customers

router.get(

    "/",

    protect,

    authorize("admin"),

    getAllCustomers

);


// ------------------------------------------------------------
// UPDATE CUSTOMER STATUS
// ------------------------------------------------------------

// PUT /api/admin/customers/:id/status

router.put(

    "/:id/status",

    protect,

    authorize("admin"),

    updateCustomerStatus

);


// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;