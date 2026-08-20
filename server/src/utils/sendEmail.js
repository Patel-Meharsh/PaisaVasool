// ============================================================
// PAISAVASOOL EMAIL UTILITY
// ============================================================
// Transactional emails are sent through Resend's HTTPS API.
// This avoids SMTP connections, which are blocked on Render's
// Free web services.

const RESEND_API_URL = "https://api.resend.com/emails";

const escapeHtml = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");

const sendEmail = async ({
    to,
    subject,
    html,
    tag
}) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from =
        process.env.EMAIL_FROM ||
        process.env.EMAIL_USER ||
        "PaisaVasool <onboarding@resend.dev>";

    if (!apiKey) {
        throw new Error(
            "RESEND_API_KEY is not configured"
        );
    }

    const response = await fetch(
        RESEND_API_URL,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from,
                to: [to],
                subject,
                html,
                ...(tag
                    ? {
                        tags: [
                            {
                                name: "type",
                                value: tag
                            }
                        ]
                    }
                    : {})
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data?.message ||
            data?.error?.message ||
            "Email API request failed"
        );
    }

    return data;
};

// ============================================================
// EMAIL VERIFICATION OTP
// ============================================================

const sendOTPEmail = async (email, otp) => {
    return sendEmail({
        to: email,
        subject: "PaisaVasool Email Verification OTP",
        tag: "email_verification",
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                <h2>Welcome to PaisaVasool!</h2>
                <p>Your email verification OTP is:</p>
                <h1>${escapeHtml(otp)}</h1>
                <p>This OTP will expire in <strong>5 minutes</strong>.</p>
                <p>If you did not create a PaisaVasool account, you can ignore this email.</p>
                <p>Regards,<br><strong>PaisaVasool Team</strong></p>
            </div>
        `
    });
};

// ============================================================
// PASSWORD RESET OTP
// ============================================================

const sendPasswordResetOTPEmail = async (email, otp) => {
    return sendEmail({
        to: email,
        subject: "PaisaVasool Password Reset OTP",
        tag: "password_reset",
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                <h2>Password Reset Request</h2>
                <p>We received a request to reset your PaisaVasool account password.</p>
                <p>Your password reset OTP is:</p>
                <h1>${escapeHtml(otp)}</h1>
                <p>This OTP will expire in <strong>5 minutes</strong>.</p>
                <p>If you did not request a password reset, you can safely ignore this email.</p>
                <p>Regards,<br><strong>PaisaVasool Team</strong></p>
            </div>
        `
    });
};

// ============================================================
// LOGIN SUCCESS
// ============================================================

const sendLoginSuccessEmail = async (email, name) => {
    return sendEmail({
        to: email,
        subject: "Welcome Back to PaisaVasool!",
        tag: "login_success",
        html: `
            <div style="font-family:Arial,sans-serif">
                <h2>Welcome back, ${escapeHtml(name)}!</h2>
                <p>You have successfully logged in to your PaisaVasool account.</p>
                <p>If this was not you, please secure your account immediately.</p>
                <p>Regards,<br>PaisaVasool Team</p>
            </div>
        `
    });
};

// ============================================================
// WELCOME EMAIL
// ============================================================

const sendWelcomeEmail = async (email, name) => {
    return sendEmail({
        to: email,
        subject: "Welcome to PaisaVasool!",
        tag: "welcome",
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                <h2>Welcome to PaisaVasool, ${escapeHtml(name)}!</h2>
                <p>Your email has been successfully verified.</p>
                <p>Your PaisaVasool account is now ready to use.</p>
                <p>You can now browse products, add items to your cart and place orders.</p>
                <p>Happy Shopping!</p>
                <p>Regards,<br><strong>PaisaVasool Team</strong></p>
            </div>
        `
    });
};

// ============================================================
// ORDER PLACED EMAIL
// ============================================================

const sendOrderPlacedEmail = async (email, name, order) => {
    const itemsHTML = (order?.items || [])
        .map(item => `
            <tr>
                <td style="padding:8px">${escapeHtml(item.name)}</td>
                <td style="padding:8px">${escapeHtml(item.quantity)}</td>
                <td style="padding:8px">₹${escapeHtml(item.price)}</td>
            </tr>
        `)
        .join("");

    return sendEmail({
        to: email,
        subject: `PaisaVasool Order #${escapeHtml(order?._id)}`,
        tag: "order_placed",
        html: `
            <div style="font-family:Arial,sans-serif;max-width:700px;margin:auto">
                <h2>Order Placed Successfully!</h2>
                <p>Hi ${escapeHtml(name)},</p>
                <p>Your PaisaVasool order has been placed successfully.</p>
                <p><strong>Order ID:</strong> ${escapeHtml(order?._id)}</p>
                <table border="1" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%">
                    <thead>
                        <tr>
                            <th style="padding:8px">Product</th>
                            <th style="padding:8px">Quantity</th>
                            <th style="padding:8px">Price</th>
                        </tr>
                    </thead>
                    <tbody>${itemsHTML}</tbody>
                </table>
                <h3>Total: ₹${escapeHtml(order?.totalAmount)}</h3>
                <p>Payment Method: <strong>${escapeHtml(order?.paymentMethod || "").toUpperCase()}</strong></p>
                <p>We will keep you updated about your order.</p>
                <p>Regards,<br><strong>PaisaVasool Team</strong></p>
            </div>
        `
    });
};

