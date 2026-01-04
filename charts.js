// 图表配置和工具函数
class ChartManager {
    constructor() {
        this.charts = new Map();
        // 初始化时检查一次，后续由 app.js 更新
        this.chartAvailable = typeof Chart !== 'undefined';
        this.fallbackMode = !this.chartAvailable; 
        
        if (this.fallbackMode) {
            this.initFallbackStyles();
        }
    }
    
    // 初始化降级样式
    initFallbackStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .chart-fallback {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                background: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
            }
            .fallback-icon {
                font-size: 48px;
                color: #ccc;
                margin-bottom: 15px;
            }
            .fallback-text {
                color: #666;
                font-size: 14px;
                margin-bottom: 10px;
            }
            .fallback-value {
                font-size: 24px;
                font-weight: bold;
                color: #333;
                margin: 10px 0;
            }
            .fallback-progress {
                width: 100%;
                height: 10px;
                background: #e0e0e0;
                border-radius: 5px;
                overflow: hidden;
                margin: 15px 0;
            }
            .fallback-progress-bar {
                height: 100%;
                background: #2D862D;
                border-radius: 5px;
                transition: width 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 创建KPI仪表盘（带降级处理）
    createKPIGauge(elementId, value, maxValue, title, unit = '') {
        const element = document.getElementById(elementId);
        if (!element) return null;
        
        // 如果全局 Chart 对象突然有了（因为异步加载完成了），尝试更新状态
        if (typeof Chart !== 'undefined' && !this.chartAvailable) {
            this.chartAvailable = true;
            this.fallbackMode = false;
        }

        if (typeof Chart === 'undefined') return null;
        
        try {
            const ctx = element.getContext('2d');
            if (!ctx) {
                console.warn(`Canvas context not found for ${elementId}, using fallback`);
                return this.createFallbackGauge(elementId, value, maxValue, title, unit);
            }
            
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
        } catch (error) {
            console.error(`Error creating chart for ${elementId}:`, error);
            return this.createFallbackGauge(elementId, value, maxValue, title, unit);
        }
    }
    
    // 降级模式：HTML/CSS模拟仪表盘
    createFallbackGauge(elementId, value, maxValue, title, unit = '') {
        const element = document.getElementById(elementId);
        if (!element) return null;
        
        // 如果是canvas元素，替换为div
        if (element.tagName === 'CANVAS') {
            const parent = element.parentElement;
            const fallbackDiv = document.createElement('div');
            fallbackDiv.className = 'chart-fallback';
            fallbackDiv.id = `${elementId}-fallback`;
            
            const percentage = Math.round((value / maxValue) * 100);
            let statusColor = '#2D862D';
            let statusText = '正常';
            
            if (percentage >= 90) {
                statusColor = '#2D862D';
                statusText = '正常';
            } else if (percentage >= 70) {
                statusColor = '#FFD700';
                statusText = '警告';
            } else {
                statusColor = '#FF0000';
                statusText = '危险';
            }
            
            fallbackDiv.innerHTML = `
                <div class="fallback-icon">
                    <i class="fas fa-chart-pie"></i>
                </div>
                <div class="fallback-value">${value}${unit}</div>
                <div class="fallback-text">${title}</div>
                <div class="fallback-progress">
                    <div class="fallback-progress-bar" style="width: ${percentage}%; background: ${statusColor};"></div>
                </div>
                <div class="fallback-text">${percentage}% - ${statusText}</div>
            `;
            
            parent.replaceChild(fallbackDiv, element);
            return {
                destroy: () => fallbackDiv.remove(),
                update: (newValue) => {
                    const newPercentage = Math.round((newValue / maxValue) * 100);
                    fallbackDiv.querySelector('.fallback-value').textContent = `${newValue}${unit}`;
                    fallbackDiv.querySelector('.fallback-progress-bar').style.width = `${newPercentage}%`;
                    fallbackDiv.querySelector('.fallback-text:last-child').textContent =
                        `${newPercentage}% - ${statusText}`;
                }
            };
        }
        
        return null;
    }
    
// [charts.js] 修改 createIVCurve 函数
    createIVCurve(elementId, datasets, title) {
        const element = document.getElementById(elementId);
        if (!element) return null;
        
        // --- 修改开始：移除备用曲线调用 ---
        // 如果 Chart.js 不可用，直接返回 null，不再尝试绘制备用曲线
        if (typeof Chart === 'undefined' || this.fallbackMode || !this.chartAvailable) {
            console.warn(`[ChartManager] Chart.js 未就绪，跳过绘制 I-V 曲线: ${elementId}`);
            return null;
        }
        // --- 修改结束 ---
        
        try {
            const ctx = element.getContext('2d');
            
            // 销毁旧实例（防止 ID 冲突）
            const existingChart = Chart.getChart(element);
            if (existingChart) {
                existingChart.destroy();
            }
            
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
                            type: 'linear', // 确保 x 轴是线性刻度
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
        } catch (error) {
            console.error(`Error creating IV curve for ${elementId}:`, error);
            return null;
        }
    }
    
    // 降级模式：使用备用图表绘制I-V曲线
    createFallbackIVCurve(elementId, datasets, title) {
        const element = document.getElementById(elementId);
        if (!element) return null;
        
        if (element.tagName === 'CANVAS') {
            try {
                // 检查是否有备用图表实现
                if (typeof Chart !== 'undefined') {
                    const ctx = element.getContext('2d');
                    if (!ctx) {
                        throw new Error('Canvas context not available');
                    }
                    
                    // 转换数据格式为备用图表所需的格式
                    const chartDatasets = datasets.map((dataset, index) => ({
                        label: dataset.label,
                        data: dataset.data.map(point => ({
                            x: point.x,
                            y: point.y
                        })),
                        borderColor: dataset.color || this.getColor(index),
                        backgroundColor: dataset.fill ? `${this.getColor(index)}20` : 'transparent',
                        borderWidth: 3,
                        fill: dataset.fill || false,
                        tension: 0.4
                    }));
                    
                    // 创建备用图表
                    const chart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            datasets: chartDatasets
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                title: {
                                    display: true,
                                    text: title + ' (备用模式)',
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
                            }
                        }
                    });
                    
                    this.charts.set(elementId, chart);
                    return chart;
                } else {
                    // 如果连备用图表都没有，则显示简单的SVG折线图
                    return this.createSimpleSVGIVCurve(elementId, datasets, title);
                }
            } catch (error) {
                console.error('Error creating fallback IV curve:', error);
                // 如果备用图表也失败，则显示简单的SVG折线图
                return this.createSimpleSVGIVCurve(elementId, datasets, title);
            }
        }
        
        return null;
    }
    
    // 创建简单的SVG折线图作为最终备用方案
    createSimpleSVGIVCurve(elementId, datasets, title) {
        const element = document.getElementById(elementId);
        if (!element) return null;
        
        const parent = element.parentElement;
        const container = document.createElement('div');
        container.className = 'chart-fallback';
        container.id = `${elementId}-fallback`;
        container.style.height = '100%';
        container.style.position = 'relative';
        
        // 创建SVG元素
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 800 400');
        svg.style.backgroundColor = '#f8f9fa';
        svg.style.borderRadius = '8px';
        
        // 添加标题
        const titleText = document.createElementNS(svgNS, 'text');
        titleText.setAttribute('x', '400');
        titleText.setAttribute('y', '30');
        titleText.setAttribute('text-anchor', 'middle');
        titleText.setAttribute('font-size', '16');
        titleText.setAttribute('font-weight', 'bold');
        titleText.setAttribute('fill', '#333');
        titleText.textContent = title + ' (SVG备用)';
        svg.appendChild(titleText);
        
        // 绘制坐标轴
        const drawAxis = () => {
            // X轴
            const xAxis = document.createElementNS(svgNS, 'line');
            xAxis.setAttribute('x1', '50');
            xAxis.setAttribute('y1', '350');
            xAxis.setAttribute('x2', '750');
            xAxis.setAttribute('y2', '350');
            xAxis.setAttribute('stroke', '#666');
            xAxis.setAttribute('stroke-width', '2');
            svg.appendChild(xAxis);
            
            // Y轴
            const yAxis = document.createElementNS(svgNS, 'line');
            yAxis.setAttribute('x1', '50');
            yAxis.setAttribute('y1', '50');
            yAxis.setAttribute('x2', '50');
            yAxis.setAttribute('y2', '350');
            yAxis.setAttribute('stroke', '#666');
            yAxis.setAttribute('stroke-width', '2');
            svg.appendChild(yAxis);
            
            // X轴标签
            const xLabel = document.createElementNS(svgNS, 'text');
            xLabel.setAttribute('x', '400');
            xLabel.setAttribute('y', '390');
            xLabel.setAttribute('text-anchor', 'middle');
            xLabel.setAttribute('font-size', '14');
            xLabel.setAttribute('fill', '#333');
            xLabel.textContent = '电压 (V)';
            svg.appendChild(xLabel);
            
            // Y轴标签
            const yLabel = document.createElementNS(svgNS, 'text');
            yLabel.setAttribute('x', '20');
            yLabel.setAttribute('y', '200');
            yLabel.setAttribute('text-anchor', 'middle');
            yLabel.setAttribute('transform', 'rotate(-90, 20, 200)');
            yLabel.setAttribute('font-size', '14');
            yLabel.setAttribute('fill', '#333');
            yLabel.textContent = '电流 (A)';
            svg.appendChild(yLabel);
        };
        
        // 绘制网格
        const drawGrid = () => {
            // 垂直网格线
            for (let i = 1; i < 10; i++) {
                const gridLine = document.createElementNS(svgNS, 'line');
                gridLine.setAttribute('x1', 50 + i * 70);
                gridLine.setAttribute('y1', '50');
                gridLine.setAttribute('x2', 50 + i * 70);
                gridLine.setAttribute('y2', '350');
                gridLine.setAttribute('stroke', 'rgba(0,0,0,0.1)');
                gridLine.setAttribute('stroke-width', '1');
                svg.appendChild(gridLine);
            }
            
            // 水平网格线
            for (let i = 1; i < 6; i++) {
                const gridLine = document.createElementNS(svgNS, 'line');
                gridLine.setAttribute('x1', '50');
                gridLine.setAttribute('y1', 50 + i * 50);
                gridLine.setAttribute('x2', '750');
                gridLine.setAttribute('y2', 50 + i * 50);
                gridLine.setAttribute('stroke', 'rgba(0,0,0,0.1)');
                gridLine.setAttribute('stroke-width', '1');
                svg.appendChild(gridLine);
            }
        };
        
        // 绘制数据线
        const drawDataLines = () => {
            const colors = ['#2D862D', '#FF8C00', '#00BFFF', '#808080'];
            
            datasets.forEach((dataset, datasetIndex) => {
                const data = dataset.data;
                if (data.length === 0) return;
                
                // 创建折线路径
                let pathData = '';
                data.forEach((point, pointIndex) => {
                    const x = 50 + (point.x / 650) * 700; // 假设最大电压650V
                    const y = 350 - (point.y / 10) * 300; // 假设最大电流10A
                    
                    if (pointIndex === 0) {
                        pathData = `M ${x},${y}`;
                    } else {
                        pathData += ` L ${x},${y}`;
                    }
                });
                
                const path = document.createElementNS(svgNS, 'path');
                path.setAttribute('d', pathData);
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', colors[datasetIndex % colors.length]);
                path.setAttribute('stroke-width', '3');
                path.setAttribute('stroke-linejoin', 'round');
                path.setAttribute('stroke-linecap', 'round');
                svg.appendChild(path);
                
                // 添加图例
                const legendX = 600;
                const legendY = 80 + datasetIndex * 25;
                
                const legendLine = document.createElementNS(svgNS, 'line');
                legendLine.setAttribute('x1', legendX);
                legendLine.setAttribute('y1', legendY);
                legendLine.setAttribute('x2', legendX + 30);
                legendLine.setAttribute('y2', legendY);
                legendLine.setAttribute('stroke', colors[datasetIndex % colors.length]);
                legendLine.setAttribute('stroke-width', '3');
                svg.appendChild(legendLine);
                
                const legendText = document.createElementNS(svgNS, 'text');
                legendText.setAttribute('x', legendX + 40);
                legendText.setAttribute('y', legendY + 5);
                legendText.setAttribute('font-size', '12');
                legendText.setAttribute('fill', '#333');
                legendText.textContent = dataset.label;
                svg.appendChild(legendText);
            });
        };
        
        drawAxis();
        drawGrid();
        drawDataLines();
        
        container.appendChild(svg);
        
        // 添加说明文本
        const infoText = document.createElement('div');
        infoText.style.position = 'absolute';
        infoText.style.bottom = '10px';
        infoText.style.left = '0';
        infoText.style.right = '0';
        infoText.style.textAlign = 'center';
        infoText.style.fontSize = '12px';
        infoText.style.color = '#666';
        infoText.textContent = '使用SVG绘制的I-V曲线（备用模式）';
        container.appendChild(infoText);
        
        parent.replaceChild(container, element);
        
        return {
            destroy: () => container.remove(),
            update: () => {
                console.warn('SVG fallback IV curve does not support dynamic updates');
            }
        };
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
    
// [charts.js] 替换原有的 createDiscrepancyChart 函数
    createDiscrepancyChart(elementId, data, title) {
        const element = document.getElementById(elementId);
        if (!element) return null;

        // 1. 安全检查：如果 Chart 库还没加载好，直接返回 null
        if (typeof Chart === 'undefined') {
            console.warn(`[ChartManager] Chart.js 尚未加载，跳过创建离散度图表: ${elementId}`);
            return null;
        }

        try {
            const ctx = element.getContext('2d');
            
            // 2. 关键修复：销毁已存在的图表实例
            const existingChart = Chart.getChart(element);
            if (existingChart) {
                existingChart.destroy();
            }
            
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
        } catch (error) {
            console.error(`[ChartManager] 创建离散度图表失败 (${elementId}):`, error);
            return null;
        }
    }
    
    // [charts.js] 替换原有的 createEnvironmentChart 函数
    createEnvironmentChart(elementId, data, title) {
        const element = document.getElementById(elementId);
        if (!element) return null;

        // 1. 安全检查：如果 Chart 库还没加载好，直接返回 null，防止报错
        if (typeof Chart === 'undefined') {
            console.warn(`[ChartManager] Chart.js 尚未加载，跳过创建环境图表: ${elementId}`);
            return null; 
        }

        if (typeof Chart === 'undefined') return null;

        try {
            const ctx = element.getContext('2d');
            
            // 3. 关键修复：销毁已存在的图表实例，防止 ID 冲突
            // Chart.js 3.x+ 写法
            const existingChart = Chart.getChart(element);
            if (existingChart) {
                existingChart.destroy();
            }
            
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
        } catch (error) {
            console.error(`[ChartManager] 创建环境图表失败 (${elementId}):`, error);
            return null;
        }
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