// ============================================================
// IMAGE DELIVERY HELPER
// ============================================================
// Keep catalogue images lightweight so adding many products does
// not make the Products page download unnecessarily large files.

export function getOptimizedImageUrl(
    imageUrl,
    width = 640
) {
    if (!imageUrl) {
        return "";
    }

    // ------------------------------------------------------------
    // CLOUDINARY
    // ------------------------------------------------------------

    if (
        imageUrl.includes("res.cloudinary.com") &&
        imageUrl.includes("/upload/")
    ) {
        if (
            imageUrl.includes("f_auto") ||
            imageUrl.includes("q_auto")
        ) {
            return imageUrl;
        }

        return imageUrl.replace(
            "/upload/",
            `/upload/c_limit,w_${width}/f_auto/q_auto/`
        );
    }

    // ------------------------------------------------------------
    // UNSPLASH
    // ------------------------------------------------------------
    // Unsplash supports server-side resizing, automatic format
    // selection and quality control through query parameters.

    if (imageUrl.includes("images.unsplash.com")) {
        try {
            const url = new URL(imageUrl);

            url.searchParams.set("auto", "format");
            url.searchParams.set("fit", "crop");
            url.searchParams.set("w", String(width));
            url.searchParams.set("q", "70");

            return url.toString();
        } catch {
            return imageUrl;
        }
    }

    return imageUrl;
}
