let myChart = null;
let myPieChart = null;

document.addEventListener('DOMContentLoaded', () => {
  // Carregar a última seleção de transporte salva
  const lastTransport = localStorage.getItem('lastTransport');
  if (lastTransport) {
    document.getElementById('transport').value = lastTransport;
  }
});

document.getElementById('calcForm').addEventListener('reset', () => {
  // Ocultar resultados, comparações e gráfico ao limpar
  document.getElementById('result').classList.remove('show');
  document.getElementById('comparison').classList.add('hidden');
  document.getElementById('chartSection').classList.add('hidden');
  document.getElementById('downloadBtn').classList.add('hidden');

  if (myChart) {
    myChart.destroy();
    myChart = null;
  }
  if (myPieChart) {
    myPieChart.destroy();
    myPieChart = null;
  }
});

document.getElementById('calcForm').addEventListener('submit', function(e) {
  e.preventDefault();

  // 1. Obter valores
  const distance = parseFloat(document.getElementById('distance').value);
  const passengers = parseInt(document.getElementById('passengers').value) || 1;
  const transport = document.getElementById('transport').value;
  const isRoundTrip = document.getElementById('roundTrip').checked;

  // Salvar a seleção atual no LocalStorage
  localStorage.setItem('lastTransport', transport);

  if (isNaN(distance) || distance <= 0) {
    alert("Por favor, insira uma distância válida.");
    return;
  }

  // 2. Fatores de Emissão (kg CO2 por km) - Estimativas médias
  let factor = 0;
  let isPublic = false;

  switch(transport) {
    case 'carro': factor = 0.19; break; // ~190g/km por veículo
    case 'moto': factor = 0.10; break;  // ~100g/km por veículo
    case 'onibus': factor = 0.04; isPublic = true; break; // ~40g/km por passageiro
    case 'aviao': factor = 0.25; isPublic = true; break;  // ~250g/km por passageiro (voos curtos)
    case 'trem': factor = 0.03; isPublic = true; break;   // ~30g/km por passageiro
  }

  // 3. Cálculo
  let totalDist = distance * (isRoundTrip ? 2 : 1);
  let totalEmissions = 0;

  if (isPublic) {
    // No transporte público, o fator costuma ser "por passageiro"
    totalEmissions = totalDist * factor * passengers;
  } else {
    // No transporte privado, a emissão é do veículo.
    // Se 4 pessoas viajarem em um carro, a emissão TOTAL é a mesma,
    // mas aqui calculamos o impacto total gerado pela viagem.
    totalEmissions = totalDist * factor;
  }

  // 4. Mostrar Resultados com Animação
  const resultEl = document.getElementById('result');
  const comparisonEl = document.getElementById('comparison');
  const treeContainer = document.getElementById('tree-equivalent');
  
  // Reiniciar animación del bloque
  resultEl.classList.remove('show');
  void resultEl.offsetWidth; // Trigger reflow
  resultEl.classList.add('show');

  // Texto base
  resultEl.innerHTML = `
    Emissão Total: <strong id="emissionValue">0.00</strong> <strong>kg CO₂</strong><br>
    <span style="font-size:0.85em; font-weight:normal; opacity:0.8">
      (${totalDist} km ${isRoundTrip ? 'ida e volta' : ''}, ${passengers} pass.)
    </span>
  `;

  // Animar o número (efeito contador)
  animateValue(document.getElementById('emissionValue'), 0, totalEmissions, 1000);

  // Efeito de confete se o impacto for baixo (< 1kg)
  if (totalEmissions < 1) {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#16a34a', '#4ade80', '#bbf7d0', '#ffffff'] // Tonos verdes ecológicos
    });
  }

  // 5. Lógica das Árvores (Fator WOW)
  // Uma árvore madura absorve ~22kg de CO2 por ano.
  comparisonEl.classList.remove('hidden');
  treeContainer.innerHTML = ''; // Limpiar anterior

  const treesNeeded = totalEmissions / 22; 
  // Mostrar hasta 10 árboles visualmente para no saturar
  const visualTrees = Math.min(Math.ceil(treesNeeded), 10);
  
  let explanation = `Isso equivale ao trabalho de <strong>${treesNeeded.toFixed(2)} árvores</strong> em um ano.`;
  if(treesNeeded < 0.1) explanation = "Impacto muito baixo! (Menos de 10% de uma árvore/ano)";
  
  comparisonEl.querySelector('h3').innerHTML = explanation;

  // Criar ícones com atraso (animação escalonada)
  for (let i = 0; i < visualTrees; i++) {
    const icon = document.createElement('i');
    icon.className = 'fa-solid fa-tree';
    icon.style.animationDelay = `${i * 0.1}s`; // Retraso progresivo
    treeContainer.appendChild(icon);
  }

  // 6. Gerar Gráfico com Chart.js
  const chartSection = document.getElementById('chartSection');
  chartSection.classList.remove('hidden');

  const ctx = document.getElementById('comparisonChart').getContext('2d');
  
  // Dados para comparação
  const transportTypes = ['carro', 'moto', 'onibus', 'aviao', 'trem'];
  const labels = ['Carro', 'Moto', 'Ônibus', 'Avião', 'Trem'];
  
  // Calcular emissões para todos os tipos para comparar
  const data = transportTypes.map(type => {
    let f = 0;
    let isPub = false;
    switch(type) {
      case 'carro': f = 0.19; break;
      case 'moto': f = 0.10; break;
      case 'onibus': f = 0.04; isPub = true; break;
      case 'aviao': f = 0.25; isPub = true; break;
      case 'trem': f = 0.03; isPub = true; break;
    }
    return isPub ? (totalDist * f * passengers) : (totalDist * f);
  });

  // Cores: destacar o selecionado
  const bgColors = transportTypes.map(t => t === transport ? '#16a34a' : '#e5e7eb');

  if (myChart) myChart.destroy();

  myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Emissões (kg CO₂)',
        data: data,
        backgroundColor: bgColors,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      animation: {
        duration: 1500,
        easing: 'easeOutQuart'
      },
      plugins: { 
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.parsed.y.toFixed(2)} kg CO₂`;
            }
          }
        }
      },
      scales: { y: { beginAtZero: true } }
    }
  });

  // 7. Gerar Gráfico de Rosca (Breakdown: Distância vs Passageiros)
  const ctxPie = document.getElementById('breakdownChart').getContext('2d');
  
  // Cálculo: No transporte público, cada passageiro soma. No privado, o veículo emite o mesmo.
  let baseEmission = isPublic ? (totalDist * factor) : totalEmissions;
  let extraEmission = Math.max(0, totalEmissions - baseEmission);

  if (myPieChart) myPieChart.destroy();

  myPieChart = new Chart(ctxPie, {
    type: 'doughnut',
    data: {
      labels: ['Distância (Base)', 'Passageiros Extras'],
      datasets: [{
        data: [baseEmission, extraEmission],
        backgroundColor: ['#16a34a', '#bbf7d0'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true } },
        tooltip: {
          callbacks: {
            label: function(context) {
              const val = context.parsed;
              const pct = totalEmissions > 0 ? ((val / totalEmissions) * 100).toFixed(1) : 0;
              return ` ${val.toFixed(2)} kg (${pct}%)`;
            }
          }
        }
      }
    }
  });

  // Mostrar botão de download
  document.getElementById('downloadBtn').classList.remove('hidden');
});

// Funcionalidade de download
document.getElementById('downloadBtn').addEventListener('click', () => {
  const captureArea = document.getElementById('captureArea');
  html2canvas(captureArea, {
    backgroundColor: '#f0fdf4', // Cor de fundo do tema
    scale: 2 // Mayor calidad
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = 'meu-impacto-co2.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
});

// Função auxiliar para animar números
function animateValue(obj, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = (progress * (end - start) + start).toFixed(2);
    if (progress < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}