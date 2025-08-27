// Select form, table, and chart canvas
const fitnessForm = document.getElementById("fitness-form");
const historyTable = document.getElementById("history-table");
const chartCanvas = document.getElementById("fitnessChart").getContext("2d");

// Initialize an empty chart
let fitnessChart;
let currentChartType = 'trends';


// Load data and display on page load
document.addEventListener("DOMContentLoaded", async () => {
    await loadFitnessData();
    await loadGoals();
    showChart('trends');
    createDashboardCards();

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const themeButton = document.getElementById('theme-toggle');
        if (themeButton) {
            themeButton.textContent = '☀️ Light Mode';
        }
    }

    // Theme toggle event listener
    const themeButton = document.getElementById('theme-toggle');
    if (themeButton) {
        themeButton.addEventListener('click', toggleTheme);
    }
});


// API Configuration
const API_BASE_URL = window.location.origin;

// Event listener for form submission
fitnessForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    // Get user input
    const date = document.getElementById("date-input").value;
    const steps = parseInt(document.getElementById("steps-input").value) || 0;
    const distance = parseFloat(document.getElementById("distance-input").value) || 0;
    const calories = parseInt(document.getElementById("calories-input").value) || 0;
    const caloriesConsumed = parseInt(document.getElementById("calories-consumed-input").value) || 0;
    const water = parseInt(document.getElementById("water-input").value) || 0;
    const sleep = parseFloat(document.getElementById("sleep-input").value) || 0;
    const active = parseInt(document.getElementById("active-input").value) || 0;
    const weight = parseFloat(document.getElementById("weight-input").value) || null;
    const mood = parseInt(document.getElementById("mood-input").value) || 3;

    const progress = { 
        date, steps, distance, calories, calories_consumed: caloriesConsumed, 
        water, sleep, active, weight, mood 
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/fitness-records`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(progress)
        });

        if (!response.ok) {
            throw new Error('Failed to save data');
        }

        const result = await response.json();
        
        // Update displays
        await loadFitnessData();
        createDashboardCards();
        showChart(currentChartType);

        // Reset form
        fitnessForm.reset();
        document.getElementById("date-input").value = new Date().toISOString().split('T')[0];

        showNotification("Progress saved successfully!", "success");
    } catch (error) {
        console.error('Error saving data:', error);
        showNotification("Failed to save progress. Please try again.", "error");
    }
});

// Load fitness data from backend
async function loadFitnessData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/fitness-records`);
        if (!response.ok) {
            throw new Error('Failed to load data');
        }
        
        const data = await response.json();
        
        // Store in localStorage for compatibility with existing chart functions
        localStorage.setItem("fitnessHistory", JSON.stringify(data));
        
        displayHistory();
        return data;
    } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to localStorage if backend is unavailable
        const localData = JSON.parse(localStorage.getItem("fitnessHistory")) || [];
        displayHistory();
        return localData;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function displayHistory() {
    const history = JSON.parse(localStorage.getItem("fitnessHistory")) || [];
    const tableBody = historyTable.querySelector('tbody') || historyTable;
    tableBody.innerHTML = ""; // Clear existing table rows

    history.forEach(record => {
        const moodEmoji = getMoodEmoji(record.mood);
        const row = `
            <tr>
                <td>${record.date}</td>
                <td>${record.steps || 0}</td>
                <td>${record.distance || 0}km</td>
                <td>${record.calories || 0}</td>
                <td>${record.calories_consumed || record.caloriesConsumed || 0}</td>
                <td>${record.water || 0}</td>
                <td>${record.sleep || 0}h</td>
                <td>${record.active || 0}min</td>
                <td>${record.weight ? record.weight + 'kg' : '-'}</td>
                <td>${moodEmoji}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });

    // Add this line to update dashboard cards
    createDashboardCards();
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
// Add this new function after your existing functions
function createDashboardCards() {
    const history = JSON.parse(localStorage.getItem("fitnessHistory")) || [];
    const today = history[history.length - 1] || { 
        steps: 0, distance: 0, calories: 0, caloriesConsumed: 0, 
        water: 0, sleep: 0, active: 0, weight: 0, mood: 0 
    };

    const dashboardContainer = document.getElementById("dashboard-cards");
    
    // Calculate net calories (consumed - burned)
    const netCalories = (today.caloriesConsumed || 0) - (today.calories || 0);
    const calorieBalance = netCalories > 0 ? `+${netCalories}` : netCalories;

    dashboardContainer.innerHTML = `
        <div class="dashboard">
            <div class="metric-card steps-card">
                <h3>🚶‍♂️ Steps</h3>
                <div class="metric-value">${today.steps || 0}</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${Math.min((today.steps || 0) / 10000 * 100, 100)}%"></div>
                </div>
                <small>Goal: 10,000 steps</small>
                <div class="sub-metric">📏 ${today.distance || 0}km</div>
            </div>
            
            <div class="metric-card calories-card">
                <h3>🔥 Calorie Balance</h3>
                <div class="metric-value">${calorieBalance}</div>
                <div class="calorie-breakdown">
                    <div>📥 Consumed: ${today.caloriesConsumed || 0}</div>
                    <div>📤 Burned: ${today.calories || 0}</div>
                </div>
                <small>${netCalories > 0 ? 'Calorie surplus' : netCalories < 0 ? 'Calorie deficit' : 'Balanced'}</small>
            </div>
            
            <div class="metric-card water-card">
                <h3>💧 Hydration</h3>
                <div class="metric-value">${today.water || 0}</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${Math.min((today.water || 0) / 8 * 100, 100)}%"></div>
                </div>
                <small>Goal: 8 glasses (2L)</small>
                <div class="sub-metric">${(today.water || 0) * 0.25}L consumed</div>
            </div>
            
            <div class="metric-card sleep-card">
                <h3>😴 Sleep</h3>
                <div class="metric-value">${today.sleep || 0}h</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${Math.min((today.sleep || 0) / 8 * 100, 100)}%"></div>
                </div>
                <small>Goal: 7-9 hours</small>
                <div class="sub-metric">${getSleepQuality(today.sleep)}</div>
            </div>
            
            <div class="metric-card exercise-card">
                <h3>💪 Exercise</h3>
                <div class="metric-value">${today.active || 0}min</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${Math.min((today.active || 0) / 150 * 100, 100)}%"></div>
                </div>
                <small>Weekly goal: 150 min</small>
                <div class="sub-metric">${getActivityLevel(today.active)}</div>
            </div>
            
            <div class="metric-card mood-card">
                <h3>😊 Mood & Energy</h3>
                <div class="metric-value">${getMoodEmoji(today.mood)}</div>
                <div class="mood-text">${getMoodText(today.mood)}</div>
                <small>How are you feeling today?</small>
            </div>
        </div>
    `;
}
function showChart(type) {
    currentChartType = type;
    document.querySelectorAll('.nav-pill').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-chart="${type}"]`).classList.add('active');

    // Adjust layout for insights
    const chartContainer = document.querySelector('.chart-main-container');
    if (type === 'insights') {
        chartContainer.classList.add('insights-layout');
    } else {
        chartContainer.classList.remove('insights-layout');
    }

    switch (type) {
        case 'trends':
            renderTrendsChart();
            break;
        case 'comparison':
            renderComparisonChart();
            break;
        case 'goals':
            renderGoalsChart();
            break;
        case 'insights':
            renderInsightsChart();
            break;
    }
    updateStatistics(type);
}

// Load goals from backend and display
async function loadGoals() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/goals`);
        if (!response.ok) {
            throw new Error('Failed to load goals');
        }
        
        const goals = await response.json();
        displayGoals(goals);
        return goals;
    } catch (error) {
        console.error('Error loading goals:', error);
        return [];
    }
}

// Display goals in the goals section
function displayGoals(goals) {
    const goalsContainer = document.getElementById('goals-container');
    if (!goalsContainer) return;

    if (goals.length === 0) {
        goalsContainer.innerHTML = `
            <div class="no-goals">
                <h3>🎯 Set Your First Goal!</h3>
                <p>Start your fitness journey by setting achievable goals</p>
            </div>
        `;
        return;
    }

    goalsContainer.innerHTML = goals.map(goal => {
        const progress = Math.min((goal.current_value / goal.target_value) * 100, 100);
        const isCompleted = progress >= 100;
        
        return `
            <div class="goal-card ${isCompleted ? 'completed' : ''}">
                <div class="goal-header">
                    <h3>${getGoalIcon(goal.goal_type)} ${formatGoalType(goal.goal_type)}</h3>
                    <span class="goal-status ${goal.status}">${goal.status}</span>
                </div>
                <div class="goal-progress">
                    <div class="progress-info">
                        <span class="current">${goal.current_value}</span>
                        <span class="target">/ ${goal.target_value}</span>
                        <span class="unit">${getGoalUnit(goal.goal_type)}</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-percentage">${Math.round(progress)}%</div>
                </div>
                ${goal.deadline ? `<div class="goal-deadline">📅 Target: ${formatDate(goal.deadline)}</div>` : ''}
                <div class="goal-actions">
                    <button onclick="updateGoalProgress('${goal.id}')" class="btn-update">Update Progress</button>
                    <button onclick="deleteGoal('${goal.id}')" class="btn-delete">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Helper functions for goals
function getGoalIcon(goalType) {
    const icons = {
        'daily_steps': '🚶‍♂️',
        'daily_calories_burn': '🔥',
        'daily_water': '💧',
        'daily_sleep': '😴',
        'weekly_exercise': '💪',
        'weight_loss': '⚖️',
        'weight_gain': '📈'
    };
    return icons[goalType] || '🎯';
}

function formatGoalType(goalType) {
    const types = {
        'daily_steps': 'Daily Steps',
        'daily_calories_burn': 'Daily Calories Burn',
        'daily_water': 'Daily Water Intake',
        'daily_sleep': 'Daily Sleep',
        'weekly_exercise': 'Weekly Exercise',
        'weight_loss': 'Weight Loss',
        'weight_gain': 'Weight Gain'
    };
    return types[goalType] || goalType.replace('_', ' ');
}

function getGoalUnit(goalType) {
    const units = {
        'daily_steps': 'steps',
        'daily_calories_burn': 'cal',
        'daily_water': 'glasses',
        'daily_sleep': 'hours',
        'weekly_exercise': 'minutes',
        'weight_loss': 'kg',
        'weight_gain': 'kg'
    };
    return units[goalType] || '';
}

function showGoalModal() {
    // Simple prompt for now - can be enhanced with a proper modal
    const goalType = prompt('Enter goal type (daily_steps, daily_calories_burn, daily_water, daily_sleep, weekly_exercise, weight_loss):');
    const targetValue = prompt('Enter target value:');
    const deadline = prompt('Enter deadline (YYYY-MM-DD) or leave empty:');
    
    if (goalType && targetValue) {
        createGoal(goalType, parseFloat(targetValue), deadline || null);
    }
}

async function createGoal(goalType, targetValue, deadline) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/goals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                goal_type: goalType,
                target_value: targetValue,
                deadline: deadline
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create goal');
        }

        await loadGoals();
        showNotification('Goal created successfully!', 'success');
    } catch (error) {
        console.error('Error creating goal:', error);
        showNotification('Failed to create goal', 'error');
    }
}

