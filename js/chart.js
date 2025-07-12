let liveChart;
let stepCounter = 0;
let sumLive = 0;
let firstStepInWindow = null;

function initializeChart() {
    const ctx = document.getElementById('liveChart').getContext('2d');
    liveChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Live Cells (avg / 100 steps)',
                data: [],
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76,175,80,0.2)',
                tension: 0.1,
                fill: true,
            }]
        },
        options: {
            animation: false,
            scales: {
                x: { type: 'linear', title: { display: true, text: 'Steps' } },
                y: { title: { display: true, text: 'Live Cells' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function addLiveCells(step, count) {
    if (!liveChart) return;

    if (stepCounter === 0) firstStepInWindow = step;

    sumLive += count;
    stepCounter++;

    if (stepCounter >= 100) {
        const avg = sumLive / stepCounter;
        // Ensure x values are numbers
        const numericFirst = Number(firstStepInWindow);
        const numericStep = Number(step);
        const xValue = numericFirst + Math.floor((numericStep - numericFirst) / 2);
        console.log('addLiveCells x type:', typeof xValue, xValue); // Debug: should be number
        liveChart.data.datasets[0].data.push({ x: xValue, y: avg });
        liveChart.update('none');

        // reset state for next window
        stepCounter = 0;
        sumLive = 0;
        firstStepInWindow = null;
    }
}

function resetChart() {
    if (liveChart) {
        liveChart.data.datasets[0].data = [];
        liveChart.update('none');
    }
    stepCounter = 0;
    sumLive = 0;
    firstStepInWindow = null;
}

window.ChartModule = { initializeChart, addLiveCells, resetChart };
