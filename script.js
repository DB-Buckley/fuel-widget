const sheetID = "1XaKAB1pMmD9cKu9uByJvo7PvAB1Pfl-m0QxwRJS5GfM";
const sheetName = "Fuel Price Forecast";
const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?sheet=${encodeURIComponent(sheetName)}`;

let fuelData = [];

async function fetchFuelData() {
  const response = await fetch(url);
  const text = await response.text();
  const jsonData = JSON.parse(text.substr(47).slice(0, -2));
  const rows = jsonData.table.rows;

  fuelData = rows.map(r => ({
    type: r.c[0]?.v,
    region: r.c[1]?.v,
    previous: parseFloat(r.c[2]?.v),
    current: parseFloat(r.c[3]?.v),
    predicted: parseFloat(r.c[4]?.v)
  })).filter(r => r.type && r.region);

  populateDropdowns();
  updateDisplay();
  updateExternalData();
}

function populateDropdowns() {
  const fuelTypes = [...new Set(fuelData.map(d => d.type))];
  const regions = [...new Set(fuelData.map(d => d.region))];

  document.getElementById("fuelType").innerHTML =
    fuelTypes.map(t => `<option value="${t}">${t}</option>`).join("");
  document.getElementById("region").innerHTML =
    regions.map(r => `<option value="${r}">${r}</option>`).join("");
}

function updateDisplay() {
  const type = document.getElementById("fuelType").value;
  const region = document.getElementById("region").value;
  const match = fuelData.find(r => r.type === type && r.region === region);
  if (!match) return;

  document.getElementById("previousPrice").textContent = match.previous.toFixed(2);
  document.getElementById("currentPrice").textContent = match.current.toFixed(2);
  document.getElementById("predictedPrice").textContent = match.predicted.toFixed(2);
  const diff = match.predicted - match.current;
  document.getElementById("priceChange").textContent = diff.toFixed(3);
  document.getElementById("arrow").textContent = diff < 0 ? "🟢⬇" : diff > 0 ? "🔴⬆" : "➖";

  updateChart([match.previous, match.current, match.predicted]);
  document.getElementById("timestamp").textContent = new Date().toLocaleString();
}

function updateChart(data) {
  const ctx = document.getElementById("trendChart").getContext("2d");
  if (window.chart) window.chart.destroy();
  window.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ["Previous", "Current", "Predicted"],
      datasets: [{
        label: "Fuel Price",
        data: data,
        fill: false,
        borderColor: "steelblue",
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: false }
      }
    }
  });
}

async function updateExternalData() {
  try {
    const fx = await fetch("https://api.exchangerate.host/latest?base=USD&symbols=ZAR");
    const fxJson = await fx.json();
    document.getElementById("zarUsd").textContent = (1 / fxJson.rates.ZAR).toFixed(3);

    const oil = await fetch("https://api.api-ninjas.com/v1/oilprice?type=brent", {
      headers: { 'X-Api-Key': 'demo' } // Replace with your API key if needed
    });
    const oilJson = await oil.json();
    document.getElementById("brent").textContent = oilJson.price || "n/a";
  } catch (e) {
    document.getElementById("zarUsd").textContent = "n/a";
    document.getElementById("brent").textContent = "n/a";
  }
}

document.addEventListener("change", e => {
  if (["fuelType", "region"].includes(e.target.id)) updateDisplay();
});

fetchFuelData();
setInterval(fetchFuelData, 60000);