function updateGoalProgress(goalId) {
    const newValue = prompt('Enter current progress value:');
    if (newValue !== null) {
        updateGoal(goalId, parseFloat(newValue));
    }
}

async function updateGoal(goalId, currentValue) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/goals/${goalId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                current_value: currentValue
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update goal');
        }

        await loadGoals();
        showNotification('Goal updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating goal:', error);
        showNotification('Failed to update goal', 'error');
    }
}

function deleteGoal(goalId) {
    if (confirm('Are you sure you want to delete this goal?')) {
        removeGoal(goalId);
    }
}

async function removeGoal(goalId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/goals/${goalId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete goal');
        }

        await loadGoals();
        showNotification('Goal deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting goal:', error);
        showNotification('Failed to delete goal', 'error');
    }
}

// Trends Chart with dynamic calculations
function renderTrendsChart() {
    const history = JSON.parse(localStorage.getItem("fitnessHistory")) || [];
    if (fitnessChart) fitnessChart.destroy();
    
    // Calculate moving averages
    const movingAvgSteps = calculateMovingAverage(history.map(r => parseInt(r.steps) || 0), 7);
    const movingAvgSleep = calculateMovingAverage(history.map(r => parseFloat(r.sleep) || 0), 7);
    
    fitnessChart = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: history.map(r => formatDate(r.date)),
            datasets: [
                {
                    label: "Daily Steps",
                    data: history.map(r => parseInt(r.steps) || 0),
                    borderColor: "#4facfe",
                    backgroundColor: "rgba(79, 172, 254, 0.1)",
                    fill: false,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: "7-Day Steps Average",
                    data: movingAvgSteps,
                    borderColor: "#00f2fe",
                    backgroundColor: "transparent",
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0
                },
                {
                    label: "Sleep Hours",
                    data: history.map(r => parseFloat(r.sleep) || 0),
                    borderColor: "#667eea",
                    backgroundColor: "rgba(102, 126, 234, 0.1)",
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y1',
                    pointRadius: 4
                },
                {
                    label: "Exercise Minutes",
                    data: history.map(r => parseInt(r.active) || 0),
                    borderColor: "#ff9a9e",
                    backgroundColor: "rgba(255, 154, 158, 0.1)",
                    fill: false,
                    tension: 0.4,
                    pointRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: { 
                    display: true, 
                    text: "Fitness Trends & Moving Averages",
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        afterBody: function(context) {
                            const dataIndex = context[0].dataIndex;
                            const record = history[dataIndex];
                            return [
                                `Distance: ${record.distance || 0}km`,
                                `Calories Balance: ${(record.caloriesConsumed || 0) - (record.calories || 0)}`,
                                `Mood: ${getMoodText(record.mood)}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: { 
                    title: { display: true, text: "Date" },
                    grid: { color: 'rgba(0,0,0,0.1)' }
                },
                y: { 
                    title: { display: true, text: "Steps / Minutes" },
                    grid: { color: 'rgba(0,0,0,0.1)' },
                    beginAtZero: true
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: "Sleep Hours" },
                    grid: { drawOnChartArea: false },
                    min: 0,
                    max: 12
                }
            }
        }
    });
}

// Enhanced Comparison Chart with goal tracking
function renderComparisonChart() {
    const history = JSON.parse(localStorage.getItem("fitnessHistory")) || [];
    if (fitnessChart) fitnessChart.destroy();

    const last14 = history.slice(-14);
    const thisWeek = last14.slice(-7);
    const lastWeek = last14.slice(0, 7);
    
    // Calculate weekly averages
    const thisWeekAvg = {
        steps: Math.round(thisWeek.reduce((sum, d) => sum + (parseInt(d.steps) || 0), 0) / Math.max(thisWeek.length, 1)),
        calories: Math.round(thisWeek.reduce((sum, d) => sum + (parseInt(d.calories) || 0), 0) / Math.max(thisWeek.length, 1)),
        sleep: Math.round(thisWeek.reduce((sum, d) => sum + (parseFloat(d.sleep) || 0), 0) / Math.max(thisWeek.length, 1) * 10) / 10,
        water: Math.round(thisWeek.reduce((sum, d) => sum + (parseInt(d.water) || 0), 0) / Math.max(thisWeek.length, 1))
    };
    
    const lastWeekAvg = {
        steps: Math.round(lastWeek.reduce((sum, d) => sum + (parseInt(d.steps) || 0), 0) / Math.max(lastWeek.length, 1)),
        calories: Math.round(lastWeek.reduce((sum, d) => sum + (parseInt(d.calories) || 0), 0) / Math.max(lastWeek.length, 1)),
        sleep: Math.round(lastWeek.reduce((sum, d) => sum + (parseFloat(d.sleep) || 0), 0) / Math.max(lastWeek.length, 1) * 10) / 10,
        water: Math.round(lastWeek.reduce((sum, d) => sum + (parseInt(d.water) || 0), 0) / Math.max(lastWeek.length, 1))
    };

    fitnessChart = new Chart(chartCanvas, {
        type: 'bar',
        data: {
            labels: ['Steps', 'Calories Burned', 'Sleep Hours', 'Water Glasses'],
            datasets: [
                {
                    label: 'This Week Average',
                    data: [thisWeekAvg.steps, thisWeekAvg.calories, thisWeekAvg.sleep * 1000, thisWeekAvg.water * 100],
                    backgroundColor: ['#4facfe', '#fa709a', '#667eea', '#a8edea'],
                    borderColor: ['#00f2fe', '#fee140', '#764ba2', '#fed6e3'],
                    borderWidth: 2
                },
                {
                    label: 'Last Week Average',
                    data: [lastWeekAvg.steps, lastWeekAvg.calories, lastWeekAvg.sleep * 1000, lastWeekAvg.water * 100],
                    backgroundColor: ['rgba(79, 172, 254, 0.3)', 'rgba(250, 112, 154, 0.3)', 'rgba(102, 126, 234, 0.3)', 'rgba(168, 237, 234, 0.3)'],
                    borderColor: ['#4facfe', '#fa709a', '#667eea', '#a8edea'],
                    borderWidth: 1
                },
                {
                    label: 'Goals',
                    data: [10000, 500, 8000, 800], // Goals: 10k steps, 500 cal, 8h sleep, 8 glasses
                    backgroundColor: 'rgba(255, 206, 84, 0.2)',
                    borderColor: '#ffce54',
                    borderWidth: 2,
                    type: 'line',
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: { 
                    display: true, 
                    text: 'Weekly Performance vs Goals',
                    font: { size: 16, weight: 'bold' }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label;
                            let value = context.parsed.y;
                            
                            if (context.dataIndex === 2) { // Sleep hours
                                value = value / 1000;
                                return `${label}: ${value}h`;
                            } else if (context.dataIndex === 3) { // Water
                                value = value / 100;
                                return `${label}: ${value} glasses`;
                            }
                            return `${label}: ${value}`;
                        }
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    title: { display: true, text: "Values (normalized)" }
                }
            }
        }
    });
}

// Enhanced Goals Chart with daily progress rings
function renderGoalsChart() {
    const history = JSON.parse(localStorage.getItem("fitnessHistory")) || [];
    if (fitnessChart) fitnessChart.destroy();

    // Daily goals (per day targets)
    const dailyGoals = { 
        steps: 10000, 
        calories: 500, 
        water: 8, 
        sleep: 8, 
        active: 30  // Changed to daily target (30 min per day)
    };
    
    const today = history[history.length - 1] || { steps: 0, calories: 0, water: 0, sleep: 0, active: 0 };
    
    // Calculate daily completion percentages
    const completions = {
        steps: Math.min((today.steps || 0) / dailyGoals.steps * 100, 100),
        calories: Math.min((today.calories || 0) / dailyGoals.calories * 100, 100),
        water: Math.min((today.water || 0) / dailyGoals.water * 100, 100),
        sleep: Math.min((today.sleep || 0) / dailyGoals.sleep * 100, 100),
        active: Math.min((today.active || 0) / dailyGoals.active * 100, 100)
    };

    fitnessChart = new Chart(chartCanvas, {
        type: 'doughnut',
        data: {
            labels: [
                `Steps (${dailyGoals.steps}/day)`, 
                `Calories (${dailyGoals.calories}/day)`, 
                `Water (${dailyGoals.water} glasses/day)`, 
                `Sleep (${dailyGoals.sleep}h/day)`, 
                `Exercise (${dailyGoals.active}min/day)`
            ],
            datasets: [{
                data: [completions.steps, completions.calories, completions.water, completions.sleep, completions.active],
                backgroundColor: ["#4facfe", "#fa709a", "#a8edea", "#667eea", "#ff9a9e"],
                borderColor: ["#00f2fe", "#fee140", "#fed6e3", "#764ba2", "#fecfef"],
                borderWidth: 3,
                cutout: '60%'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { 
                    display: true, 
                    text: "Today's Daily Goal Progress",
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const goalNames = ['Steps', 'Calories', 'Water', 'Sleep', 'Exercise'];
                            const goalValues = [dailyGoals.steps, dailyGoals.calories, dailyGoals.water, dailyGoals.sleep, dailyGoals.active];
                            const actualValues = [today.steps || 0, today.calories || 0, today.water || 0, today.sleep || 0, today.active || 0];
                            const units = ['steps', 'cal', 'glasses', 'hours', 'minutes'];
                            
                            const index = context.dataIndex;
                            const percentage = Math.round(context.parsed);
                            const actual = actualValues[index];
                            const goal = goalValues[index];
                            const unit = units[index];
                            
                            return [
                                `${goalNames[index]}: ${percentage}%`,
                                `Progress: ${actual}/${goal} ${unit}`,
                                `Remaining: ${Math.max(0, goal - actual)} ${unit}`
                            ];
                        }
                    }
                }
            },
            elements: {
                arc: {
                    borderRadius: 8
                }
            }
        }
    });
}

// AI-powered Feedback Chart
function renderInsightsChart() {
    if (fitnessChart) fitnessChart.destroy();
    
    // Create a visual feedback chart
    const history = JSON.parse(localStorage.getItem("fitnessHistory")) || [];
    if (history.length === 0) return;
    
    const last7Days = history.slice(-7);
    const scores = last7Days.map(day => calculateDailyScore(day));
    
    fitnessChart = new Chart(chartCanvas, {
        type: 'radar',
        data: {
            labels: ['Steps', 'Exercise', 'Sleep', 'Hydration', 'Consistency', 'Balance'],
            datasets: [{
                label: 'Your Performance',
                data: calculatePerformanceScores(history),
                backgroundColor: 'rgba(79, 172, 254, 0.2)',
                borderColor: '#4facfe',
                borderWidth: 3,
                pointBackgroundColor: '#4facfe',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6
            }, {
                label: 'Optimal Range',
                data: [100, 100, 100, 100, 100, 100],
                backgroundColor: 'rgba(255, 206, 84, 0.1)',
                borderColor: '#ffce54',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Health Performance Radar',
                    font: { size: 18, weight: 'bold' },
                    padding: {
                        top: 15,
                        bottom: 20
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        boxWidth: 15,
                        font: {
                            size: 12
                        }
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20,
                        display: true,
                        font: {
                            size: 10
                        },
                        color: '#666'
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.15)'
                    },
                    pointLabels: {
                        font: {
                            size: 13,
                            weight: '600'
                        },
                        color: '#333'
                    }
                }
            },
            layout: {
                padding: {
                    top: 10,
                    bottom: 10,
                    left: 20,
                    right: 20
                }
            }
        }
    });
}

// AI-powered feedback and recommendations
function updateStatistics(type) {
    const history = JSON.parse(localStorage.getItem("fitnessHistory")) || [];
    const statsPanel = document.getElementById('statistics-panel');
    
    if (!history.length) {
        // Show sample feedback when no data exists
        statsPanel.innerHTML = `
            <div class="feedback-container">
                <div class="feedback-section">
                    <h3>🎯 Your Health Score: 0/100</h3>
                    <div class="score-breakdown">
                        <div class="score-item">
                            <span>Activity Level:</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: 0%"></div>
                            </div>
                            <span>0%</span>
                        </div>
                        <div class="score-item">
                            <span>Sleep Quality:</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: 0%"></div>
                            </div>
                            <span>0%</span>
                        </div>
                        <div class="score-item">
                            <span>Consistency:</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: 0%"></div>
                            </div>
                            <span>0%</span>
                        </div>
                    </div>
                </div>
                
                <div class="feedback-section">
                    <h3>💡 Recommendations</h3>
                    <div class="recommendations">
                        <div class="recommendation-item high">
                            <div class="rec-icon">🚶‍♂️</div>
                            <div class="rec-content">
                                <strong>Start Tracking Your Activity</strong>
                                <p>Begin by logging your daily steps, sleep, and water intake to get personalized insights.</p>
                            </div>
                        </div>
                        <div class="recommendation-item medium">
                            <div class="rec-icon">📊</div>
                            <div class="rec-content">
                                <strong>Set Your First Goals</strong>
                                <p>Establish achievable daily targets like 8,000 steps or 8 hours of sleep.</p>
                            </div>
                        </div>
                        <div class="recommendation-item low">
                            <div class="rec-icon">💪</div>
                            <div class="rec-content">
                                <strong>Build Healthy Habits</strong>
                                <p>Start with small, consistent changes that you can maintain long-term.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="feedback-section">
                    <h3>📈 Progress Insights</h3>
                    <div class="insights-grid">
                        <div class="insight-item">
                            <div class="insight-icon">🎯</div>
                            <div class="insight-text">
                                <strong>Getting Started</strong>
                                <span class="neutral">Ready to begin</span>
                                <p>Log your first day of activity to start seeing personalized insights!</p>
                            </div>
                        </div>
                        <div class="insight-item">
                            <div class="insight-icon">📱</div>
                            <div class="insight-text">
                                <strong>Track Daily</strong>
                                <span class="positive">Recommended</span>
                                <p>Consistent tracking leads to better health outcomes and insights.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    if (type === 'insights') {
        // Generate personalized feedback
        const feedback = generatePersonalizedFeedback(history);
        statsPanel.innerHTML = `
            <div class="feedback-container">
                <div class="feedback-section">
                    <h3>🎯 Your Health Score: ${feedback.overallScore}/100</h3>
                    <div class="score-breakdown">
                        <div class="score-item">
                            <span>Activity Level:</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${feedback.scores.activity}%"></div>
                            </div>
                            <span>${feedback.scores.activity}%</span>
                        </div>
                        <div class="score-item">
                            <span>Sleep Quality:</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${feedback.scores.sleep}%"></div>
                            </div>
                            <span>${feedback.scores.sleep}%</span>
                        </div>
                        <div class="score-item">
                            <span>Consistency:</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${feedback.scores.consistency}%"></div>
                            </div>
                            <span>${feedback.scores.consistency}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="feedback-section">
                    <h3>💡 Recommendations</h3>
                    <div class="recommendations">
                        ${feedback.recommendations.map(rec => `
                            <div class="recommendation-item ${rec.priority}">
                                <div class="rec-icon">${rec.icon}</div>
                                <div class="rec-content">
                                    <strong>${rec.title}</strong>
                                    <p>${rec.message}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="feedback-section">
                    <h3>📈 Progress Insights</h3>
                    <div class="insights-grid">
                        ${feedback.insights.map(insight => `
                            <div class="insight-item">
                                <div class="insight-icon">${insight.icon}</div>
                                <div class="insight-text">
                                    <strong>${insight.metric}</strong>
                                    <span class="${insight.trend}">${insight.change}</span>
                                    <p>${insight.description}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    } else {
        // Regular statistics for other tabs
        const totalSteps = history.reduce((sum, day) => sum + Number(day.steps || 0), 0);
        const avgSteps = Math.round(totalSteps / history.length);
        const bestDay = history.reduce((best, cur) => Number(cur.steps) > Number(best.steps) ? cur : best, history[0]);
        let streak = 0;
        for (let i = history.length - 1; i >= 0; i--) {
            if (Number(history[i].steps) > 5000) streak++;
            else break;
        }
        const thisWeek = history.slice(-7);
        const lastWeek = history.slice(-14, -7);
        const thisWeekAvg = Math.round(thisWeek.reduce((sum, d) => sum + Number(d.steps || 0), 0) / Math.max(thisWeek.length, 1));
        const lastWeekAvg = Math.round(lastWeek.reduce((sum, d) => sum + Number(d.steps || 0), 0) / Math.max(lastWeek.length, 1));
        const improvement = lastWeekAvg ? Math.round((thisWeekAvg - lastWeekAvg) / lastWeekAvg * 100) : 0;
        const goalsComplete = history.filter(d =>
            Number(d.steps) >= 10000 && Number(d.calories) >= 500 && Number(d.water) >= 8 && Number(d.sleep) >= 7
        ).length;

        // For comparison chart, show day-to-day comparison
        if (type === 'comparison') {
            const today = history[history.length - 1] || { steps: 0, calories: 0, water: 0, sleep: 0, active: 0 };
            const yesterday = history[history.length - 2] || { steps: 0, calories: 0, water: 0, sleep: 0, active: 0 };
            const lastWeek = history[history.length - 8] || { steps: 0, calories: 0, water: 0, sleep: 0, active: 0 };
            
            // Calculate changes
            const changes = {
                steps: (today.steps || 0) - (yesterday.steps || 0),
                calories: (today.calories || 0) - (yesterday.calories || 0),
                water: (today.water || 0) - (yesterday.water || 0),
                sleep: (today.sleep || 0) - (yesterday.sleep || 0),
                active: (today.active || 0) - (yesterday.active || 0)
            };
            
            const weeklyChanges = {
                steps: (today.steps || 0) - (lastWeek.steps || 0),
                calories: (today.calories || 0) - (lastWeek.calories || 0),
                water: (today.water || 0) - (lastWeek.water || 0),
                sleep: (today.sleep || 0) - (lastWeek.sleep || 0),
                active: (today.active || 0) - (lastWeek.active || 0)
            };
            
            statsPanel.innerHTML = `
                <div class="comparison-panel">
                    <h3>📊 Progress Comparison</h3>
                    
                    <div class="comparison-section">
                        <h4>📅 Today vs Yesterday</h4>
                        <div class="comparison-list">
                            <div class="comparison-item">
                                <div class="comp-icon">🚶‍♂️</div>
                                <div class="comp-details">
                                    <div class="comp-name">Steps</div>
                                    <div class="comp-values">
                                        <span class="today">${today.steps || 0}</span>
                                        <span class="vs">vs</span>
                                        <span class="yesterday">${yesterday.steps || 0}</span>
                                    </div>
                                    <div class="comp-change ${changes.steps >= 0 ? 'positive' : 'negative'}">
                                        ${changes.steps >= 0 ? '+' : ''}${changes.steps}
                                    </div>
                                </div>
                            </div>
                            <div class="comparison-item">
                                <div class="comp-icon">🔥</div>
                                <div class="comp-details">
                                    <div class="comp-name">Calories</div>
                                    <div class="comp-values">
                                        <span class="today">${today.calories || 0}</span>
                                        <span class="vs">vs</span>
                                        <span class="yesterday">${yesterday.calories || 0}</span>
                                    </div>
                                    <div class="comp-change ${changes.calories >= 0 ? 'positive' : 'negative'}">
                                        ${changes.calories >= 0 ? '+' : ''}${changes.calories}
                                    </div>
                                </div>
                            </div>
                            <div class="comparison-item">
                                <div class="comp-icon">💧</div>
                                <div class="comp-details">
                                    <div class="comp-name">Water</div>
                                    <div class="comp-values">
                                        <span class="today">${today.water || 0}</span>
                                        <span class="vs">vs</span>
                                        <span class="yesterday">${yesterday.water || 0}</span>
                                    </div>
                                    <div class="comp-change ${changes.water >= 0 ? 'positive' : 'negative'}">
                                        ${changes.water >= 0 ? '+' : ''}${changes.water}
                                    </div>
                                </div>
                            </div>
                            <div class="comparison-item">
                                <div class="comp-icon">😴</div>
                                <div class="comp-details">
                                    <div class="comp-name">Sleep</div>
                                    <div class="comp-values">
                                        <span class="today">${today.sleep || 0}h</span>
                                        <span class="vs">vs</span>
                                        <span class="yesterday">${yesterday.sleep || 0}h</span>
                                    </div>
                                    <div class="comp-change ${changes.sleep >= 0 ? 'positive' : 'negative'}">
                                        ${changes.sleep >= 0 ? '+' : ''}${changes.sleep}h
                                    </div>
                                </div>
                            </div>
                            <div class="comparison-item">
                                <div class="comp-icon">💪</div>
                                <div class="comp-details">
                                    <div class="comp-name">Exercise</div>
                                    <div class="comp-values">
                                        <span class="today">${today.active || 0}min</span>
                                        <span class="vs">vs</span>
                                        <span class="yesterday">${yesterday.active || 0}min</span>
                                    </div>
                                    <div class="comp-change ${changes.active >= 0 ? 'positive' : 'negative'}">
                                        ${changes.active >= 0 ? '+' : ''}${changes.active}min
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="comparison-section">
                        <h4>📈 Weekly Trend</h4>
                        <div class="weekly-summary">
                            <div class="trend-item">
                                <span>Best Improvement:</span>
                                <strong>${Object.entries(weeklyChanges).reduce((a, b) => weeklyChanges[a[0]] > weeklyChanges[b[0]] ? a : b)[0]}</strong>
                            </div>
                            <div class="trend-item">
                                <span>Days Tracked:</span>
                                <strong>${Math.min(history.length, 7)}/7</strong>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if (type === 'goals') {
            const today = history[history.length - 1] || { steps: 0, calories: 0, water: 0, sleep: 0, active: 0 };
            const dailyGoals = { steps: 10000, calories: 500, water: 8, sleep: 8, active: 30 };
            
            statsPanel.innerHTML = `
                <div class="daily-goals-panel">
                    <h3>📊 Daily Goal Progress</h3>
                    <div class="goal-progress-list">
                        <div class="goal-progress-item">
                            <div class="goal-icon">🚶‍♂️</div>
                            <div class="goal-details">
                                <div class="goal-name">Steps</div>
                                <div class="goal-progress">${today.steps || 0} / ${dailyGoals.steps}</div>
                                <div class="goal-percentage">${Math.round(Math.min((today.steps || 0) / dailyGoals.steps * 100, 100))}%</div>
                            </div>
                        </div>
                        <div class="goal-progress-item">
                            <div class="goal-icon">🔥</div>
                            <div class="goal-details">
                                <div class="goal-name">Calories</div>
                                <div class="goal-progress">${today.calories || 0} / ${dailyGoals.calories}</div>
                                <div class="goal-percentage">${Math.round(Math.min((today.calories || 0) / dailyGoals.calories * 100, 100))}%</div>
                            </div>
                        </div>
                        <div class="goal-progress-item">
                            <div class="goal-icon">💧</div>
                            <div class="goal-details">
                                <div class="goal-name">Water</div>
                                <div class="goal-progress">${today.water || 0} / ${dailyGoals.water} glasses</div>
                                <div class="goal-percentage">${Math.round(Math.min((today.water || 0) / dailyGoals.water * 100, 100))}%</div>
                            </div>
                        </div>
                        <div class="goal-progress-item">
                            <div class="goal-icon">😴</div>
                            <div class="goal-details">
                                <div class="goal-name">Sleep</div>
                                <div class="goal-progress">${today.sleep || 0} / ${dailyGoals.sleep} hours</div>
                                <div class="goal-percentage">${Math.round(Math.min((today.sleep || 0) / dailyGoals.sleep * 100, 100))}%</div>
                            </div>
                        </div>
                        <div class="goal-progress-item">
                            <div class="goal-icon">💪</div>
                            <div class="goal-details">
                                <div class="goal-name">Exercise</div>
                                <div class="goal-progress">${today.active || 0} / ${dailyGoals.active} min</div>
                                <div class="goal-percentage">${Math.round(Math.min((today.active || 0) / dailyGoals.active * 100, 100))}%</div>
                            </div>
                        </div>
                    </div>
                    <div class="daily-summary">
                        <div class="summary-item">
                            <span>Goals Completed Today:</span>
                            <strong>${[
                                (today.steps || 0) >= dailyGoals.steps,
                                (today.calories || 0) >= dailyGoals.calories,
                                (today.water || 0) >= dailyGoals.water,
                                (today.sleep || 0) >= dailyGoals.sleep,
                                (today.active || 0) >= dailyGoals.active
                            ].filter(Boolean).length}/5</strong>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Regular statistics for other tabs
            statsPanel.innerHTML = `
                <div class="stat-item">
                    <div class="stat-value">${totalSteps.toLocaleString()}</div>
                    <div class="stat-label">Total Steps</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${avgSteps}</div>
                    <div class="stat-label">Avg Daily Steps</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${streak}</div>
                    <div class="stat-label">Current Streak (&gt;5K)</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${bestDay ? bestDay.steps : '—'}</div>
                    <div class="stat-label">Best Day (Steps)</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${improvement}%</div>
                    <div class="stat-label">Weekly Improvement</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${goalsComplete}</div>
                    <div class="stat-label">Days All Goals Met</div>
                </div>
            `;
        }
    }
}

// Dark Mode Toggle
document.addEventListener("DOMContentLoaded", () => {
    displayHistory();
    renderChart();

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle').textContent = '☀️ Light Mode';
    }

    // Theme toggle event listener
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
});

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');

    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('theme-toggle').textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
}

// Helper functions for realistic data display
function getMoodEmoji(mood) {
    const moodMap = {
        '5': '😄',
        '4': '😊', 
        '3': '😐',
        '2': '😔',
        '1': '😞'
    };
    return moodMap[mood] || '😐';
}

function getMoodText(mood) {
    const moodMap = {
        '5': 'Excellent',
        '4': 'Good', 
        '3': 'Average',
        '2': 'Low',
        '1': 'Poor'
    };
    return moodMap[mood] || 'Not set';
}

function getSleepQuality(hours) {
    if (hours >= 7 && hours <= 9) return 'Optimal';
    if (hours >= 6 && hours < 7) return 'Good';
    if (hours >= 5 && hours < 6) return 'Fair';
    if (hours < 5) return 'Poor';
    if (hours > 9) return 'Too much';
    return 'Not tracked';
}

function getActivityLevel(minutes) {
    if (minutes >= 150) return 'Excellent';
    if (minutes >= 75) return 'Good';
    if (minutes >= 30) return 'Moderate';
    if (minutes > 0) return 'Light';
    return 'Sedentary';
}

// Auto-calculate distance based on steps
function calculateDistance(steps) {
    return Math.round((steps * 0.0008) * 10) / 10; // Approximate: 0.8m per step
}

// Helper functions for calculations and feedback
function calculateMovingAverage(data, window) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - window + 1);
        const subset = data.slice(start, i + 1);
        const avg = subset.reduce((sum, val) => sum + val, 0) / subset.length;
        result.push(Math.round(avg));
    }
    return result;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getActualValue(index, today) {
    const values = [
        `${today.steps || 0} steps`,
        `${today.calories || 0} cal`,
        `${today.water || 0} glasses`,
        `${today.sleep || 0}h`,
        `${today.active || 0}min`
    ];
    return values[index] || '';
}

function calculateDailyScore(day) {
    const stepScore = Math.min((day.steps || 0) / 10000 * 100, 100);
    const sleepScore = Math.min((day.sleep || 0) / 8 * 100, 100);
    const waterScore = Math.min((day.water || 0) / 8 * 100, 100);
    const exerciseScore = Math.min((day.active || 0) / 30 * 100, 100);
    
    return Math.round((stepScore + sleepScore + waterScore + exerciseScore) / 4);
}

function calculatePerformanceScores(history) {
    const recent = history.slice(-7);
    
    const stepScore = Math.min(recent.reduce((sum, d) => sum + (d.steps || 0), 0) / (7 * 10000) * 100, 100);
    const exerciseScore = Math.min(recent.reduce((sum, d) => sum + (d.active || 0), 0) / (7 * 30) * 100, 100);
    const sleepScore = Math.min(recent.reduce((sum, d) => sum + (d.sleep || 0), 0) / (7 * 8) * 100, 100);
    const hydrationScore = Math.min(recent.reduce((sum, d) => sum + (d.water || 0), 0) / (7 * 8) * 100, 100);
    
    // Consistency score based on how many days they logged
    const consistencyScore = (recent.length / 7) * 100;
    
    // Balance score based on calorie balance
    const balanceScore = recent.reduce((sum, d) => {
        const balance = Math.abs((d.caloriesConsumed || 0) - (d.calories || 0));
        return sum + (balance < 500 ? 100 : Math.max(0, 100 - (balance - 500) / 10));
    }, 0) / Math.max(recent.length, 1);
    
    return [
        Math.round(stepScore),
        Math.round(exerciseScore),
        Math.round(sleepScore),
        Math.round(hydrationScore),
        Math.round(consistencyScore),
        Math.round(balanceScore)
    ];
}

function generatePersonalizedFeedback(history) {
    const recent = history.slice(-7);
    const scores = calculatePerformanceScores(history);
    const overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    
    const recommendations = [];
    const insights = [];
    
    // Generate recommendations based on performance
    if (scores[0] < 70) { // Steps
        recommendations.push({
            icon: '🚶‍♂️',
            title: 'Increase Daily Steps',
            message: 'Try to add 1,000 more steps daily. Take stairs, park farther, or have walking meetings.',
            priority: 'high'
        });
    }
    
    if (scores[2] < 70) { // Sleep
        recommendations.push({
            icon: '😴',
            title: 'Improve Sleep Quality',
            message: 'Aim for 7-9 hours nightly. Create a bedtime routine and avoid screens before bed.',
            priority: 'high'
        });
    }
    
    if (scores[1] < 60) { // Exercise
        recommendations.push({
            icon: '💪',
            title: 'Add More Exercise',
            message: 'Include 150 minutes of moderate exercise weekly. Start with 20-minute sessions.',
            priority: 'medium'
        });
    }
    
    if (scores[3] < 80) { // Hydration
        recommendations.push({
            icon: '💧',
            title: 'Stay Hydrated',
            message: 'Drink water regularly throughout the day. Set reminders if needed.',
            priority: 'medium'
        });
    }
    
    // Generate insights
    if (recent.length >= 2) {
        const stepTrend = recent[recent.length - 1].steps - recent[0].steps;
        insights.push({
            icon: '📈',
            metric: 'Step Trend',
            change: stepTrend > 0 ? `+${stepTrend}` : `${stepTrend}`,
            trend: stepTrend > 0 ? 'positive' : stepTrend < 0 ? 'negative' : 'neutral',
            description: stepTrend > 0 ? 'Great progress!' : stepTrend < 0 ? 'Try to be more active' : 'Maintaining level'
        });
    }
    
    const avgMood = recent.reduce((sum, d) => sum + (parseInt(d.mood) || 3), 0) / recent.length;
    insights.push({
        icon: '😊',
        metric: 'Mood Average',
        change: `${avgMood.toFixed(1)}/5`,
        trend: avgMood >= 4 ? 'positive' : avgMood >= 3 ? 'neutral' : 'negative',
        description: avgMood >= 4 ? 'Feeling great!' : avgMood >= 3 ? 'Balanced mood' : 'Focus on wellness'
    });
    
    return {
        overallScore,
        scores: {
            activity: scores[0],
            sleep: scores[2],
            consistency: scores[4]
        },
        recommendations,
        insights
    };
}

// Navigation scroll functions
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function scrollToSection(elementId) {
    let element = document.getElementById(elementId);
    
    // If dashboard-cards doesn't exist, find the Today's Progress section
    if (!element && elementId === 'dashboard-cards') {
        const headings = document.querySelectorAll('h2');
        for (let heading of headings) {
            if (heading.textContent.includes("Today's Progress")) {
                element = heading.closest('.card');
                break;
            }
        }
    }
    
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function scrollToChartsAndShowTrends() {
    // First try to find the Fitness History section, then fallback to charts section
    let targetSection = null;
    
    const headings = document.querySelectorAll('h2');
    for (let heading of headings) {
        if (heading.textContent.includes("Fitness History")) {
            targetSection = heading.closest('.card');
            break;
        }
    }
    
    // If Fitness History section not found, scroll to charts section
    if (!targetSection) {
        targetSection = document.querySelector('.hero-charts-section');
    }
    
    if (targetSection) {
        targetSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
    
    // Then switch to trends chart after a short delay
    setTimeout(() => {
        if (typeof showChart === 'function') {
            showChart('trends');
        }
    }, 500);
}

// Auto-fill distance when steps change
document.addEventListener('DOMContentLoaded', function() {
    const stepsInput = document.getElementById('steps-input');
    const distanceInput = document.getElementById('distance-input');
    
    if (stepsInput && distanceInput) {
        stepsInput.addEventListener('input', function() {
            const steps = parseInt(this.value) || 0;
            const distance = calculateDistance(steps);
            distanceInput.value = distance;
        });
    }
    
    // Set today's date as default
    const dateInput = document.getElementById('date-input');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
});

