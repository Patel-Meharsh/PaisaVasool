// Import the User model
const User = require("../models/User");


// Register a new user
const registerUser = async (req, res) => {
    try {

        // Get the user details from the request body
        const { name, email, password } = req.body;


        // Check whether all required fields were provided
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Please provide name, email and password"
            });
        }


        // Check whether a user with this email already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User with this email already exists"
            });
        }


        // Create a new user
        const user = await User.create({
            name,
            email,
            password
        });


        // Send a successful response
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        // Handle unexpected errors
        console.error("Registration error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// Login an existing user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if email and password were provided
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // Find the user by email
        const user = await User.findOne({ email });

        // Check if user exists
        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Compare entered password with hashed password
        const isPasswordCorrect = await user.comparePassword(password);

        // Check password
        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Login successful
        res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// Export the controller function
module.exports = {
    registerUser,
    loginUser
};