// ============================================================
// ORDER SHIPPED EMAIL
// ============================================================

const sendOrderShippedEmail = async (email, name, order) => {
    return sendEmail({
        to: email,
        subject: "Your PaisaVasool Order Has Shipped",
        tag: "order_shipped",
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                <h2>Your Order Has Shipped!</h2>
                <p>Hi ${escapeHtml(name)},</p>
                <p>Your PaisaVasool order <strong>${escapeHtml(order?._id)}</strong> has been shipped.</p>
                <p>Total: ₹${escapeHtml(order?.totalAmount)}</p>
                <p>Regards,<br><strong>PaisaVasool Team</strong></p>
            </div>
        `
    });
};

// ============================================================
// ORDER DELIVERED EMAIL
// ============================================================

const sendOrderDeliveredEmail = async (email, name, order) => {
    return sendEmail({
        to: email,
        subject: "Your PaisaVasool Order Was Delivered",
        tag: "order_delivered",
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                <h2>Order Delivered!</h2>
                <p>Hi ${escapeHtml(name)},</p>
                <p>Your PaisaVasool order <strong>${escapeHtml(order?._id)}</strong> has been delivered successfully.</p>
                <p>We hope you enjoy your purchase!</p>
                <p>Regards,<br><strong>PaisaVasool Team</strong></p>
            </div>
        `
    });
};

// ============================================================
// RETURN REQUESTED EMAIL
// ============================================================

const sendReturnRequestedEmail = async (email, name, order) => {
    return sendEmail({
        to: email,
        subject: `Return Request Received - ${escapeHtml(order?._id)}`,
        tag: "return_requested",
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                <h2>Return Request Received</h2>
                <p>Hi ${escapeHtml(name)},</p>
                <p>We have received your return request for order <strong>${escapeHtml(order?._id)}</strong>.</p>
                <p><strong>Reason:</strong> ${escapeHtml(order?.returnReason)}</p>
                <p>Our team will review your request and update you shortly.</p>
                <p>Regards,<br><strong>PaisaVasool Team</strong></p>
            </div>
        `
    });
};

// ============================================================
// RETURN APPROVED EMAIL
// ============================================================

const sendReturnApprovedEmail = async (email, name, order) => {
    return sendEmail({
        to: email,
        subject: `Return Approved - ${escapeHtml(order?._id)}`,
        tag: "return_approved",
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                <h2>Return Request Approved</h2>
                <p>Hi ${escapeHtml(name)},</p>
                <p>Your return request for order <strong>${escapeHtml(order?._id)}</strong> has been approved.</p>
                <p>Refund information will be shared once the refund is processed.</p>
                <p>Regards,<br><strong>PaisaVasool Team</strong></p>
            </div>
        `
    });
};

// ============================================================
// RETURN REJECTED EMAIL
// ============================================================

const sendReturnRejectedEmail = async (email, name, order) => {
    return sendEmail({
        to: email,
        subject: `Return Request Update - ${escapeHtml(order?._id)}`,
        tag: "return_rejected",
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                <h2>Return Request Update</h2>
                <p>Hi ${escapeHtml(name)},</p>
                <p>Your return request for order <strong>${escapeHtml(order?._id)}</strong> has been rejected.</p>
                <p>If you believe this was a mistake, please contact PaisaVasool support.</p>
                <p>Regards,<br><strong>PaisaVasool Team</strong></p>
            </div>
        `
    });
};

// ============================================================
// REFUND EMAIL
// ============================================================

const sendRefundEmail = async (email, name, order, refund) => {
    return sendEmail({
        to: email,
        subject: `Refund Processed - ${escapeHtml(order?._id)}`,
        tag: "refund_processed",
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                <h2>Refund Processed</h2>
                <p>Hi ${escapeHtml(name)},</p>
                <p>Your refund for order <strong>${escapeHtml(order?._id)}</strong> has been processed successfully.</p>
                <p><strong>Refund ID:</strong> ${escapeHtml(refund?.id || "Processing")}</p>
                <p><strong>Amount:</strong> ₹${escapeHtml(order?.totalAmount)}</p>
                <p>The refund will be credited according to your payment provider's processing time.</p>
                <p>Regards,<br><strong>PaisaVasool Team</strong></p>
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
    const currentPrice =
        newPrice !== undefined
            ? newPrice
            : product?.price;

    return sendEmail({
        to: email,
        subject: `Price Drop Alert - ${escapeHtml(product?.name)}!`,
        tag: "price_drop_alert",
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                <h2>Price Drop Alert!</h2>
                <p>Hi ${escapeHtml(name)},</p>
                <p>The price of a product you're interested in has dropped.</p>
                <h3>${escapeHtml(product?.name)}</h3>
                <p><strong>Previous Price:</strong> ₹${escapeHtml(oldPrice)}</p>
                <p><strong>Current Price:</strong> ₹${escapeHtml(currentPrice)}</p>
                <p>Check the product on PaisaVasool before the price changes again.</p>
                <p>Regards,<br><strong>PaisaVasool Team</strong></p>
            </div>
        `
    });
};

module.exports = {
    sendOTPEmail,
    sendPasswordResetOTPEmail,
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
