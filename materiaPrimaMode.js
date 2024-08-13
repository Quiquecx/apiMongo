const mongoose = require('mongoose');

const materiaPrimaSchema = new mongoose.Schema({
  materiaPrima: {
    type: String,
    required: true
  },
  fechaRecepcion: {
    type: Date,
    required: true
  },
  cantidadRecibida: {
    type: Number,
    required: true
  },
  cantidadDisponible: {
    type: Number, // Agrega este campo para el seguimiento del inventario disponible
    required: true,
    default: 0
  },
  numeroLote: {
    type: String,
    required: true
  },
  fechaCaducidad: {
    type: Date,
    required: true
  }
});

const materialPrima = mongoose.model('materialPrima', materiaPrimaSchema);

module.exports = materialPrima;