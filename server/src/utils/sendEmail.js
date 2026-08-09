const nodemailer = require("nodemailer");


// Create email transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});


// Send OTP email
const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: `"PaisaVasool" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "PaisaVasool Email Verification OTP",

        html: `
            <div style="font-family: Arial, sans-serif;">
                <h2>Welcome to PaisaVasool!</h2>

                <p>Your email verification OTP is:</p>

                <h1>${otp}</h1>

                <p>This OTP will expire in <strong>5 minutes</strong>.</p>

                <p>If you did not create a PaisaVasool account, you can ignore this email.</p>

                <br>

                <p>Regards,<br>
                PaisaVasool Team</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};


module.exports = {
    sendOTPEmail
};