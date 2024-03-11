document.addEventListener("DOMContentLoaded", function () {
    // Fetch USD history from usdHistory.json
    fetch('usdHistory.json')
        .then(response => response.json())
        .then(usdHistory => {
            // Create a Chart.js chart
            const ctx = document.getElementById('usdChart').getContext('2d');
            const usdChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: Array.from({ length: usdHistory.length }, (_, i) => i + 1),
                    datasets: [{
                        label: 'USD History',
                        data: usdHistory,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 2,
                        fill: false,
                    }],
                },
                options: {
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'bottom'
                        },
                        y: {
                            beginAtZero: false,
                            ticks: {
                                stepSize: 1, // Customize the step size
                                callback: function(value, index, values) {
                                    // Format y-axis values as needed
                                    return value.toFixed(2);
                                }
                            }
                        }
                    }
                }
            });
        });
});
