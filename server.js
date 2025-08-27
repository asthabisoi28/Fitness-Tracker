const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Database setup
const db = new sqlite3.Database('fitness_tracker.db');

// Initialize database tables
db.serialize(() => {
    // Fitness records table
    db.run(`CREATE TABLE IF NOT EXISTS fitness_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL,
        steps INTEGER DEFAULT 0,
        distance REAL DEFAULT 0,
        calories INTEGER DEFAULT 0,
        calories_consumed INTEGER DEFAULT 0,
        water INTEGER DEFAULT 0,
        sleep REAL DEFAULT 0,
        active INTEGER DEFAULT 0,
        weight REAL,
        mood INTEGER DEFAULT 3,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Goals table
    db.run(`CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        goal_type TEXT NOT NULL,
        target_value REAL NOT NULL,
        current_value REAL DEFAULT 0,
        deadline DATE,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Insert default goals if they don't exist
    db.get("SELECT COUNT(*) as count FROM goals", (err, row) => {
        if (row.count === 0) {
            const defaultGoals = [
                ['daily_steps', 10000, 0, null, 'active'],
                ['daily_calories_burn', 500, 0, null, 'active'],
                ['daily_water', 8, 0, null, 'active'],
                ['daily_sleep', 8, 0, null, 'active'],
                ['weekly_exercise', 150, 0, null, 'active'],
                ['weight_loss', 70, 75, '2024-12-31', 'active']
            ];

            const stmt = db.prepare("INSERT INTO goals (goal_type, target_value, current_value, deadline, status) VALUES (?, ?, ?, ?, ?)");
            defaultGoals.forEach(goal => {
                stmt.run(goal);
            });
            stmt.finalize();
        }
    });
});

// API Routes

// Get all fitness records
app.get('/api/fitness-records', (req, res) => {
    db.all("SELECT * FROM fitness_records ORDER BY date DESC", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Add or update fitness record
app.post('/api/fitness-records', (req, res) => {
    const {
        date, steps, distance, calories, calories_consumed,
        water, sleep, active, weight, mood, notes
    } = req.body;

    const sql = `INSERT OR REPLACE INTO fitness_records 
                 (date, steps, distance, calories, calories_consumed, water, sleep, active, weight, mood, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [date, steps, distance, calories, calories_consumed, water, sleep, active, weight, mood, notes], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            id: this.lastID,
            message: 'Fitness record saved successfully'
        });
    });
});

// Get goals
app.get('/api/goals', (req, res) => {
    db.all("SELECT * FROM goals WHERE status = 'active' ORDER BY created_at", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Update goal
app.put('/api/goals/:id', (req, res) => {
    const { target_value, current_value, deadline, status } = req.body;
    const sql = `UPDATE goals SET target_value = ?, current_value = ?, deadline = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    db.run(sql, [target_value, current_value, deadline, status, req.params.id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Goal updated successfully' });
    });
});

// Add new goal
app.post('/api/goals', (req, res) => {
    const { goal_type, target_value, deadline } = req.body;
    const sql = `INSERT INTO goals (goal_type, target_value, deadline) VALUES (?, ?, ?)`;

    db.run(sql, [goal_type, target_value, deadline], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            id: this.lastID,
            message: 'Goal created successfully'
        });
    });
});

// Delete goal
app.delete('/api/goals/:id', (req, res) => {
    const sql = `DELETE FROM goals WHERE id = ?`;

    db.run(sql, [req.params.id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Goal deleted successfully' });
    });
});

// Get dashboard stats
app.get('/api/dashboard-stats', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's data
    db.get("SELECT * FROM fitness_records WHERE date = ?", [today], (err, todayData) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        // Get last 7 days for trends
        db.all(`SELECT * FROM fitness_records 
                WHERE date >= date('now', '-7 days') 
                ORDER BY date DESC LIMIT 7`, (err, weekData) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            // Calculate stats
            const totalSteps = weekData.reduce((sum, day) => sum + (day.steps || 0), 0);
            const avgSteps = Math.round(totalSteps / Math.max(weekData.length, 1));
            
            let streak = 0;
            for (let i = 0; i < weekData.length; i++) {
                if (weekData[i].steps >= 5000) streak++;
                else break;
            }

            res.json({
                today: todayData || {},
                weekData,
                stats: {
                    totalSteps,
                    avgSteps,
                    streak,
                    daysLogged: weekData.length
                }
            });
        });
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Fitness Tracker Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: fitness_tracker.db`);
    console.log(`🎯 API endpoints available at /api/*`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});