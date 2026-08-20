// ============================================================
// IMAGE DELIVERY HELPER
// ============================================================
// Cloudinary images can be resized and automatically converted
// to an efficient browser format before delivery. Other image
// providers are returned unchanged.

export function getOptimizedImageUrl(
    imageUrl,
    width = 640
) {
    if (!imageUrl) {
        return "";
    }

    if (!imageUrl.includes("res.cloudinary.com")) {
        return imageUrl;
    }

    if (!imageUrl.includes("/upload/")) {
        return imageUrl;
    }

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
