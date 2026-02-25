const mongoose = require("mongoose");

const historiqueBoxSchema = new mongoose.Schema({
    boxId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Box",
        required: true,
        index: true
    },

    ancienStatut: {
        type: String,
        enum: ["AVAILABLE", "PENDING", "OCCUPIED"],
        default: "AVAILABLE",
        index: true
    },

    nouveauStatut: {
        type: String,
        enum: ["AVAILABLE", "PENDING", "OCCUPIED"],
        default: "AVAILABLE",
        index: true 
    },

    boutiqueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Boutique"
    },

    changedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("HistoriqueBox", historiqueBoxSchema);