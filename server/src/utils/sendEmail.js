// ============================================================
// EMAIL UTILITY
// ============================================================
// Import Nodemailer
const nodemailer = require("nodemailer");
// ============================================================
// CREATE EMAIL TRANSPORTER
// ============================================================
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    // Force IPv4
    family: 4,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});
// ============================================================
// COMMON EMAIL SENDER
// ============================================================
// This function is used by all notification emails.
// Instead of creating a new transporter for every email,
// we reuse the same transporter.
const sendEmail = async ({
    to,
    subject,
    html
}) => {
    const mailOptions = {
        from:
            `"PaisaVasool" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
    };
    await transporter.sendMail(mailOptions);
};
// ============================================================
// OTP EMAIL
// ============================================================
const sendOTPEmail = async (email, otp) => {
    await sendEmail({
        to: email,
        subject:
            "PaisaVasool Email Verification OTP",
        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: auto;
            ">
                <h2>
                    Welcome to PaisaVasool!
                </h2>
                <p>
                    Your email verification OTP is:
                </p>
                <h1>
                    ${otp}
                </h1>
                <p>
                    This OTP will expire in
                    <strong>5 minutes</strong>.
                </p>
                <p>
                    If you did not create a
                    PaisaVasool account, you can
                    ignore this email.
                </p>
                <br>
                <p>
                    Regards,<br>
                    <strong>PaisaVasool Team</strong>
                </p>
            </div>
        `
    });
};
// ============================================================
// SEND LOGIN SUCCESS EMAIL
// ============================================================
const sendLoginSuccessEmail = async (email, name) => {
    const mailOptions = {
        from: `"PaisaVasool" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Welcome Back to PaisaVasool!",
        html: `
            <div style="font-family: Arial, sans-serif;">
                <h2>Welcome back, ${name}! 👋</h2>
                <p>
                    You have successfully logged in to your
                    PaisaVasool account.
                </p>
                <p>
                    If this was not you, please secure your
                    account immediately.
                </p>
                <br>
                <p>
                    Regards,<br>
                    PaisaVasool Team
                </p>
            </div>
        `
    };
    await transporter.sendMail(mailOptions);
};
// ============================================================
// WELCOME EMAIL
// ============================================================
const sendWelcomeEmail = async (
    email,
    name
) => {
    await sendEmail({
        to: email,
        subject:
            "Welcome to PaisaVasool 🎉",
        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: auto;
            ">
                <h2>
                    Welcome to PaisaVasool, ${name}! 🎉
                </h2>
                <p>
                    Your email has been successfully
                    verified.
                </p>
                <p>
                    Your PaisaVasool account is now
                    ready to use.
                </p>
                <p>
                    You can now browse products,
                    add items to your cart and place
                    orders.
                </p>
                <br>
                <p>
                    Happy Shopping! 🛍️
                </p>
                <p>
                    Regards,<br>
                    <strong>PaisaVasool Team</strong>
                </p>
            </div>
        `
    });
};
// ============================================================
// ORDER PLACED EMAIL
// ============================================================
const sendOrderPlacedEmail = async (
    email,
    name,
    order
) => {
    const itemsHTML = order.items
        .map(item => `
            <tr>
                <td style="padding: 8px;">
                    ${item.name}
                </td>
                <td style="padding: 8px;">
                    ${item.quantity}
                </td>
                <td style="padding: 8px;">
                    ₹${item.price}
                </td>
            </tr>
        `)
        .join("");
    await sendEmail({
        to: email,
        subject:
            `PaisaVasool Order #${order._id}`,
        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 700px;
                margin: auto;
            ">
                <h2>
                    Order Placed Successfully! 🛍️
                </h2>
                <p>
                    Hi ${name},
                </p>
                <p>
                    Your PaisaVasool order has been
                    placed successfully.
                </p>
                <p>
                    <strong>Order ID:</strong>
                    ${order._id}
                </p>
                <table
                    border="1"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                        border-collapse: collapse;
                        width: 100%;
                    "
               >
                    <thead>
                        <tr>
                            <th style="padding: 8px;">
                                Product
                            </th>
                            <th style="padding: 8px;">
                                Quantity
                            </th>
                            <th style="padding: 8px;">
                                Price
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
                <h3>
                    Total: ₹${order.totalAmount}
                </h3>
                <p>
                    Payment Method:
                    <strong>
                        ${order.paymentMethod.toUpperCase()}
                    </strong>
                </p>
                <p>
                    We will keep you updated about
                    your order.
                </p>
                <br>
                <p>
                    Regards,<br>
                    <strong>PaisaVasool Team</strong>
                </p>
            </div>
        `
    });
};
// ============================================================
// ORDER SHIPPED EMAIL
// ============================================================
const sendOrderShippedEmail = async (
    email,
    name,
    order
) => {
    await sendEmail({
        to: email,
        subject:
            `Your PaisaVasool Order Has Shipped 📦`,
        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: auto;
            ">
                <h2>
                    Your Order Has Shipped! 📦
                </h2>
                <p>
                    Hi ${name},
                </p>
                <p>
                    Your PaisaVasool order
                    <strong>${order._id}</strong>
                    has been shipped.
                </p>
                <p>
                    It is now on its way to you.
                </p>
                <p>
                    <strong>Total:</strong>
                    ₹${order.totalAmount}
                </p>
                <br>
                <p>
                    Regards,<br>
                    <strong>PaisaVasool Team</strong>
                </p>
            </div>
        `
    });
};
// ============================================================
// ORDER DELIVERED EMAIL
// ============================================================
const sendOrderDeliveredEmail = async (
    email,
    name,
    order
) => {
    await sendEmail({
        to: email,
        subject:
            `Your PaisaVasool Order Was Delivered 🎉`,
        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: auto;
            ">
                <h2>
                    Order Delivered! 🎉
                </h2>
                <p>
                    Hi ${name},
                </p>
                <p>
                    Your PaisaVasool order
                    <strong>${order._id}</strong>
                    has been delivered successfully.
                </p>
                <p>
                    We hope you enjoy your purchase!
                </p>
                <p>
                    If you have any issue with the
                    product, you can request a return
                    through your PaisaVasool account.
                </p>
                <br>
                <p>
                    Regards,<br>
                    <strong>PaisaVasool Team</strong>
                </p>
            </div>
        `
    });
};
// ============================================================
// RETURN REQUESTED EMAIL
// ============================================================
const sendReturnRequestedEmail = async (
    email,
    name,
    order
) => {
    await sendEmail({
        to: email,
        subject:
            `Return Request Received - ${order._id}`,
        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: auto;
            ">
                <h2>
                    Return Request Received 🔄
                </h2>
                <p>
                    Hi ${name},
                </p>
                <p>
                    We have received your return
                    request for order:
                </p>
                <p>
                    <strong>${order._id}</strong>
                </p>
                <p>
                    <strong>Reason:</strong>
                    ${order.returnReason}
                </p>
                <p>
                    Our team will review your request
                    and update you shortly.
                </p>
                <br>
                <p>
                    Regards,<br>
                    <strong>PaisaVasool Team</strong>
                </p>
            </div>
        `
    });
};
// ============================================================
// RETURN APPROVED EMAIL
// ============================================================
const sendReturnApprovedEmail = async (
    email,
    name,
    order
) => {
    await sendEmail({
        to: email,
        subject:
            `Return Approved - ${order._id}`,
        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: auto;
            ">
                <h2>
                    Return Request Approved ✅
                </h2>
                <p>
                    Hi ${name},
                </p>
                <p>
                    Your return request for order
                    <strong>${order._id}</strong>
                    has been approved.
                </p>
                <p>
                    Your return will now be processed
                    according to our return procedure.
                </p>
                <p>
                    Refund information will be shared
                    once the refund is processed.
                </p>
                <br>
                <p>
                    Regards,<br>
                    <strong>PaisaVasool Team</strong>
                </p>
            </div>
        `
    });
};
// ============================================================
// RETURN REJECTED EMAIL
// ============================================================
const sendReturnRejectedEmail = async (
    email,
    name,
    order
) => {
    await sendEmail({
        to: email,
        subject:
            `Return Request Update - ${order._id}`,
        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: auto;
            ">
                <h2>
                    Return Request Update
                </h2>
                <p>
                    Hi ${name},
                </p>
                <p>
                    Unfortunately, your return request
                    for order
                    <strong>${order._id}</strong>
                    has been rejected.
                </p>
                <p>
                    If you believe this was a mistake,
                    please contact PaisaVasool support.
                </p>
                <br>
                <p>
                    Regards,<br>
                    <strong>PaisaVasool Team</strong>
                </p>
            </div>
        `
    });
};
// ============================================================
// REFUND EMAIL
// ============================================================
// We are creating this now so Razorpay refund
// can use it later.
// Batch 1 will connect the actual Razorpay refund
// process to this function.
const sendRefundEmail = async (
    email,
    name,
    order,
    refund
) => {
    await sendEmail({
        to: email,
        subject:
            `Refund Processed - ${order._id}`,
        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: auto;
            ">
                <h2>
                    Refund Processed 💰
                </h2>
                <p>
                    Hi ${name},
                </p>
                <p>
                    Your refund for order
                    <strong>${order._id}</strong>
                    has been processed successfully.
                </p>
                <p>
                    <strong>Refund ID:</strong>
                    ${refund?.id || "Processing"}
                </p>
                <p>
                    <strong>Amount:</strong>
                    ₹${order.totalAmount}
                </p>
                <p>
                    The refund will be credited according
                    to your payment provider's processing
                    time.
                </p>
                <br>
                <p>
                    Regards,<br>
                    <strong>PaisaVasool Team</strong>
                </p>
            </div>
        `
    });
};
// ============================================================
// PRICE DROP ALERT EMAIL
// ============================================================
const sendPriceDropAlertEmail = async (
    email,
    name,
    product,
    oldPrice,
    newPrice
) => {
    await sendEmail({
        to: email,
        subject:
            `Price Drop Alert - ${product.name} 🔥`,
        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: auto;
            ">
                <h2>
                    Price Drop Alert! 🔥
                </h2>
                <p>
                    Hi ${name},
                </p>
                <p>
                    Great news! The price of a product
                    you're interested in has dropped.
                </p>
                <h3>
                    ${product.name}
                </h3>
                <p>
                    <strong>Previous Price:</strong>
                    ₹${oldPrice}
                </p>
                <p>
                    <strong>New Price:</strong>
                    ₹${newPrice}
                </p>
                <p>
                    You can now get this product at
                    a lower price on PaisaVasool.
                </p>
                <br>
                <p>
                    Happy Shopping! 🛍️
                </p>
                <p>
                    Regards,<br>
                    <strong>PaisaVasool Team</strong>
                </p>
            </div>
        `
    });
};
// ============================================================
// EXPORT
// ============================================================
module.exports = {
    sendOTPEmail,
    sendLoginSuccessEmail,
    sendWelcomeEmail,
    sendOrderPlacedEmail,
    sendOrderShippedEmail,
    sendOrderDeliveredEmail,
    sendReturnRequestedEmail,
    sendReturnApprovedEmail,
    sendReturnRejectedEmail,
    sendRefundEmail,
    sendPriceDropAlertEmail
};