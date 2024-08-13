const mongoose = require('mongoose');

// Define el esquema del cliente
const customerSchema = new mongoose.Schema(
    {
        user: {
            type: String,
            required: true // Asegura que el campo sea obligatorio
        },
        password: {
            type: String,
            required: true // Asegura que el campo sea obligatorio
        },
        name: {
            type: String, // Tipo de dato corregido
            required: true // Asegura que el campo sea obligatorio
        },
        email: {
            type: String, // Tipo de dato corregido
            required: true // Asegura que el campo sea obligatorio
        },
        tipo_cliente: {
            type: Number, // Tipo de dato corregido
            required: true // Asegura que el campo sea obligatorio
        }
    },
    {
        timestamps: true,
        versionKey: false // Asegura que no se use la versión en el documento
    }
);

// Crea el modelo usando el esquema definido
const ModelCustomer = mongoose.model("Customer", customerSchema);

module.exports = ModelCustomer;
