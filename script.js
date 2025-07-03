const publicSheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlR9zaL-9jbKA5TgzfRUYASiElCc_fIZ3BdfMmzt5_YPIzrGD4b5NXJHKfOPaTkkbH5SadjhOxwrrN/pub?output=csv";

let fuelData = [];

async function fetchFuelData() {
  const response = await fetch(publicSheetURL);
  const csvText = await response.text();
  const rows = csvText.split("\n").slice(1); // skip header row

  fuelData = rows
    .map(line => line.split(","))
    .filter(cells => cells.length >= 5)
    .map(cells => ({
      type: cells[0].trim(),
      region: cells[1].trim(),
      previous: parseFloat(cells[2]),
      current: parseFloat(cells[3]),
      predicted: parseFloat(cells[4])
    }))
    .filter(row => row.type && row.region && !isNaN(row.current));

  populateDropdowns();
  updateDisplay();
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

  // Calculate difference between current and previous prices
  const diff = match.current - match.previous;

  document.getElementById("priceChange").textContent = diff.toFixed(3);
  document.getElementById("arrow").textContent = diff < 0 ? "🟢⬇" : diff > 0 ? "🔴⬆" : "➖";
}

document.addEventListener("change", e => {
  if (["fuelType", "region"].includes(e.target.id)) updateDisplay();
});

fetchFuelData();
setInterval(fetchFuelData, 60000);
