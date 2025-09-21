// Data storage (in-memory since localStorage is not available)
let appData = {
    theme: 'light',
    stopwatchTime: 0,
    timerSettings: { minutes: 25, seconds: 0 },
    laps: []
};

// Clock functionality
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false });
    const dateString = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    document.getElementById('digitalClock').textContent = timeString;
    document.getElementById('dateDisplay').textContent = dateString;
}

// Theme system
function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-theme="${theme}"]`).classList.add('active');
    appData.theme = theme;
    showNotification(`Theme changed to ${theme}`);
}

// Tab system
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });

    // Remove active class from all tab buttons
    document.querySelectorAll('.tabs li').forEach(tab => {
        tab.classList.remove('is-active');
    });

    // Show selected tab
    document.getElementById(tabName + 'Tab').style.display = 'block';
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('is-active');
}

// Stopwatch functionality
let stopwatchInterval;
let stopwatchRunning = false;
let stopwatchStartTime = 0;
let stopwatchElapsed = 0;

function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
}

function updateStopwatch() {
    const currentTime = Date.now();
    const elapsed = stopwatchElapsed + (currentTime - stopwatchStartTime);
    document.getElementById('stopwatchDisplay').textContent = formatTime(elapsed);
}

function startStopStopwatch() {
    if (!stopwatchRunning) {
        stopwatchStartTime = Date.now();
        stopwatchInterval = setInterval(updateStopwatch, 10);
        stopwatchRunning = true;
        document.getElementById('startStopBtn').textContent = 'Stop';
        document.getElementById('startStopBtn').className = 'btn-control danger';
        document.getElementById('lapResetBtn').textContent = 'Lap';
    } else {
        clearInterval(stopwatchInterval);
        stopwatchElapsed += Date.now() - stopwatchStartTime;
        stopwatchRunning = false;
        document.getElementById('startStopBtn').textContent = 'Start';
        document.getElementById('startStopBtn').className = 'btn-control success';
        document.getElementById('lapResetBtn').textContent = 'Reset';
    }
}

function lapResetStopwatch() {
    if (stopwatchRunning) {
        // Record lap
        const currentTime = Date.now();
        const elapsed = stopwatchElapsed + (currentTime - stopwatchStartTime);
        const lapNumber = appData.laps.length + 1;
        const lapTime = formatTime(elapsed);

        appData.laps.push({ number: lapNumber, time: lapTime, timestamp: elapsed });
        updateLapsDisplay();
        showNotification(`Lap ${lapNumber} recorded`);
    } else {
        // Reset
        stopwatchElapsed = 0;
        document.getElementById('stopwatchDisplay').textContent = '00:00:00';
    }
}

function clearLaps() {
    appData.laps = [];
    updateLapsDisplay();
    showNotification('Laps cleared');
}

function updateLapsDisplay() {
    const container = document.getElementById('lapsContainer');
    container.innerHTML = '';

    appData.laps.forEach(lap => {
        const lapElement = document.createElement('div');
        lapElement.className = 'lap-item';
        lapElement.innerHTML = `
                    <span><i class="fas fa-flag"></i> Lap ${lap.number}</span>
                    <span>${lap.time}</span>
                `;
        container.appendChild(lapElement);
    });
}

// Timer functionality
let timerInterval;
let timerRunning = false;
let timerPaused = false;
let timerTotalTime = 0;
let timerRemainingTime = 0;
let timerStartTime = 0;

function formatTimerTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
    document.getElementById('timerDisplay').textContent = formatTimerTime(timerRemainingTime);
    updateProgressRing();
}

function updateProgressRing() {
    const circle = document.getElementById('progressCircle');
    const radius = 90;
    const circumference = 2 * Math.PI * radius;

    const progress = timerTotalTime > 0 ? (timerTotalTime - timerRemainingTime) / timerTotalTime : 0;
    const offset = circumference * (1 - progress);

    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = offset;
}

function updateTimer() {
    if (timerRemainingTime > 0) {
        timerRemainingTime--;
        updateTimerDisplay();
    } else {
        clearInterval(timerInterval);
        timerRunning = false;
        document.getElementById('startTimerBtn').textContent = 'Start';
        document.getElementById('startTimerBtn').className = 'btn-control success';
        showNotification('Timer completed! 🎉');

        // Play notification sound effect (visual notification instead)
        document.body.style.backgroundColor = 'var(--secondary-color)';
        setTimeout(() => {
            document.body.style.backgroundColor = 'var(--background-color)';
        }, 200);
    }
}

function startTimer() {
    if (!timerRunning) {
        const minutes = parseInt(document.getElementById('minutesInput').value) || 0;
        const seconds = parseInt(document.getElementById('secondsInput').value) || 0;

        if (timerPaused) {
            // Resume from pause
            timerRunning = true;
            timerPaused = false;
        } else {
            // Start new timer
            timerTotalTime = minutes * 60 + seconds;
            timerRemainingTime = timerTotalTime;
        }

        if (timerRemainingTime > 0) {
            timerInterval = setInterval(updateTimer, 1000);
            timerRunning = true;
            document.getElementById('startTimerBtn').textContent = 'Running';
            document.getElementById('startTimerBtn').className = 'btn-control';
            showNotification('Timer started');
        }
    }
}

function pauseTimer() {
    if (timerRunning) {
        clearInterval(timerInterval);
        timerRunning = false;
        timerPaused = true;
        document.getElementById('startTimerBtn').textContent = 'Resume';
        document.getElementById('startTimerBtn').className = 'btn-control success';
        showNotification('Timer paused');
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timerPaused = false;
    timerRemainingTime = 0;
    timerTotalTime = 0;
    document.getElementById('startTimerBtn').textContent = 'Start';
    document.getElementById('startTimerBtn').className = 'btn-control success';
    updateTimerDisplay();
    showNotification('Timer reset');
}

function setPomodoro(minutes) {
    document.getElementById('minutesInput').value = minutes;
    document.getElementById('secondsInput').value = 0;
    timerTotalTime = minutes * 60;
    timerRemainingTime = timerTotalTime;
    updateTimerDisplay();
    showNotification(`Pomodoro timer set to ${minutes} minutes`);
}

// Notification system
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;

    document.getElementById('notificationArea').appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function () {
    // Start clock
    updateClock();
    setInterval(updateClock, 1000);

    // Theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setTheme(btn.getAttribute('data-theme'));
        });
    });

    // Tab buttons
    document.querySelectorAll('[data-tab]').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(tab.getAttribute('data-tab'));
        });
    });

    // Stopwatch controls
    document.getElementById('startStopBtn').addEventListener('click', startStopStopwatch);
    document.getElementById('lapResetBtn').addEventListener('click', lapResetStopwatch);
    document.getElementById('clearLapsBtn').addEventListener('click', clearLaps);

    // Timer controls
    document.getElementById('startTimerBtn').addEventListener('click', startTimer);
    document.getElementById('pauseTimerBtn').addEventListener('click', pauseTimer);
    document.getElementById('resetTimerBtn').addEventListener('click', resetTimer);

    // Pomodoro presets
    document.getElementById('pomodoro25').addEventListener('click', () => setPomodoro(25));
    document.getElementById('pomodoro15').addEventListener('click', () => setPomodoro(15));
    document.getElementById('pomodoro5').addEventListener('click', () => setPomodoro(5));

    // Initialize timer display
    updateTimerDisplay();

    showNotification('Clock app loaded successfully!');
});

// Keyboard shortcuts
document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case '1':
                e.preventDefault();
                switchTab('clock');
                break;
            case '2':
                e.preventDefault();
                switchTab('stopwatch');
                break;
            case '3':
                e.preventDefault();
                switchTab('timer');
                break;
        }
    }

    // Space bar for start/stop
    if (e.code === 'Space') {
        e.preventDefault();
        const activeTab = document.querySelector('.tabs li.is-active').getAttribute('data-tab');
        if (activeTab === 'stopwatch') {
            startStopStopwatch();
        } else if (activeTab === 'timer') {
            startTimer();
        }
    }
});