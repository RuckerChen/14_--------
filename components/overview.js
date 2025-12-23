class OverviewView {
    constructor() {
        this.container = document.getElementById('overview-view');
        this.chartManager = window.chartManager;
    }
    
    render() {
        const data = window.systemData;
        
        this.container.innerHTML = `
            <div class="overview-container">
                <!-- KPI指标 -->
                <div class="kpi-container">
                    ${this.renderKPIs(data.kpis, data)}
                </div>
                
                <!-- 地图和状态 -->
                <div class="grid grid-2">
                    <!-- 地图热力图 -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">
                                <i class="fas fa-map"></i>
                                光伏阵列热力图
                            </h3>
                            <div class="card-actions">
                                <button class="btn btn-secondary" id="refresh-map">
                                    <i class="fas fa-sync-alt"></i> 刷新
                                </button>
                            </div>
                        </div>
                        <div class="heatmap-container" id="heatmap">
                            <div class="heatmap-grid">
                                ${this.generateHeatmapGrid()}
                            </div>
                        </div>
                        <div class="heatmap-legend">
                            <span>低</span>
                            <div class="gradient-bar"></div>
                            <span>高</span>
                        </div>
                    </div>
                    
                    <!-- 环境参数 -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">
                                <i class="fas fa-cloud-sun"></i>
                                环境监测
                            </h3>
                            <span class="status-badge status-normal">
                                ${this.getEnvironmentStatus(data.environment)}
                            </span>
                        </div>
                        <div class="environment-stats">
                            ${this.renderEnvironmentStats(data.environment)}
                        </div>
                        <div class="chart-container">
                            <canvas id="environment-chart"></canvas>
                        </div>
                    </div>
                </div>
                
                <!-- 设备状态和报警 -->
                <div class="grid grid-2">
                    <!-- 设备状态 -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">
                                <i class="fas fa-solar-panel"></i>
                                设备状态概览
                            </h3>
                            <button class="btn btn-secondary" id="device-details">
                                <i class="fas fa-list"></i> 详情
                            </button>
                        </div>
                        <div class="device-summary">
                            ${this.renderDeviceSummary(data.devices)}
                        </div>
                        <div class="chart-container">
                            <canvas id="device-status-chart"></canvas>
                        </div>
                    </div>
                    
                    <!-- 实时报警 -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">
                                <i class="fas fa-exclamation-triangle"></i>
                                实时报警
                                <span class="badge badge-danger">${data.alarms.active}</span>
                            </h3>
                            <button class="btn btn-secondary" id="ack-all-alarms">
                                <i class="fas fa-check-double"></i> 全部确认
                            </button>
                        </div>
                        <div class="alarm-list">
                            ${this.renderAlarmList(data.alarms.list)}
                        </div>
                    </div>
                </div>
                
                <!-- 发电性能 -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-chart-line"></i>
                            发电性能分析
                        </h3>
                        <div class="time-selector">
                            <select id="time-range">
                                <option value="today">今日</option>
                                <option value="week">本周</option>
                                <option value="month">本月</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-2">
                        <div class="chart-container">
                            <canvas id="generation-chart"></canvas>
                        </div>
                        <div class="chart-container">
                            <canvas id="performance-chart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.initCharts();
        this.bindEvents();
    }
    
    renderKPIs(kpis, data) {
        return `
            <div class="kpi-card">
                <div class="kpi-label">当前总功率</div>
                <div class="kpi-value">${kpis.totalPower.toFixed(2)}</div>
                <div class="kpi-unit">MW</div>
                <div class="kpi-trend trend-up">
                    <i class="fas fa-arrow-up"></i> 2.3%
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">当日发电量</div>
                <div class="kpi-value">${kpis.dailyGeneration.toFixed(1)}</div>
                <div class="kpi-unit">MWh</div>
                <div class="kpi-trend trend-up">
                    <i class="fas fa-arrow-up"></i> 1.8%
                </div>
            </div>
            <div class="kpi-card ${kpis.performanceRatio < 0.9 ? 'medium' : ''}">
                <div class="kpi-label">系统性能比</div>
                <div class="kpi-value">${kpis.performanceRatio.toFixed(2)}</div>
                <div class="kpi-unit">PR</div>
                <div class="kpi-trend ${kpis.performanceRatio < 0.9 ? 'trend-down' : 'trend-up'}">
                    <i class="fas fa-${kpis.performanceRatio < 0.9 ? 'arrow-down' : 'arrow-up'}"></i>
                    ${(kpis.performanceRatio * 100 - 92).toFixed(1)}%
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">当日收益</div>
                <div class="kpi-value">${(kpis.revenueToday / 1000).toFixed(0)}</div>
                <div class="kpi-unit">千元</div>
                <div class="kpi-trend trend-up">
                    <i class="fas fa-arrow-up"></i> 3.1%
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">CO₂减排</div>
                <div class="kpi-value">${kpis.co2Reduction.toFixed(1)}</div>
                <div class="kpi-unit">吨</div>
                <div class="kpi-trend trend-up">
                    <i class="fas fa-leaf"></i> 累计 5.2吨
                </div>
            </div>
            <div class="kpi-card ${data.alarms.critical > 0 ? 'critical' : ''}">
                <div class="kpi-label">活跃报警</div>
                <div class="kpi-value">${data.alarms.active}</div>
                <div class="kpi-unit">个</div>
                <div class="kpi-trend ${data.alarms.critical > 0 ? 'trend-down' : 'trend-up'}">
                    <i class="fas fa-${data.alarms.critical > 0 ? 'exclamation-triangle' : 'check-circle'}"></i>
                    ${data.alarms.critical} 紧急
                </div>
            </div>
        `;
    }
    
    generateHeatmapGrid() {
        let grid = '';
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 12; j++) {
                const power = Math.random() * 100;
                const intensity = Math.min(100, Math.max(0, power));
                const color = this.getHeatmapColor(intensity);
                grid += `
                    <div class="heatmap-cell" 
                         style="background-color: ${color};"
                         data-power="${power.toFixed(1)}"
                         data-row="${i}"
                         data-col="${j}">
                        <div class="cell-label">${(j + 1) + String.fromCharCode(65 + i)}</div>
                    </div>
                `;
            }
        }
        return grid;
    }
    
    getHeatmapColor(intensity) {
        // 从绿色到红色的渐变
        const r = Math.min(255, Math.floor(255 * (intensity / 100)));
        const g = Math.min(255, Math.floor(255 * (1 - intensity / 100)));
        const b = 50;
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    getEnvironmentStatus(env) {
        if (env.saltFogLevel === '高' || env.humidity > 85) return '高湿盐雾';
        if (env.irradiance < 200) return '低辐照度';
        return '正常';
    }
    
    renderEnvironmentStats(env) {
        return `
            <div class="env-stats-grid">
                <div class="env-stat">
                    <div class="env-label">辐照度</div>
                    <div class="env-value">${env.irradiance} W/m²</div>
                    <div class="env-status ${env.irradiance < 500 ? 'status-medium' : 'status-normal'}">
                        ${env.irradiance < 500 ? '偏低' : '正常'}
                    </div>
                </div>
                <div class="env-stat">
                    <div class="env-label">温度</div>
                    <div class="env-value">${env.temperature} °C</div>
                    <div class="env-status ${env.temperature > 35 ? 'status-medium' : 'status-normal'}">
                        ${env.temperature > 35 ? '偏高' : '正常'}
                    </div>
                </div>
                <div class="env-stat">
                    <div class="env-label">湿度</div>
                    <div class="env-value">${env.humidity} %</div>
                    <div class="env-status ${env.humidity > 80 ? 'status-high' : 'status-normal'}">
                        ${env.humidity > 80 ? '高湿' : '正常'}
                    </div>
                </div>
                <div class="env-stat">
                    <div class="env-label">风速</div>
                    <div class="env-value">${env.windSpeed} m/s</div>
                    <div class="env-status status-normal">正常</div>
                </div>
                <div class="env-stat">
                    <div class="env-label">盐雾浓度</div>
                    <div class="env-value">${env.saltFogLevel}</div>
                    <div class="env-status ${env.saltFogLevel === '高' ? 'status-high' : 'status-normal'}">
                        ${env.saltFogLevel === '高' ? '注意' : '正常'}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderDeviceSummary(devices) {
        const totalInverters = devices.inverters.length;
        const normalInverters = devices.inverters.filter(d => d.status === 'normal').length;
        const faultInverters = totalInverters - normalInverters;
        
        return `
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-label">逆变器</div>
                    <div class="summary-value">${totalInverters}台</div>
                    <div class="summary-detail">
                        <span class="status-normal">正常: ${normalInverters}</span>
                        <span class="status-critical">故障: ${faultInverters}</span>
                    </div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">组串</div>
                    <div class="summary-value">${devices.strings.length}路</div>
                    <div class="summary-detail">
                        <span class="status-normal">正常: ${devices.strings.filter(s => s.status === 'normal').length}</span>
                        <span class="status-critical">异常: ${devices.strings.filter(s => s.status !== 'normal').length}</span>
                    </div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">传感器</div>
                    <div class="summary-value">5个</div>
                    <div class="summary-detail">
                        <span class="status-normal">在线: 5</span>
                        <span class="status-standby">离线: 0</span>
                    </div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">系统效率</div>
                    <div class="summary-value">${((normalInverters / totalInverters) * 100).toFixed(1)}%</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(normalInverters / totalInverters) * 100}%"></div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderAlarmList(alarms) {
        if (alarms.length === 0) {
            return '<div class="no-alarms">无活跃报警</div>';
        }
        
        return alarms.map(alarm => `
            <div class="alarm-item ${alarm.type} ${!alarm.acknowledged ? 'unacknowledged' : ''}">
                <div class="alarm-icon">
                    <i class="fas fa-${this.getAlarmIcon(alarm.type)}"></i>
                </div>
                <div class="alarm-content">
                    <div class="alarm-header">
                        <span class="alarm-id">${alarm.id}</span>
                        <span class="alarm-time">${this.formatTime(alarm.timestamp)}</span>
                    </div>
                    <div class="alarm-message">${alarm.message}</div>
                    <div class="alarm-device">设备: ${alarm.device}</div>
                </div>
                <div class="alarm-actions">
                    ${!alarm.acknowledged ? `
                        <button class="btn btn-secondary btn-sm ack-alarm" data-id="${alarm.id}">
                            <i class="fas fa-check"></i> 确认
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary btn-sm view-details" data-id="${alarm.id}">
                        <i class="fas fa-search"></i> 详情
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    getAlarmIcon(type) {
        const icons = {
            'critical': 'fire',
            'high': 'exclamation-triangle',
            'medium': 'exclamation-circle',
            'low': 'info-circle'
        };
        return icons[type] || 'bell';
    }
    
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    }
    
    initCharts() {
        const data = window.systemData;
        
        // 环境雷达图
        this.chartManager.createEnvironmentChart('environment-chart', {
            current: [
                data.environment.irradiance / 10, // 归一化
                data.environment.temperature,
                data.environment.humidity,
                data.environment.windSpeed * 10,
                data.environment.saltFogLevel === '高' ? 80 : 
                data.environment.saltFogLevel === '中等' ? 50 : 20
            ],
            optimal: [85, 25, 60, 25, 20]
        }, '环境参数监测');
        
        // 设备状态饼图
        const deviceStatusData = {
            labels: ['正常', '紧急', '高级', '中级'],
            values: [
                data.devices.inverters.filter(d => d.status === 'normal').length,
                data.devices.inverters.filter(d => d.status === 'critical').length,
                data.devices.inverters.filter(d => d.status === 'high').length,
                data.devices.inverters.filter(d => d.status === 'medium').length
            ],
            colors: ['#2D862D', '#FF0000', '#FF8C00', '#FFD700']
        };
        this.chartManager.createFaultPieChart('device-status-chart', deviceStatusData, '逆变器状态分布');
        
        // 发电量柱状图
        const generationChart = new Chart(
            document.getElementById('generation-chart').getContext('2d'),
            {
                type: 'bar',
                data: {
                    labels: data.historicalData.dailyGeneration.map(d => d.date),
                    datasets: [{
                        label: '日发电量 (MWh)',
                        data: data.historicalData.dailyGeneration.map(d => d.value),
                        backgroundColor: '#2D862D',
                        borderColor: '#247224',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: '近6日发电量',
                            font: { size: 14, weight: 'bold' }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: '发电量 (MWh)'
                            }
                        }
                    }
                }
            }
        );
        
        // 性能比曲线图
        const performanceChart = new Chart(
            document.getElementById('performance-chart').getContext('2d'),
            {
                type: 'line',
                data: {
                    labels: data.historicalData.performanceRatio.map(d => d.hour),
                    datasets: [{
                        label: '性能比 (PR)',
                        data: data.historicalData.performanceRatio.map(d => d.value),
                        borderColor: '#00BFFF',
                        backgroundColor: 'rgba(0, 191, 255, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: '今日性能比变化',
                            font: { size: 14, weight: 'bold' }
                        }
                    },
                    scales: {
                        y: {
                            min: 0,
                            max: 1,
                            title: {
                                display: true,
                                text: '性能比'
                            }
                        }
                    }
                }
            }
        );
        
        // 保存图表引用
        window.chartManager.charts.set('generation-chart', generationChart);
        window.chartManager.charts.set('performance-chart', performanceChart);
    }
    
    bindEvents() {
        // 热力图单元格点击
        this.container.querySelectorAll('.heatmap-cell').forEach(cell => {
            cell.addEventListener('click', (e) => {
                const row = e.target.dataset.row;
                const col = e.target.dataset.col;
                const power = e.target.dataset.power;
                this.showArrayDetails(row, col, power);
            });
        });
        
        // 报警确认
        this.container.querySelectorAll('.ack-alarm').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const alarmId = e.target.closest('.ack-alarm').dataset.id;
                this.acknowledgeAlarm(alarmId);
            });
        });
        
        // 查看报警详情
        this.container.querySelectorAll('.view-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const alarmId = e.target.closest('.view-details').dataset.id;
                this.showAlarmDetails(alarmId);
            });
        });
        
        // 全部确认按钮
        const ackAllBtn = this.container.querySelector('#ack-all-alarms');
        if (ackAllBtn) {
            ackAllBtn.addEventListener('click', () => {
                this.acknowledgeAllAlarms();
            });
        }
        
        // 设备详情按钮
        const deviceDetailsBtn = this.container.querySelector('#device-details');
        if (deviceDetailsBtn) {
            deviceDetailsBtn.addEventListener('click', () => {
                // 切换到二级显示
                document.querySelector('[data-view="unit-control"]').click();
            });
        }
        
        // 刷新地图按钮
        const refreshMapBtn = this.container.querySelector('#refresh-map');
        if (refreshMapBtn) {
            refreshMapBtn.addEventListener('click', () => {
                this.refreshHeatmap();
            });
        }
    }
    
    showArrayDetails(row, col, power) {
        const arrayId = `${String.fromCharCode(65 + parseInt(row))}-${parseInt(col) + 1}`;
        alert(`阵列 ${arrayId}\n当前功率: ${power} kW\n点击"组串控制"查看详情`);
    }
    
    acknowledgeAlarm(alarmId) {
        const alarm = window.systemData.alarms.list.find(a => a.id === alarmId);
        if (alarm) {
            alarm.acknowledged = true;
            this.render(); // 重新渲染
            this.showToast('报警已确认', 'success');
        }
    }
    
    acknowledgeAllAlarms() {
        window.systemData.alarms.list.forEach(alarm => {
            alarm.acknowledged = true;
        });
        this.render();
        this.showToast('所有报警已确认', 'success');
    }
    
    showAlarmDetails(alarmId) {
        const alarm = window.systemData.alarms.list.find(a => a.id === alarmId);
        if (!alarm) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>报警详情 - ${alarm.id}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="alarm-detail-grid">
                        <div class="detail-item">
                            <label>设备:</label>
                            <span>${alarm.device}</span>
                        </div>
                        <div class="detail-item">
                            <label>类型:</label>
                            <span class="status-badge ${alarm.type}">${this.getAlarmTypeText(alarm.type)}</span>
                        </div>
                        <div class="detail-item">
                            <label>时间:</label>
                            <span>${new Date(alarm.timestamp).toLocaleString('zh-CN')}</span>
                        </div>
                        <div class="detail-item">
                            <label>状态:</label>
                            <span>${alarm.acknowledged ? '已确认' : '未确认'}</span>
                        </div>
                        <div class="detail-item full-width">
                            <label>描述:</label>
                            <p>${alarm.message}</p>
                        </div>
                        <div class="detail-item full-width">
                            <label>建议操作:</label>
                            <div class="suggested-actions">
                                ${this.getSuggestedActions(alarm)}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="close-modal">关闭</button>
                    ${!alarm.acknowledged ? `
                        <button class="btn btn-primary" id="ack-modal">确认报警</button>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.getElementById('modal-container').appendChild(modal);
        
        // 绑定事件
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('#close-modal').addEventListener('click', () => modal.remove());
        
        const ackBtn = modal.querySelector('#ack-modal');
        if (ackBtn) {
            ackBtn.addEventListener('click', () => {
                this.acknowledgeAlarm(alarmId);
                modal.remove();
            });
        }
    }
    
    getAlarmTypeText(type) {
        const types = {
            'critical': '紧急',
            'high': '高级',
            'medium': '中级',
            'low': '低级'
        };
        return types[type] || type;
    }
    
    getSuggestedActions(alarm) {
        if (alarm.message.includes('直流拉弧')) {
            return `
                <ol>
                    <li>立即启动快速关断程序</li>
                    <li>检查相关组串的绝缘电阻</li>
                    <li>使用热成像仪检查热点</li>
                    <li>联系维护人员进行现场检查</li>
                </ol>
            `;
        } else if (alarm.message.includes('离散度')) {
            return `
                <ol>
                    <li>检查相关组串的阴影遮挡情况</li>
                    <li>测量各支路电流</li>
                    <li>检查接线盒和连接器</li>
                    <li>如有必要，进行I-V曲线扫描</li>
                </ol>
            `;
        }
        return '请根据标准运维流程进行检查';
    }
    
    refreshHeatmap() {
        const heatmap = this.container.querySelector('.heatmap-grid');
        heatmap.innerHTML = this.generateHeatmapGrid();
        this.bindEvents(); // 重新绑定事件
        this.showToast('热力图已刷新', 'info');
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// 导出组件
window.OverviewView = OverviewView;