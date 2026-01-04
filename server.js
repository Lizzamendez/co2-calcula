
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.'))); // Servir archivos estáticos (HTML, CSS, JS)

// --- BASE DE DATOS SIMULADA (Factores de Emisión) ---
const TRANSPORT_DATA = {
  carro:  { factor: 0.19, isPublic: false, label: "Carro" },
  moto:   { factor: 0.10, isPublic: false, label: "Motocicleta" },
  onibus: { factor: 0.04, isPublic: true, label: "Ônibus" },
  aviao:  { factor: 0.25, isPublic: true, label: "Avião (Curta)" },
  trem:   { factor: 0.03, isPublic: true, label: "Trem / Metrô" },
  bike_electric: { factor: 0.008, isPublic: false, label: "Bike Elétrica" }
};

// --- API ENDPOINTS ---

// GET /api/transports
// Devuelve la lista de transportes disponibles para llenar el select
app.get('/api/transports', (req, res) => {
  res.json(TRANSPORT_DATA);
});

// POST /api/calculate
// Recibe: { distance, transport, passengers, isRoundTrip }
// Devuelve: { emissions, trees, comparisonData, breakdown }
app.post('/api/calculate', (req, res) => {
  try {
    console.log(`📩 Cálculo solicitado: ${req.body.transport}, ${req.body.distance}km`);
    const { distance, transport, passengers, isRoundTrip } = req.body;

    // Validación básica
    if (!distance || distance < 0) {
      return res.status(400).json({ error: 'Distancia inválida' });
    }
    if (!TRANSPORT_DATA[transport]) {
      return res.status(400).json({ error: 'Transporte no válido' });
    }

    const data = TRANSPORT_DATA[transport];
    const totalDist = distance * (isRoundTrip ? 2 : 1);
    const numPassengers = passengers || 1;

    // 1. Cálculo Principal
    let totalEmissions = 0;
    let baseEmission = 0;

    if (data.isPublic) {
      // Transporte público: factor * distancia * pasajeros
      totalEmissions = totalDist * data.factor * numPassengers;
      baseEmission = totalDist * data.factor; // Emisión de 1 persona
    } else {
      // Transporte privado: factor * distancia (el vehículo emite lo mismo vayan 1 o 4)
      totalEmissions = totalDist * data.factor;
      baseEmission = totalEmissions; // Todo es base del vehículo
    }

    // 2. Datos para Comparación (Gráfico de Barras)
    const comparisonData = {};
    for (const [type, info] of Object.entries(TRANSPORT_DATA)) {
      comparisonData[type] = info.isPublic 
        ? (totalDist * info.factor * numPassengers) 
        : (totalDist * info.factor);
    }

    // 3. Datos para Desglose (Gráfico de Rosca)
    const extraEmission = Math.max(0, totalEmissions - baseEmission);

    res.json({
      success: true,
      emissions: totalEmissions,
      trees: totalEmissions / 22, // 1 árbol absorbe ~22kg/año
      comparisonData,
      breakdown: { base: baseEmission, extra: extraEmission }
    });

  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
