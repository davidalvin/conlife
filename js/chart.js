let liveChart;
let stepCounter = 0;
let sumLive = 0;
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
                x: { title: { display: true, text: 'Steps' } },
                y: { title: { display: true, text: 'Live Cells' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}
function addLiveCells(step, count) {
    if (!liveChart) return;
    sumLive += count;
    stepCounter++;
    if (stepCounter >= 100) {
        const avg = sumLive / stepCounter;
        liveChart.data.datasets[0].data.push({ x: step, y: avg });
        liveChart.update('none');
        stepCounter = 0;
        sumLive = 0;
    }
}
function resetChart() {
    if (liveChart) {
        liveChart.data.datasets[0].data = [];
        liveChart.update('none');
    }
    stepCounter = 0;
    sumLive = 0;
}
window.ChartModule = { initializeChart, addLiveCells, resetChart };
