const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        cliente: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        estado: {
            type: Number,
            required: true
        },
        direccion: {
            type: String,
            required: true
        },
        total: {
            type: Number,
            required: true
        },
        // Agregado para los productos en la orden
        productos: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true
                },
                cantidad: {
                    type: Number,
                    required: true
                }
            }
        ]
    },
    {
        timestamps: true,
        versionKey: false
    }
);

const ModelOrder = mongoose.model('Order', orderSchema);

module.exports = ModelOrder;
