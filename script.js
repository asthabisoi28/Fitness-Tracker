// Select form, table, and chart canvas
const fitnessForm = document.getElementById("fitness-form");
const historyTable = document.getElementById("history-table");
const chartCanvas = document.getElementById("fitnessChart").getContext("2d");

// Initialize an empty chart
let fitnessChart;

// Load data and display on page load
document.addEventListener("DOMContentLoaded", () => {
    displayHistory();
    renderChart();
});

// Event listener for form submission
fitnessForm.addEventListener("submit", function (event) {
    event.preventDefault();

    // Get user input
    const date = document.getElementById("date-input").value;
    const steps = document.getElementById("steps-input").value;
    const calories = document.getElementById("calories-input").value;
    const water = document.getElementById("water-input").value;
    const active = document.getElementById("active-input").value;

    // Save data to Local Storage
    const progress = { date, steps, calories, water, active };
    saveProgress(progress);

    // Update history table and chart
    displayHistory();
    renderChart();

    // Clear form fields
    fitnessForm.reset();
});

// Save data to Local Storage
function saveProgress(progress) {
    let history = JSON.parse(localStorage.getItem("fitnessHistory")) || [];
    history.push(progress);
    localStorage.setItem("fitnessHistory", JSON.stringify(history));
}

// Display history in the table
function displayHistory() {
    const history = JSON.parse(localStorage.getItem("fitnessHistory")) || [];
    historyTable.innerHTML = ""; // Clear existing table rows

    history.forEach(record => {
        const row = `
            <tr>
                <td>${record.date}</td>
                <td>${record.steps}</td>
                <td>${record.calories}</td>
                <td>${record.water}</td>
                <td>${record.active}</td>
            </tr>
        `;
        historyTable.innerHTML += row;
    });
}

// Render the fitness chart
function renderChart() {
    const history = JSON.parse(localStorage.getItem("fitnessHistory")) || [];

    // Extract data for chart
    const dates = history.map(entry => entry.date);
    const steps = history.map(entry => entry.steps);
    const calories = history.map(entry => entry.calories);
    const water = history.map(entry => entry.water);
    const active = history.map(entry => entry.active);

    // Destroy previous chart instance if it exists
    if (fitnessChart) {
        fitnessChart.destroy();
    }

    // Create a new chart
    fitnessChart = new Chart(chartCanvas, {
        type: "line",
        data: {
            labels: dates,
            datasets: [
                {
                    label: "Steps Taken",
                    data: steps,
                    borderColor: "blue",
                    backgroundColor: "rgba(0, 123, 255, 0.2)",
                    fill: true
                },
                {
                    label: "Calories Burned",
                    data: calories,
                    borderColor: "red",
                    backgroundColor: "rgba(255, 99, 132, 0.2)",
                    fill: true
                },
                {
                    label: "Water Intake (glasses)",
                    data: water,
                    borderColor: "green",
                    backgroundColor: "rgba(40, 167, 69, 0.2)",
                    fill: true
                },
                {
                    label: "Active Minutes",
                    data: active,
                    borderColor: "orange",
                    backgroundColor: "rgba(255, 159, 64, 0.2)",
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: "Daily Fitness Progress"
                }
            },
            scales: {
                x: { title: { display: true, text: "Date" } },
                y: { title: { display: true, text: "Values" } }
            }
        }
    });
}

