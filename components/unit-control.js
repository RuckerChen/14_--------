class UnitControlView {
    constructor() {
        this.container = document.getElementById('unit-control-view');
        this.selectedInverter = null;
    }
    
    render() {
        const data = window.systemData;
        
        this.container.innerHTML = `
            <div class="unit-control-container">
                <!-- 逆变器选择 -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-cogs"></i>
                            逆变器选择
                        </h3>
                        <div class="inverter-filter">
                            <select id="inverter-filter">
                                <option value="all">全部逆变器</option>
                                ${data.devices.inverters.map(inv => `
                                    <option value="${inv.id}">${inv.id}</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="inverter-grid">
                        ${this.renderInverterCards(data.devices.inverters)}
                    </div>
                </div>
                
                <!-- 选中的逆变器详情 -->
                ${this.selectedInverter ? this.renderInverterDetail(this.selectedInverter) : `
                    <div class="card">
                        <div class="placeholder">
                            <i class="fas fa-mouse-pointer"></i>
                            <h3>请选择一个逆变器查看详情</h3>
                            <p>点击上方的逆变器卡片查看详细信息</p>
                        </div>
                    </div>
                `}
                
                <!-- 组串电流离散度分析 -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-chart-bar"></i>
                            组串电流离散度分析
                        </h3>
                        <div class="card-actions">
                            <button class="btn btn-secondary" id="export-discrepancy">
                                <i class="fas fa-download"></i> 导出
                            </button>
                        </div>
                    </div>
                    <div class="chart-container">
                        <canvas id="discrepancy-chart"></canvas>
                    </div>
                    <div class="analysis-summary">
                        ${this.renderDiscrepancyAnalysis(data.devices.strings)}
                    </div>
                </div>
                
                <!-- 能量流向拓扑图 -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-project-diagram"></i>
                            能量流向拓扑图
                        </h3>
                        <div class="card-actions">
                            <button class="btn btn-secondary" id="toggle-animation">
                                <i class="fas fa-play"></i> 动画
                            </button>
                        </div>
                    </div>
                    <div class="topology-container">
                        ${this.renderEnergyTopology()}
                    </div>
                </div>
            </div>
        `;
        
        this.initCharts();
        this.bindEvents();
    }
    
    renderInverterCards(inverters) {
        return inverters.map(inverter => `
            <div class="inverter-card ${inverter.status}" 
                 data-id="${inverter.id}"
                 onclick="unitControlView.selectInverter('${inverter.id}')">
                <div class="inverter-header">
                    <div class="inverter-id">${inverter.id}</div>
                    <div class="status-badge ${inverter.status}">
                        ${this.getStatusText(inverter.status)}
                    </div>
                </div>
                <div class="inverter-stats">
                    <div class="stat">
                        <div class="stat-label">功率</div>
                        <div class="stat-value">${inverter.power.toFixed(2)} MW</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">效率</div>
                        <div class="stat-value">${inverter.efficiency.toFixed(1)}%</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">温度</div>
                        <div class="stat-value">${inverter.temperature.toFixed(1)}°C</div>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${inverter.status}" 
                         style="width: ${(inverter.power / 1.2) * 100}%"></div>
                </div>
            </div>
        `).join('');
    }
    
    getStatusText(status) {
        const statusMap = {
            'normal': '正常',
            'critical': '紧急',
            'high': '高级',
            'medium': '中级',
            'low': '低级'
        };
        return statusMap[status] || status;
    }
    
    selectInverter(inverterId) {
        const data = window.systemData;
        this.selectedInverter = data.devices.inverters.find(inv => inv.id === inverterId);
        this.render();
    }
    
    renderInverterDetail(inverter) {
        const relatedStrings = window.systemData.devices.strings.filter(s => 
            s.id.startsWith(inverter.id.split('-')[1])
        );
        
        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-info-circle"></i>
                        ${inverter.id} - 详细状态
                    </h3>
                    <div class="card-actions">
                        <button class="btn btn-primary" onclick="unitControlView.startIVScan('${inverter.id}')">
                            <i class="fas fa-wave-square"></i> I-V扫描
                        </button>
                        <button class="btn btn-secondary" onclick="unitControlView.showMaintenanceLog('${inverter.id}')">
                            <i class="fas fa-history"></i> 维护记录
                        </button>
                    </div>
                </div>
                
                <div class="inverter-detail-grid">
                    <!-- 基本信息 -->
                    <div class="detail-section">
                        <h4>基本信息</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>状态:</label>
                                <span class="status-badge ${inverter.status}">
                                    ${this.getStatusText(inverter.status)}
                                </span>
                            </div>
                            <div class="detail-item">
                                <label>额定功率:</label>
                                <span>1.2 MW</span>
                            </div>
                            <div class="detail-item">
                                <label>运行时间:</label>
                                <span>2,345 小时</span>
                            </div>
                            <div class="detail-item">
                                <label>安装日期:</label>
                                <span>2023-06-15</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 性能参数 -->
                    <div class="detail-section">
                        <h4>性能参数</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>当前功率:</label>
                                <span>${inverter.power.toFixed(3)} MW</span>
                            </div>
                            <div class="detail-item">
                                <label>转换效率:</label>
                                <span>${inverter.efficiency.toFixed(1)}%</span>
                            </div>
                            <div class="detail-item">
                                <label>直流电压:</label>
                                <span>650 V</span>
                            </div>
                            <div class="detail-item">
                                <label>交流电压:</label>
                                <span>380 V</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 温度监控 -->
                    <div class="detail-section">
                        <h4>温度监控</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>IGBT温度:</label>
                                <span>${inverter.temperature.toFixed(1)}°C</span>
                            </div>
                            <div class="detail-item">
                                <label>散热器温度:</label>
                                <span>${(inverter.temperature - 5).toFixed(1)}°C</span>
                            </div>
                            <div class="detail-item">
                                <label>环境温度:</label>
                                <span>${window.systemData.environment.temperature}°C</span>
                            </div>
                            <div class="detail-item">
                                <label>温升:</label>
                                <span>${(inverter.temperature - window.systemData.environment.temperature).toFixed(1)}°C</span>
                            </div>
                        </div>
                        <div class="temperature-warning ${inverter.temperature > 50 ? 'high' : ''}">
                            ${inverter.temperature > 50 ? 
                                '⚠️ 温度偏高，建议检查散热系统' : 
                                '温度正常'}
                        </div>
                    </div>
                    
                    <!-- 关联组串 -->
                    <div class="detail-section">
                        <h4>关联组串 (${relatedStrings.length}路)</h4>
                        <div class="string-list">
                            ${relatedStrings.map(string => `
                                <div class="string-item ${string.status}" 
                                     onclick="unitControlView.showStringDetail('${string.id}')">
                                    <div class="string-header">
                                        <span class="string-id">${string.id}</span>
                                        <span class="status-badge ${string.status}">
                                            ${this.getStatusText(string.status)}
                                        </span>
                                    </div>
                                    <div class="string-stats">
                                        <div class="stat">
                                            <span class="label">电流:</span>
                                            <span class="value">${string.current.toFixed(1)} A</span>
                                        </div>
                                        <div class="stat">
                                            <span class="label">电压:</span>
                                            <span class="value">${string.voltage.toFixed(0)} V</span>
                                        </div>
                                        <div class="stat">
                                            <span class="label">功率:</span>
                                            <span class="value">${string.power.toFixed(2)} kW</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderDiscrepancyAnalysis(strings) {
        const currents = strings.map(s => s.current);
        const avgCurrent = currents.reduce((a, b) => a + b, 0) / currents.length;
        const maxDeviation = Math.max(...currents.map(c => Math.abs(c - avgCurrent) / avgCurrent * 100));
        
        let analysis = '';
        if (maxDeviation > 20) {
            analysis = `
                <div class="alert alert-high">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>警告:</strong> 检测到严重离散度 (>20%)，可能存在阴影遮挡或故障
                </div>
            `;
        } else if (maxDeviation > 10) {
            analysis = `
                <div class="alert alert-medium">
                    <i class="fas fa-exclamation-circle"></i>
                    <strong>注意:</strong> 离散度偏高 (>10%)，建议检查
                </div>
            `;
        } else {
            analysis = `
                <div class="alert alert-normal">
                    <i class="fas fa-check-circle"></i>
                    <strong>正常:</strong> 电流离散度在允许范围内
                </div>
            `;
        }
        
        return `
            <div class="analysis-grid">
                <div class="analysis-item">
                    <div class="analysis-label">平均电流</div>
                    <div class="analysis-value">${avgCurrent.toFixed(2)} A</div>
                </div>
                <div class="analysis-item">
                    <div class="analysis-label">最大偏差</div>
                    <div class="analysis-value">${maxDeviation.toFixed(1)}%</div>
                </div>
                <div class="analysis-item">
                    <div class="analysis-label">异常组串</div>
                    <div class="analysis-value">
                        ${strings.filter(s => Math.abs(s.current - avgCurrent) / avgCurrent > 0.2).length} 路
                    </div>
                </div>
                <div class="analysis-item full-width">
                    ${analysis}
                </div>
            </div>
        `;
    }
    
    renderEnergyTopology() {
        return `
            <div class="topology-diagram">
                <!-- 光伏阵列 -->
                <div class="topology-node array-node">
                    <div class="node-icon">
                        <i class="fas fa-solar-panel"></i>
                    </div>
                    <div class="node-label">光伏阵列</div>
                    <div class="node-value">5.2 MW</div>
                </div>
                
                <!-- 直流汇流 -->
                <div class="topology-node combiner-node">
                    <div class="node-icon">
                        <i class="fas fa-bolt"></i>
                    </div>
                    <div class="node-label">直流汇流箱</div>
                    <div class="node-value">650 V DC</div>
                </div>
                
                <!-- 逆变器 -->
                <div class="topology-node inverter-node">
                    <div class="node-icon">
                        <i class="fas fa-exchange-alt"></i>
                    </div>
                    <div class="node-label">逆变器组</div>
                    <div class="node-value">4.12 MW</div>
                </div>
                
                <!-- 交流配电 -->
                <div class="topology-node ac-node">
                    <div class="node-icon">
                        <i class="fas fa-bolt"></i>
                    </div>
                    <div class="node-label">交流配电</div>
                    <div class="node-value">380 V AC</div>
                </div>
                
                <!-- 电网连接 -->
                <div class="topology-node grid-node">
                    <div class="node-icon">
                        <i class="fas fa-plug"></i>
                    </div>
                    <div class="node-label">电网</div>
                    <div class="node-value">3.8 MW</div>
                </div>
                
                <!-- 储能系统 -->
                <div class="topology-node battery-node">
                    <div class="node-icon">
                        <i class="fas fa-car-battery"></i>
                    </div>
                    <div class="node-label">储能系统</div>
                    <div class="node-value">0.32 MW</div>
                </div>
                
                <!-- 连接线 -->
                <div class="topology-line line-1"></div>
                <div class="topology-line line-2"></div>
                <div class="topology-line line-3"></div>
                <div class="topology-line line-4"></div>
                <div class="topology-line line-5"></div>
                
                <!-- 能量流动画 -->
                <div class="energy-flow"></div>
            </div>
        `;
    }
    
    initCharts() {
        const data = window.systemData;
        
        // 离散度分析图
        const discrepancyData = {
            labels: data.devices.strings.map(s => s.id),
            values: data.devices.strings.map(s => s.current),
            colors: data.devices.strings.map(s => 
                s.status === 'critical' ? '#FF0000' :
                s.status === 'high' ? '#FF8C00' :
                s.status === 'medium' ? '#FFD700' : '#2D862D'
            ),
            average: data.devices.strings.reduce((sum, s) => sum + s.current, 0) / data.devices.strings.length
        };
        
        window.chartManager.createDiscrepancyChart(
            'discrepancy-chart', 
            discrepancyData, 
            '组串电流离散度分析'
        );
    }
    
    bindEvents() {
        // 逆变器筛选
        const filterSelect = this.container.querySelector('#inverter-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filterInverters(e.target.value);
            });
        }
        
        // 导出离散度数据
        const exportBtn = this.container.querySelector('#export-discrepancy');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportDiscrepancyData();
            });
        }
        
        // 拓扑图动画
        const toggleAnimBtn = this.container.querySelector('#toggle-animation');
        if (toggleAnimBtn) {
            toggleAnimBtn.addEventListener('click', () => {
                this.toggleTopologyAnimation();
            });
        }
    }
    
    filterInverters(filter) {
        const cards = this.container.querySelectorAll('.inverter-card');
        cards.forEach(card => {
            if (filter === 'all' || card.dataset.id === filter) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    startIVScan(inverterId) {
        alert(`开始对 ${inverterId} 进行I-V曲线扫描...\n预计耗时: 15分钟`);
        // 在实际应用中，这里会调用后端API启动扫描
    }
    
    showMaintenanceLog(inverterId) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${inverterId} - 维护记录</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>日期</th>
                                <th>维护类型</th>
                                <th>描述</th>
                                <th>技术人员</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>2024-01-10</td>
                                <td>定期检查</td>
                                <td>清洁散热器，检查连接</td>
                                <td>张三</td>
                            </tr>
                            <tr>
                                <td>2023-12-05</td>
                                <td>故障维修</td>
                                <td>更换IGBT模块</td>
                                <td>李四</td>
                            </tr>
                            <tr>
                                <td>2023-09-15</td>
                                <td>软件升级</td>
                                <td>固件版本升级至v2.3.1</td>
                                <td>王五</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="close-modal">关闭</button>
                    <button class="btn btn-primary" onclick="unitControlView.addMaintenanceRecord('${inverterId}')">
                        <i class="fas fa-plus"></i> 添加记录
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('modal-container').appendChild(modal);
        
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('#close-modal').addEventListener('click', () => modal.remove());
    }
    
    showStringDetail(stringId) {
        const string = window.systemData.devices.strings.find(s => s.id === stringId);
        if (!string) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>组串详情 - ${string.id}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="string-detail-grid">
                        <div class="detail-section">
                            <h4>电气参数</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <label>电流:</label>
                                    <span>${string.current.toFixed(2)} A</span>
                                </div>
                                <div class="detail-item">
                                    <label>电压:</label>
                                    <span>${string.voltage.toFixed(0)} V</span>
                                </div>
                                <div class="detail-item">
                                    <label>功率:</label>
                                    <span>${string.power.toFixed(2)} kW</span>
                                </div>
                                <div class="detail-item">
                                    <label>填充因子:</label>
                                    <span>${(string.power / (string.current * string.voltage) * 100).toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4>状态分析</h4>
                            <div class="status-analysis">
                                <div class="analysis-item">
                                    <label>健康状态:</label>
                                    <span class="status-badge ${string.status}">
                                        ${this.getStatusText(string.status)}
                                    </span>
                                </div>
                                <div class="analysis-item">
                                    <label>建议操作:</label>
                                    <span>${this.getStringRecommendation(string)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4>实时趋势</h4>
                            <div class="chart-container" style="height: 200px;">
                                <canvas id="string-trend-chart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="close-modal">关闭</button>
                    <button class="btn btn-primary" onclick="unitControlView.generateStringReport('${string.id}')">
                        <i class="fas fa-file-alt"></i> 生成报告
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('modal-container').appendChild(modal);
        
        // 初始化趋势图
        setTimeout(() => {
            this.initStringTrendChart(string);
        }, 100);
        
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('#close-modal').addEventListener('click', () => modal.remove());
    }
    
    getStringRecommendation(string) {
        if (string.status === 'critical') {
            return '立即检查，可能存在严重故障';
        } else if (string.status === 'high') {
            return '建议近期安排检查';
        } else if (string.status === 'medium') {
            return '计划性维护时检查';
        }
        return '运行正常，无需特殊操作';
    }
    
    initStringTrendChart(string) {
        const ctx = document.getElementById('string-trend-chart').getContext('2d');
        
        // 生成模拟趋势数据
        const labels = [];
        const currentData = [];
        const voltageData = [];
        
        for (let i = 0; i < 24; i++) {
            labels.push(`${i}:00`);
            const baseCurrent = string.status === 'critical' ? 2 : string.current;
            const baseVoltage = string.status === 'critical' ? 300 : string.voltage;
            
            currentData.push(baseCurrent + Math.random() * 0.5 - 0.25);
            voltageData.push(baseVoltage + Math.random() * 10 - 5);
        }
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '电流 (A)',
                        data: currentData,
                        borderColor: '#2D862D',
                        backgroundColor: 'rgba(45, 134, 45, 0.1)',
                        borderWidth: 2,
                        yAxisID: 'y',
                        tension: 0.4
                    },
                    {
                        label: '电压 (V)',
                        data: voltageData,
                        borderColor: '#00BFFF',
                        backgroundColor: 'rgba(0, 191, 255, 0.1)',
                        borderWidth: 2,
                        yAxisID: 'y1',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: '电流 (A)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: '电压 (V)'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    }
    
    exportDiscrepancyData() {
        const data = window.systemData.devices.strings;
        const csvContent = "data:text/csv;charset=utf-8," 
            + "组串ID,电流(A),电压(V),功率(kW),状态\n"
            + data.map(s => `${s.id},${s.current},${s.voltage},${s.power},${s.status}`).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "组串离散度分析.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('数据已导出为CSV文件', 'success');
    }
    
    toggleTopologyAnimation() {
        const flow = this.container.querySelector('.energy-flow');
        const btn = this.container.querySelector('#toggle-animation');
        
        if (flow.style.animationPlayState === 'paused' || !flow.style.animationPlayState) {
            flow.style.animationPlayState = 'running';
            btn.innerHTML = '<i class="fas fa-pause"></i> 暂停';
        } else {
            flow.style.animationPlayState = 'paused';
            btn.innerHTML = '<i class="fas fa-play"></i> 动画';
        }
    }
    
    addMaintenanceRecord(inverterId) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>添加维护记录 - ${inverterId}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="maintenance-form">
                        <div class="form-group">
                            <label for="maintenance-date">日期</label>
                            <input type="date" id="maintenance-date" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="maintenance-type">维护类型</label>
                            <select id="maintenance-type" class="form-control" required>
                                <option value="">请选择</option>
                                <option value="定期检查">定期检查</option>
                                <option value="故障维修">故障维修</option>
                                <option value="软件升级">软件升级</option>
                                <option value="部件更换">部件更换</option>
                                <option value="清洁维护">清洁维护</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="maintenance-desc">描述</label>
                            <textarea id="maintenance-desc" class="form-control" rows="3" required></textarea>
                        </div>
                        <div class="form-group">
                            <label for="technician">技术人员</label>
                            <input type="text" id="technician" class="form-control" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancel-modal">取消</button>
                    <button class="btn btn-primary" id="save-maintenance">保存</button>
                </div>
            </div>
        `;
        
        document.getElementById('modal-container').appendChild(modal);
        
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('#cancel-modal').addEventListener('click', () => modal.remove());
        
        modal.querySelector('#save-maintenance').addEventListener('click', () => {
            // 在实际应用中，这里会保存到数据库
            this.showToast('维护记录已保存', 'success');
            modal.remove();
        });
    }
    
    generateStringReport(stringId) {
        alert(`正在生成 ${stringId} 的详细报告...\n报告将包含：\n1. 电气参数分析\n2. 历史趋势\n3. 故障诊断建议\n4. 维护记录`);
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
window.UnitControlView = UnitControlView;
window.unitControlView = new UnitControlView();