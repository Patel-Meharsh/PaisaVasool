// Import User model
const User = require("../models/User");


// ============================================================
// GET ALL CUSTOMERS
// ============================================================

// Get all customers for the admin panel
const getAllCustomers = async (req, res) => {

    try {

        // ----------------------------------------------------
        // Find all customers
        // ----------------------------------------------------

        const customers = await User.find(
            {
                role: "customer"
            },

            {
                password: 0
            }

        ).sort({
            createdAt: -1
        });


        // ----------------------------------------------------
        // Send response
        // ----------------------------------------------------

        res.status(200).json({

            message:
                "Customers fetched successfully",

            customers

        });


    } catch (error) {

        console.error(
            "Get all customers error:",
            error.message
        );


        res.status(500).json({

            message:
                "Server error"

        });

    }

};


// ============================================================
// UPDATE CUSTOMER STATUS
// ============================================================

// Activate or deactivate a customer
const updateCustomerStatus = async (req, res) => {

    try {

        // ----------------------------------------------------
        // Get customer ID
        // ----------------------------------------------------

        const { id } = req.params;


        // ----------------------------------------------------
        // Get new status
        // ----------------------------------------------------

        const { isActive } = req.body;


        // ----------------------------------------------------
        // Validate status
        // ----------------------------------------------------

        if (typeof isActive !== "boolean") {

            return res.status(400).json({

                message:
                    "isActive must be true or false"

            });

        }


        // ----------------------------------------------------
        // Find customer
        // ----------------------------------------------------

        const customer =
            await User.findOne({

                _id: id,

                role: "customer"

            });


        // ----------------------------------------------------
        // Customer not found
        // ----------------------------------------------------

        if (!customer) {

            return res.status(404).json({

                message:
                    "Customer not found"

            });

        }


        // ----------------------------------------------------
        // Update status
        // ----------------------------------------------------

        customer.isActive =
            isActive;


        await customer.save();


        // ----------------------------------------------------
        // Send updated customer
        // ----------------------------------------------------

        res.status(200).json({

            message:
                isActive
                    ? "Customer activated successfully"
                    : "Customer deactivated successfully",

            customer: {

                _id:
                    customer._id,

                name:
                    customer.name,

                email:
                    customer.email,

                role:
                    customer.role,

                isEmailVerified:
                    customer.isEmailVerified,

                isActive:
                    customer.isActive,

                createdAt:
                    customer.createdAt

            }

        });


    } catch (error) {

        console.error(
            "Update customer status error:",
            error.message
        );


        res.status(500).json({

            message:
                "Server error"

        });

    }

};


// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {

    getAllCustomers,

    updateCustomerStatus

};