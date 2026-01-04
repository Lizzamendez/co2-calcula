let myChart = null;
let myPieChart = null;
let transportConfig = {}; // Almacenará la info del backend
let isAutoReset = false; // Bandera para controlar el reset automático

document.addEventListener('DOMContentLoaded', async () => {
  // 0. Inicializar Tema
  initTheme();
  // 0.1 Cargar Historial
  renderHistory();

  const select = document.getElementById('transport');
  
  try {
    // 1. Cargar opciones desde el Backend
    const response = await fetch('/api/transports');
    transportConfig = await response.json();
    
    select.innerHTML = ''; // Limpiar "Cargando..."
    
    for (const [key, data] of Object.entries(transportConfig)) {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = data.label;
      select.appendChild(option);
    }

    // 2. Restaurar última selección
    const lastTransport = localStorage.getItem('lastTransport');
    if (lastTransport && transportConfig[lastTransport]) {
      select.value = lastTransport;
    }
  } catch (error) {
    select.innerHTML = '<option>Erro ao carregar</option>';
    console.error("Error cargando transportes:", error);
  }

  // Listener para limpar erro ao digitar
  document.getElementById('distance').addEventListener('input', function() {
    this.classList.remove('error');
    document.getElementById('distanceError').classList.remove('visible');
  });
});

document.getElementById('calcForm').addEventListener('reset', () => {
  if (isAutoReset) return; // Si es reset automático, no ocultar resultados

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

document.getElementById('calcForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('calculate');
  const originalText = submitBtn.innerHTML;

  // 1. Obter valores
  const distanceInput = document.getElementById('distance');
  const distanceError = document.getElementById('distanceError');
  const distance = parseFloat(distanceInput.value);
  const passengers = parseInt(document.getElementById('passengers').value) || 1;
  const transport = document.getElementById('transport').value;
  const isRoundTrip = document.getElementById('roundTrip').checked;

  // Salvar a seleção atual no LocalStorage
  localStorage.setItem('lastTransport', transport);

  if (isNaN(distance) || distance <= 0) {
    distanceInput.classList.add('error');
    distanceError.classList.add('visible');
    return;
  }

  // Desabilitar botão durante o carregamento
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Calculando...';

  // 2. Chamar API Backend
  let totalEmissions = 0;
  let treesNeeded = 0;
  let comparisonData = {};
  let breakdownData = { base: 0, extra: 0 };

  try {
    const response = await fetch('/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distance, passengers, transport, isRoundTrip })
    });
    
    if (!response.ok) throw new Error('Erro na API');
    
    const result = await response.json();
    totalEmissions = result.emissions;
    treesNeeded = result.trees;
    comparisonData = result.comparisonData;
    breakdownData = result.breakdown;

    // Guardar en historial
    addToHistory(transport, distance, isRoundTrip, passengers, totalEmissions);

  } catch (error) {
    console.error(error);
    alert('Erro ao conectar com o servidor. Verifique se o backend está rodando.');
    return;
  } finally {
    // Reabilitar botão (sempre executa, sucesso ou erro)
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
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
      (${distance * (isRoundTrip ? 2 : 1)} km ${isRoundTrip ? 'ida e volta' : ''}, ${passengers} pass.)
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
  const transportTypes = Object.keys(transportConfig);
  const labels = transportTypes.map(type => transportConfig[type].label);
  
  // Calcular emissões para todos os tipos para comparar
  const chartData = transportTypes.map(type => comparisonData[type]);

  // Cores: destacar o selecionado
  const isDark = document.body.classList.contains('dark-mode');
  const baseColor = isDark ? '#374151' : '#e5e7eb';
  const bgColors = transportTypes.map(t => t === transport ? '#16a34a' : baseColor);

  if (myChart) myChart.destroy();

  myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Emissões (kg CO₂)',
        data: chartData,
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
  
  if (myPieChart) myPieChart.destroy();

  myPieChart = new Chart(ctxPie, {
    type: 'doughnut',
    data: {
      labels: ['Distância (Base)', 'Passageiros Extras'],
      datasets: [{
        data: [breakdownData.base, breakdownData.extra],
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

  // Limpar formulário automaticamente (mantendo o transporte e resultados)
  isAutoReset = true;
  const currentTransport = document.getElementById('transport').value;
  document.getElementById('calcForm').reset();
  document.getElementById('transport').value = currentTransport;
  isAutoReset = false;
});

// Funcionalidade de download
document.getElementById('downloadBtn').addEventListener('click', () => {
  const captureArea = document.getElementById('captureArea');
  html2canvas(captureArea, {
    backgroundColor: '#f0fdf4', // Cor de fundo do tema
    backgroundColor: document.body.classList.contains('dark-mode') ? '#1e293b' : '#f0fdf4',
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

// --- Lógica de Tema Oscuro ---
const themeToggleBtn = document.getElementById('themeToggle');

function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
  }
}

themeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  
  // Guardar preferencia
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  
  // Cambiar icono
  themeToggleBtn.innerHTML = isDark 
    ? '<i class="fa-solid fa-sun"></i>' 
    : '<i class="fa-solid fa-moon"></i>';
    
  // Atualizar gráfico se existir
  if (myChart) {
    const selectedTransport = document.getElementById('transport').value;
    const transportTypes = Object.keys(transportConfig);
    const baseColor = isDark ? '#374151' : '#e5e7eb';
    
    myChart.data.datasets[0].backgroundColor = transportTypes.map(t => 
      t === selectedTransport ? '#16a34a' : baseColor
    );
    myChart.update();
  }
});

// --- Lógica de Historial ---
const MAX_HISTORY = 5;

function addToHistory(transportKey, dist, isRound, pass, emissions) {
  const label = transportConfig[transportKey] ? transportConfig[transportKey].label : transportKey;
  const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  
  const entry = {
    date,
    transport: label,
    details: `${dist}km${isRound ? ' (x2)' : ''}, ${pass}p`,
    emissions: emissions.toFixed(2)
  };

  // Obtener actual
  let history = JSON.parse(localStorage.getItem('co2_history') || '[]');
  
  // Agregar al inicio
  history.unshift(entry);
  
  // Mantener solo 5
  if (history.length > MAX_HISTORY) history.pop();
  
  // Guardar
  localStorage.setItem('co2_history', JSON.stringify(history));
  
  renderHistory();
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem('co2_history') || '[]');
  const tbody = document.querySelector('#historyTable tbody');
  const section = document.getElementById('historySection');

  if (history.length === 0) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  tbody.innerHTML = history.map(item => `
    <tr>
      <td>${item.date}</td>
      <td>
        <div style="font-weight:500">${item.transport}</div>
        <div style="font-size:0.75em; opacity:0.7">${item.details}</div>
      </td>
      <td><strong>${item.emissions} kg</strong></td>
    </tr>
  `).join('');
}

// Botão de limpar histórico
document.getElementById('clearHistoryBtn').addEventListener('click', () => {
  if (confirm('Tem certeza que deseja apagar todo o histórico?')) {
    localStorage.removeItem('co2_history');
    renderHistory();
  }
});