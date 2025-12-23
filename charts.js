// 图表配置和工具函数
class ChartManager {
    constructor() {
        this.charts = new Map();
    }
    
    // 创建KPI仪表盘
    createKPIGauge(elementId, value, maxValue, title, unit = '') {
        const ctx = document.getElementById(elementId).getContext('2d');
        
        // 根据值确定颜色
        let color;
        const percentage = (value / maxValue) * 100;
        if (percentage >= 90) color = '#2D862D'; // 正常
        else if (percentage >= 70) color = '#FFD700'; // 警告
        else color = '#FF0000'; // 危险
        
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [value, maxValue - value],
                    backgroundColor: [color, '#F0F0F0'],
                    borderWidth: 0,
                    circumference: 270,
                    rotation: 135
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '80%',
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            },
            plugins: [{
                id: 'gaugeCenterText',
                afterDraw(chart) {
                    const { ctx, chartArea: { width, height } } = chart;
                    ctx.save();
                    
                    const text = `${value}${unit}`;
                    const subText = title;
                    
                    ctx.font = 'bold 24px Segoe UI';
                    ctx.fillStyle = '#333333';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, width / 2, height / 2 - 10);
                    
                    ctx.font = '12px Segoe UI';
                    ctx.fillStyle = '#666666';
                    ctx.fillText(subText, width / 2, height / 2 + 20);
                    
                    ctx.restore();
                }
            }]
        });
        
        this.charts.set(elementId, chart);
        return chart;
    }
    
    // 创建I-V曲线图
    createIVCurve(elementId, datasets, title) {
        const ctx = document.getElementById(elementId).getContext('2d');
        
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: datasets.map((dataset, index) => ({
                    label: dataset.label,
                    data: dataset.data,
                    borderColor: dataset.color || this.getColor(index),
                    backgroundColor: dataset.fill ? `${this.getColor(index)}20` : 'transparent',
                    borderWidth: 3,
                    fill: dataset.fill || false,
                    tension: 0.4,
                    pointRadius: 0
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'top',
                        labels: { font: { size: 12 } }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: V=${context.parsed.x}V, I=${context.parsed.y}A`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '电压 (V)',
                            font: { size: 14, weight: 'bold' }
                        },
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '电流 (A)',
                            font: { size: 14, weight: 'bold' }
                        },
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
        
        this.charts.set(elementId, chart);
        return chart;
    }
    
    // 创建功率曲线图
    createPowerCurve(elementId, data, title) {
        const ctx = document.getElementById(elementId).getContext('2d');
        
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: '实际功率',
                    data: data.values,
                    borderColor: '#2D862D',
                    backgroundColor: 'rgba(45, 134, 45, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }, {
                    label: '理论功率',
                    data: data.theoretical,
                    borderColor: '#808080',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'top',
                        labels: { font: { size: 12 } }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '时间',
                            font: { size: 14 }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '功率 (kW)',
                            font: { size: 14 }
                        },
                        beginAtZero: true
                    }
                }
            }
        });
        
        this.charts.set(elementId, chart);
        return chart;
    }
    
    // 创建离散度分析图
    createDiscrepancyChart(elementId, data, title) {
        const ctx = document.getElementById(elementId).getContext('2d');
        
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: '电流值',
                    data: data.values,
                    backgroundColor: data.colors,
                    borderColor: data.colors.map(c => this.darkenColor(c, 20)),
                    borderWidth: 1
                }, {
                    label: '平均值',
                    data: Array(data.labels.length).fill(data.average),
                    type: 'line',
                    borderColor: '#FF8C00',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        font: { size: 16, weight: 'bold' }
                    },
                    annotation: {
                        annotations: {
                            threshold: {
                                type: 'line',
                                yMin: data.average * 0.8,
                                yMax: data.average * 0.8,
                                borderColor: '#FF0000',
                                borderWidth: 2,
                                borderDash: [3, 3],
                                label: {
                                    content: '阈值 (80%)',
                                    enabled: true,
                                    position: 'end'
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '组串编号',
                            font: { size: 14 }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '电流 (A)',
                            font: { size: 14 }
                        },
                        beginAtZero: true
                    }
                }
            }
        });
        
        this.charts.set(elementId, chart);
        return chart;
    }
    
    // 创建环境参数图
    createEnvironmentChart(elementId, data, title) {
        const ctx = document.getElementById(elementId).getContext('2d');
        
        const chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['辐照度', '温度', '湿度', '风速', '盐雾浓度'],
                datasets: [{
                    label: '当前值',
                    data: data.current,
                    backgroundColor: 'rgba(0, 191, 255, 0.2)',
                    borderColor: '#00BFFF',
                    borderWidth: 2,
                    pointBackgroundColor: '#00BFFF'
                }, {
                    label: '标准范围',
                    data: data.optimal,
                    backgroundColor: 'rgba(45, 134, 45, 0.1)',
                    borderColor: '#2D862D',
                    borderWidth: 1,
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
                        text: title,
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    r: {
                        angleLines: { display: true },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                }
            }
        });
        
        this.charts.set(elementId, chart);
        return chart;
    }
    
    // 创建故障分类饼图
    createFaultPieChart(elementId, data, title) {
        const ctx = document.getElementById(elementId).getContext('2d');
        
        const chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: data.colors,
                    borderWidth: 1,
                    borderColor: '#FFFFFF'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'right',
                        labels: {
                            font: { size: 12 },
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label;
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value}次 (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        this.charts.set(elementId, chart);
        return chart;
    }
    
    // 辅助函数
    getColor(index) {
        const colors = [
            '#2D862D', // 正常绿
            '#FF8C00', // 高级报警橙
            '#FF0000', // 紧急红
            '#FFD700', // 中级金黄
            '#00BFFF', // 信息青蓝
            '#808080', // 待机灰
            '#4B0082', // 靛蓝
            '#FF69B4'  // 粉红
        ];
        return colors[index % colors.length];
    }
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (
            0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }
    
    // 更新图表数据
    updateChart(elementId, newData) {
        const chart = this.charts.get(elementId);
        if (chart) {
            chart.data = newData;
            chart.update();
        }
    }
    
    // 销毁图表
    destroyChart(elementId) {
        const chart = this.charts.get(elementId);
        if (chart) {
            chart.destroy();
            this.charts.delete(elementId);
        }
    }
}

// 初始化图表管理器
window.chartManager = new ChartManager();