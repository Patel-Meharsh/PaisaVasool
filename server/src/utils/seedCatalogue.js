const Product = require("../models/Product");
const Category = require("../models/Category");

const IMAGE = {
    phone: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=640&q=70",
    phone2: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=640&q=70",
    phone3: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=640&q=70",
    clothing: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=640&q=70",
    pants: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=640&q=70",
    fashion: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=640&q=70",
    tv: "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=640&q=70",
    headphones: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=640&q=70",
    headphones2: "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=640&q=70",
    speaker: "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=640&q=70",
    homeTech: "https://images.unsplash.com/photo-1565182999561-18d7dc61c393?auto=format&fit=crop&w=640&q=70"
};

const makeProduct = (name, description, price, stock, brand, category, subcategory, image) => ({
    name,
    description,
    price,
    stock,
    brand,
    category,
    subcategory,
    images: [image],
    isActive: true
});

async function ensureCategory(name, description) {
    return Category.findOneAndUpdate(
        { name },
        {
            $setOnInsert: {
                name,
                description,
                isActive: true
            }
        },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
        }
    );
}

async function seedCatalogue() {
    const electronics = await ensureCategory(
        "Electronics",
        "Smartphones, televisions, air conditioners and personal audio devices."
    );

    const clothing = await ensureCategory(
        "Clothing",
        "Everyday fashion across shirts, pants, T-shirts and tops."
    );

    const products = [];

    const addGroup = (items, category, subcategory, description, imagePicker) => {
        items.forEach(([name, brand, price], index) => {
            products.push(
                makeProduct(
                    name,
                    `${brand} ${description}.`,
                    price,
                    12 + (index % 15),
                    brand,
                    category._id,
                    subcategory,
                    imagePicker(index)
                )
            );
        });
    };

    addGroup(
        [
            ["Levi's 501 Original Fit Jeans", "Levi's", 3299],
            ["Wrangler Slim Taper Jeans", "Wrangler", 2799],
            ["Lee Comfort Straight Jeans", "Lee", 2499],
            ["Roadster Cargo Pants", "Roadster", 1699],
            ["U.S. Polo Assn. Chinos", "U.S. Polo Assn.", 2299],
            ["Jack & Jones Stretch Trousers", "Jack & Jones", 2999],
            ["H&M Relaxed Fit Pants", "H&M", 1999],
            ["Van Heusen Formal Trousers", "Van Heusen", 2499],
            ["Peter England Slim Fit Trousers", "Peter England", 2199],
            ["Allen Solly Smart Fit Pants", "Allen Solly", 2399]
        ],
        clothing,
        "Pants",
        "premium pants designed for everyday comfort and versatile styling",
        index => index % 2 ? IMAGE.fashion : IMAGE.pants
    );

    addGroup(
        [
            ["Van Heusen Premium Oxford Shirt", "Van Heusen", 2299],
            ["Louis Philippe Cotton Shirt", "Louis Philippe", 2799],
            ["Allen Solly Slim Fit Shirt", "Allen Solly", 1999],
            ["U.S. Polo Assn. Casual Shirt", "U.S. Polo Assn.", 2199],
            ["Peter England Linen Shirt", "Peter England", 1899],
            ["Levi's Western Denim Shirt", "Levi's", 2999],
            ["H&M Regular Fit Shirt", "H&M", 1699],
            ["Jack & Jones Checked Shirt", "Jack & Jones", 2399],
            ["Roadster Casual Overshirt", "Roadster", 1599],
            ["Arrow Easy Care Formal Shirt", "Arrow", 2499]
        ],
        clothing,
        "Shirts",
        "comfortable shirts suitable for work and casual wear",
        index => index % 2 ? IMAGE.fashion : IMAGE.clothing
    );

    addGroup(
        [
            ["Nike Sportswear Club T-Shirt", "Nike", 1999],
            ["Adidas Essentials Logo T-Shirt", "Adidas", 1799],
            ["Puma Essentials Tee", "Puma", 1499],
            ["Levi's Graphic T-Shirt", "Levi's", 1699],
            ["H&M Oversized T-Shirt", "H&M", 999],
            ["Roadster Printed T-Shirt", "Roadster", 799],
            ["Jack & Jones Basic Tee", "Jack & Jones", 1299],
            ["U.S. Polo Assn. Solid T-Shirt", "U.S. Polo Assn.", 1599],
            ["Bewakoof Oversized Graphic Tee", "Bewakoof", 899],
            ["HRX Training T-Shirt", "HRX", 1199]
        ],
        clothing,
        "T-Shirts",
        "everyday T-shirts made for comfort and casual styling",
        index => index % 3 ? IMAGE.clothing : IMAGE.fashion
    );

    addGroup(
        [
            ["Zara Relaxed Ribbed Top", "Zara", 1999],
            ["H&M Soft Knit Top", "H&M", 1499],
            ["Mango Satin Finish Top", "Mango", 2499],
            ["ONLY Printed Casual Top", "ONLY", 1599],
            ["Vero Moda Textured Top", "Vero Moda", 1799],
            ["Forever New Draped Top", "Forever New", 3299],
            ["FabAlley Pleated Top", "FabAlley", 1399],
            ["W for Embroidered Top", "W", 1899],
            ["Libas Straight Fit Top", "Libas", 1299],
            ["AND Premium Casual Top", "AND", 2199]
        ],
        clothing,
        "Tops",
        "contemporary tops with comfortable fits and versatile styling",
        index => index % 2 ? IMAGE.clothing : IMAGE.fashion
    );

    addGroup(
        [
            ["vivo X300 Ultra", "vivo", 159999],
            ["Xiaomi 17 Ultra", "Xiaomi", 139999],
            ["Samsung Galaxy S26 Ultra", "Samsung", 122999],
            ["Google Pixel 11", "Google", 104999],
            ["Google Pixel 11 Pro", "Google", 119999],
            ["Google Pixel 11 Pro XL", "Google", 149999],
            ["Google Pixel 11 Pro Fold", "Google", 186999],
            ["Samsung Galaxy Z Fold 8 Ultra", "Samsung", 194999],
            ["Samsung Galaxy Z Flip 8 5G", "Samsung", 119999],
            ["OnePlus N6x 5G", "OnePlus", 39999]
        ],
        electronics,
        "Smartphones",
        "flagship smartphone for the August 2026 catalogue",
        index => [IMAGE.phone, IMAGE.phone2, IMAGE.phone3][index % 3]
    );

    addGroup(
        [
            ["Sony Bravia 55-inch 4K OLED Smart TV", "Sony", 139990],
            ["LG 55-inch evo AI 4K OLED TV", "LG", 129990],
            ["Samsung 65-inch Neo QLED 4K Smart TV", "Samsung", 154990],
            ["OnePlus 55-inch Q1 Series 4K TV", "OnePlus", 49999],
            ["TCL 65-inch C8K Mini LED 4K TV", "TCL", 89999]
        ],
        electronics,
        "Televisions",
        "smart television with a large 4K display and streaming features",
        () => IMAGE.tv
    );

    addGroup(
        [
            ["Daikin 1.5 Ton 5 Star Inverter Split AC", "Daikin", 46990],
            ["LG 1.5 Ton 5 Star Dual Inverter AC", "LG", 44990],
            ["Samsung 1.5 Ton 5 Star WindFree AC", "Samsung", 49990],
            ["Voltas 1.5 Ton 5 Star Adjustable Inverter AC", "Voltas", 38990],
            ["Panasonic 1.5 Ton 5 Star Smart Inverter AC", "Panasonic", 41990]
        ],
        electronics,
        "Air Conditioners",
        "energy-efficient inverter split air conditioner for comfortable home cooling",
        () => IMAGE.homeTech
    );

    addGroup(
        [
            ["Sony WH-1000XM6 Noise Cancelling Headphones", "Sony", 34990],
            ["Bose QuietComfort Ultra Headphones", "Bose", 35900],
            ["JBL Tour One M3 Wireless Headphones", "JBL", 24999],
            ["Sennheiser Momentum 4 Wireless", "Sennheiser", 29990]
        ],
        electronics,
        "Headphones",
        "wireless over-ear headphones with premium sound and active noise cancellation",
        index => index % 2 ? IMAGE.headphones2 : IMAGE.headphones
    );

    addGroup(
        [
            ["JBL Charge 6 Portable Bluetooth Speaker", "JBL", 17999],
            ["Sony ULT Field 7 Wireless Speaker", "Sony", 39990],
            ["Bose SoundLink Max Portable Speaker", "Bose", 34900],
            ["Marshall Kilburn III Bluetooth Speaker", "Marshall", 32999]
        ],
        electronics,
        "Speakers",
        "portable Bluetooth speaker designed for powerful wireless audio",
        () => IMAGE.speaker
    );

    const operations = products.map(item => ({
        updateOne: {
            filter: { name: item.name },
            update: { $setOnInsert: item },
            upsert: true
        }
    }));

    const result = await Product.bulkWrite(operations, {
        ordered: false
    });

    console.log(
        `Catalogue seed complete: ${products.length} requested, ${result.upsertedCount} inserted.`
    );

    return result;
}

module.exports = seedCatalogue;
