# 🌱 Calculadora de Emissões de CO₂
Qual é o impacto ambiental da sua escolha de transporte?

![Status](https://img.shields.io/badge/Status-Concluído-success)
![Tech](https://img.shields.io/badge/Tech-HTML%20%7C%20CSS%20%7C%20JS-yellow)

> Uma ferramenta interativa para estimar, visualizar e compreender o impacto ambiental dos seus deslocamentos diários.

---

## 📖 Sobre o Projeto

A **Calculadora de Emissões de CO₂** é uma aplicação web moderna e responsiva que vai além dos números. O objetivo não é apenas calcular quilogramas de dióxido de carbono, mas traduzir esses dados abstratos em **contexto visual e emocional**.

Através de comparações gráficas, equivalência em árvores e feedback visual imediato (gamificação), a ferramenta ajuda os usuários a tomarem decisões de transporte mais conscientes e sustentáveis.

---

## ✨ Funcionalidades Principais

*   **Cálculo Preciso**: Estimativas baseadas em fatores de emissão médios para Carro, Moto, Ônibus, Avião e Trem/Metrô.
*   **Visualização de Dados**:
    *   📊 **Gráficos Comparativos**: Veja como sua escolha se compara a outras opções (Chart.js).
    *   🍩 **Análise de Impacto**: Entenda a proporção entre a distância percorrida e o número de passageiros.
*   **Contextualização (Fator "Wow")**:
    *   🌲 **Equivalência em Árvores**: Descubra quantas árvores são necessárias para compensar sua viagem.
    *   🎉 **Gamificação**: Feedback positivo (confetes) para escolhas de baixo impacto.
*   **Exportação**: Baixe seu resultado como uma imagem PNG profissional para compartilhar nas redes sociais.
*   **Interface Moderna**: Design limpo, responsivo e com suporte a tema nativo mobile.

---

## 🛠️ Tecnologias Utilizadas

O projeto foi construído com tecnologias web padrão, garantindo leveza e compatibilidade.

*   **Core**: HTML5, CSS3 (Variáveis, Flexbox, Grid), JavaScript (ES6+).
*   **Bibliotecas**:
    *   [Chart.js](https://www.chartjs.org/) - Para gráficos interativos e animados.
    *   [html2canvas](https://html2canvas.hertzen.com/) - Para captura de tela e download dos resultados.
    *   [canvas-confetti](https://github.com/catdad/canvas-confetti) - Para efeitos visuais de celebração.
    *   [FontAwesome](https://fontawesome.com/) - Para iconografia moderna.

---

## 🤖 Uso de Inteligência Artificial
O GitHub Copilot foi utilizado como assistente no desenvolvimento da lógica de cálculo, estruturação dos gráficos e otimização da interface, acelerando o processo de criação do projeto.


## 🚀 Como Executar

Este é um projeto estático, o que significa que você pode rodá-lo diretamente em seu navegador sem instalar dependências complexas.

1.  **Baixe ou Clone** o repositório.
2.  **Abra o arquivo** `index.html` em qualquer navegador moderno (Chrome, Firefox, Edge).
3.  **Use a calculadora**:
    *   Informe a distância e passageiros.
    *   Selecione o transporte.
    *   Clique em "Calcular" e veja a mágica acontecer!

---

## ⚙️ Personalização

Os cálculos são baseados em estimativas médias globais. Para adaptar o projeto à sua realidade local, edite o arquivo `script.js` e ajuste a variável `factor` dentro do `switch(transport)`.

## 📂 Estrutura de Arquivos

```text
co2-calculator/
├── index.html      # Estrutura, importação de libs e layout
├── styles.css      # Estilização, temas, animações e responsividade
├── script.js       # Lógica de cálculo, manipulação do DOM e gráficos
└── readme.md       # Documentação do projeto
```

<div align="center">
  <sub>Desenvolvido com foco em UX e Sustentabilidade. 🌱</sub>
</div>
