const mongoose = require("mongoose");

const centreCommercialSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        CmSlug: {
            type: String,
            unique: true,
            lowercase: true,
            index: true
        },

        description: {
            type: String
        },

        address: {
            country: {
                type: String,
                default: "Madagascar"
            },
            city: String,
            lot: String,
        },

        contact: {
            phone: String,
            email: String,
            website: String
        },

        socialLinks: {
            facebook: String,
            instagram: String,
            tiktok: String
        },

        configuration: {
            max_promo_per_boutique: {
                type: Number,
                default: 3
            },

            min_promo_duration_in_days: {
                type: Number,
                default: 2
            },

            max_promo_duration_in_days: {
                type: Number,
                default: 30
            }
        },

        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE"],
            default: "ACTIVE"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("CentreCommercial", centreCommercialSchema);