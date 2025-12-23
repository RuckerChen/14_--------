class DetailView {
    constructor() {
        this.container = document.getElementById('detail-view');
        this.chartManager = window.chartManager;
        this.currentFaultType = null;
    }
    
    render() {
        const data = window.systemData;
        
        this.container.innerHTML = `
            <div class="detail-view-container">
                <!-- 故障诊断主面板 -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-search"></i>
                            故障深度诊断
                        </h3>
                        <div class="diagnosis-controls">
                            <select id="fault-type-select" onchange="detailView.selectFaultType(this.value)">
                                <option value="">选择故障类型</option>
                                <option value="阴影遮挡">阴影遮挡</option>
                                <option value="PID效应">PID效应</option>
                                <option value="盐雾腐蚀">盐雾腐蚀</option>
                                <option value="接线松动">接线松动</option>
                                <option value="电弧故障">电弧故障</option>
                            </select>
                            <button class="btn btn-primary" onclick="detailView.runAIDiagnosis()">
                                <i class="fas fa-brain"></i> AI诊断
                            </button>
                        </div>
                    </div>
                    
                    <div class="diagnosis-content">
                        <!-- I-V曲线对比 -->
                        <div class="diagnosis-section">
                            <h4>I-V曲线对比分析</h4>
                            <div class="chart-container">
                                <canvas id="iv-comparison-chart"></canvas>
                            </div>
                            <div class="curve-controls">
                                <div class="curve-selector">
                                    <label>
                                        <input type="checkbox" id="show-healthy" checked> 健康曲线
                                    </label>
                                    <label>
                                        <input type="checkbox" id="show-faulty" checked> 故障曲线
                                    </label>
                                    <label>
                                        <input type="checkbox" id="show-theoretical"> 理论曲线
                                    </label>
                                </div>
                                <button class="btn btn-secondary" onclick="detailView.exportCurveData()">
                                    <i class="fas fa-download"></i> 导出数据
                                </button>
                            </div>
                        </div>
                        
                        <!-- 故障特征分析 -->
                        <div class="diagnosis-section">
                            <h4>故障特征分析</h4>
                            <div class="feature-analysis">
                                ${this.renderFeatureAnalysis()}
                            </div>
                        </div>
                        
                        <!-- AI诊断结果 -->
                        <div class="diagnosis-section">
                            <h4>AI诊断结果</h4>
                            <div class="ai-results" id="ai-results">
                                ${this.renderAIResults(data.faultDetection.recentFaults)}
                            </div>
                        </div>
                        
                        <!-- 参数追溯 -->
                        <div class="diagnosis-section">
                            <h4>关键参数追溯</h4>
                            <div class="parameter-trace">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>参数</th>
                                            <th>当前值</th>
                                            <th>基准值</th>
                                            <th>偏差</th>
                                            <th>趋势</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${this.renderParameterTrace()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 算法性能对比 -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-chart-bar"></i>
                            检测算法性能对比
                        </h3>
                    </div>
                    <div class="algorithm-comparison">
                        ${this.renderAlgorithmComparison(data.faultDetection.algorithms)}
                    </div>
                </div>
                
                <!-- 维修建议 -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-tools"></i>
                            维修建议与操作指南
                        </h3>
                    </div>
                    <div class="maintenance-guide">
                        ${this.renderMaintenanceGuide()}
                    </div>
                </div>
            </div>
        `;
        
        this.initCharts();
        this.bindEvents();
    }
    
    renderFeatureAnalysis() {
        const features = [
            { name: '填充因子(FF)', healthy: 0.78, current: 0.65, deviation: -16.7, status: 'high' },
            { name: '串联电阻(Rs)', healthy: 0.5, current: 0.8, deviation: +60.0, status: 'critical' },
            { name: '并联电阻(Rsh)', healthy: 300, current: 120, deviation: -60.0, status: 'critical' },
            { name: '绝缘电阻', healthy: 200, current: 85, deviation: -57.5, status: 'high' },
            { name: '温度系数', healthy: -0.3, current: -0.35, deviation: +16.7, status: 'medium' }
        ];
        
        return `
            <div class="feature-grid">
                ${features.map(feature => `
                    <div class="feature-item ${feature.status}">
                        <div class="feature-name">${feature.name}</div>
                        <div class="feature-values">
                            <span class="current-value">${feature.current}</span>
                            <span class="deviation ${feature.deviation > 0 ? 'positive' : 'negative'}">
                                ${feature.deviation > 0 ? '+' : ''}${feature.deviation}%
                            </span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill ${feature.status}" 
                                 style="width: ${Math.min(100, Math.abs(feature.deviation))}%"></div>
                        </div>
                        <div class="feature-status">
                            <span class="status-badge ${feature.status}">
                                ${this.getFeatureStatus(feature.deviation)}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    getFeatureStatus(deviation) {
        const absDev = Math.abs(deviation);
        if (absDev > 50) return '严重异常';
        if (absDev > 30) return '显著异常';
        if (absDev > 10) return '轻微异常';
        return '正常';
    }
    
    renderAIResults(faults) {
        if (faults.length === 0) {
            return '<div class="no-results">暂无AI诊断结果</div>';
        }
        
        return faults.map(fault => `
            <div class="ai-result-item ${fault.resolved ? 'resolved' : 'active'}">
                <div class="ai-result-header">
                    <div class="ai-fault-type">${fault.type}</div>
                    <div class="ai-confidence">
                        <span class="confidence-label">置信度:</span>
                        <span class="confidence-value ${fault.confidence > 80 ? 'high' : fault.confidence > 60 ? 'medium' : 'low'}">
                            ${fault.confidence}%
                        </span>
                    </div>
                </div>
                <div class="ai-result-details">
                    <div class="ai-timestamp">
                        <i class="far fa-clock"></i>
                        ${new Date(fault.timestamp).toLocaleString('zh-CN')}
                    </div>
                    <div class="ai-status">
                        <span class="status-badge ${fault.resolved ? 'status-normal' : 'status-high'}">
                            ${fault.resolved ? '已解决' : '待处理'}
                        </span>
                    </div>
                </div>
                <div class="ai-recommendation">
                    <strong>建议:</strong> ${this.getFaultRecommendation(fault.type)}
                </div>
                ${!fault.resolved ? `
                    <div class="ai-actions">
                        <button class="btn btn-secondary btn-sm" onclick="detailView.markAsResolved('${fault.type}')">
                            <i class="fas fa-check"></i> 标记为已解决
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="detailView.showFaultDetails('${fault.type}')">
                            <i class="fas fa-info-circle"></i> 详情
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }
    
    getFaultRecommendation(faultType) {
        const recommendations = {
            '阴影遮挡': '检查阵列周边遮挡物，清理组件表面',
            'PID效应': '检查接地系统，考虑安装PID恢复装置',
            '盐雾腐蚀': '加强密封措施，定期清洗组件',
            '接线松动': '紧固连接端子，检查接线盒',
            '电弧故障': '立即启动快速关断，检查绝缘系统'
        };
        return recommendations[faultType] || '请根据标准运维流程进行检查';
    }
    
    renderParameterTrace() {
        const parameters = [
            { name: 'Voc (开路电压)', current: 650, baseline: 680, unit: 'V', trend: 'down' },
            { name: 'Isc (短路电流)', current: 8.2, baseline: 9.0, unit: 'A', trend: 'down' },
            { name: 'Vmp (最大功率点电压)', current: 550, baseline: 580, unit: 'V', trend: 'down' },
            { name: 'Imp (最大功率点电流)', current: 7.5, baseline: 8.2, unit: 'A', trend: 'down' },
            { name: 'Pmax (最大功率)', current: 4.12, baseline: 4.75, unit: 'kW', trend: 'down' },
            { name: 'FF (填充因子)', current: 0.65, baseline: 0.78, unit: '', trend: 'down' },
            { name: 'Efficiency (效率)', current: 18.7, baseline: 19.5, unit: '%', trend: 'down' }
        ];
        
        return parameters.map(param => {
            const deviation = ((param.current - param.baseline) / param.baseline * 100).toFixed(1);
            return `
                <tr>
                    <td>${param.name}</td>
                    <td>${param.current}${param.unit}</td>
                    <td>${param.baseline}${param.unit}</td>
                    <td class="${deviation >= 0 ? 'positive' : 'negative'}">
                        ${deviation >= 0 ? '+' : ''}${deviation}%
                    </td>
                    <td>
                        <i class="fas fa-arrow-${param.trend} ${param.trend}"></i>
                        ${param.trend === 'up' ? '上升' : '下降'}
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    renderAlgorithmComparison(algorithms) {
        return `
            <div class="algorithm-grid">
                ${algorithms.map(alg => `
                    <div class="algorithm-card ${alg.status}">
                        <div class="algorithm-header">
                            <h4>${alg.name}</h4>
                            <span class="status-badge ${alg.status === 'active' ? 'status-normal' : 'status-standby'}">
                                ${alg.status === 'active' ? '运行中' : '待机'}
                            </span>
                        </div>
                        <div class="algorithm-stats">
                            <div class="stat">
                                <div class="stat-label">识别准确率</div>
                                <div class="stat-value">${alg.accuracy}%</div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${alg.accuracy}%"></div>
                                </div>
                            </div>
                            <div class="stat">
                                <div class="stat-label">平均响应时间</div>
                                <div class="stat-value">${alg.responseTime}ms</div>
                            </div>
                        </div>
                        <div class="algorithm-actions">
                            <button class="btn btn-secondary btn-sm" onclick="detailView.toggleAlgorithm('${alg.name}')">
                                ${alg.status === 'active' ? '暂停' : '启动'}
                            </button>
                            <button class="btn btn-secondary btn-sm" onclick="detailView.showAlgorithmDetails('${alg.name}')">
                                详情
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderMaintenanceGuide() {
        return `
            <div class="guide-container">
                <div class="guide-section">
                    <h5>紧急故障处理流程</h5>
                    <ol>
                        <li>确认故障类型和位置</li>
                        <li>启动快速关断程序（NEC 690.12）</li>
                        <li>隔离故障设备</li>
                        <li>使用绝缘测试仪检查</li>
                        <li>联系专业维护人员</li>
                    </ol>
                </div>
                
                <div class="guide-section">
                    <h5>预防性维护建议</h5>
                    <ul>
                        <li>每月检查绝缘电阻（目标值 > 1MΩ）</li>
                        <li>每季度清洗组件（盐雾地区需加密）</li>
                        <li>每半年检查连接端子扭矩</li>
                        <li>每年进行I-V曲线全面扫描</li>
                        <li>建立组件老化趋势档案</li>
                    </ul>
                </div>
                
                <div class="guide-section">
                    <h5>环境适应性措施（彰化北斗地区）</h5>
                    <ul>
                        <li>使用防腐等级IP68的连接器</li>
                        <li>安装盐雾浓度监测传感器</li>
                        <li>雨季前检查接地系统完整性</li>
                        <li>高温季节加强散热系统检查</li>
                        <li>建立环境补偿阈值数据库</li>
                    </ul>
                </div>
                
                <div class="guide-section">
                    <h5>安全注意事项</h5>
                    <ul>
                        <li>直流侧作业必须使用绝缘工具</li>
                        <li>维修前确认系统完全关断</li>
                        <li>使用红外热像仪检测热点</li>
                        <li>遵守IEC 62109-2安全标准</li>
                        <li>保持维护记录完整</li>
                    </ul>
                </div>
            </div>
        `;
    }
    
    initCharts() {
        const data = window.systemData.ivCurveData;
        
        // I-V曲线对比图
        const ivDatasets = [
            {
                label: '健康曲线',
                data: data.healthy.voltage.map((v, i) => ({ x: v, y: data.healthy.current[i] })),
                color: '#2D862D',
                fill: false
            },
            {
                label: '故障曲线',
                data: data.shaded.voltage.map((v, i) => ({ x: v, y: data.shaded.current[i] })),
                color: '#FF8C00',
                fill: false
            },
            {
                label: '理论曲线',
                data: data.healthy.voltage.map((v, i) => ({ 
                    x: v, 
                    y: data.healthy.current[i] * 0.95 
                })),
                color: '#808080',
                borderDash: [5, 5],
                fill: false
            }
        ];
        
        this.chartManager.createIVCurve(
            'iv-comparison-chart',
            ivDatasets,
            'I-V曲线对比分析'
        );
    }
    
    bindEvents() {
        // 曲线显示控制
        const checkboxes = this.container.querySelectorAll('.curve-selector input');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateCurveVisibility();
            });
        });
    }
    
    selectFaultType(faultType) {
        this.currentFaultType = faultType;
        
        if (faultType) {
            // 更新I-V曲线显示
            const data = window.systemData.ivCurveData;
            let faultData;
            
            switch(faultType) {
                case '阴影遮挡':
                    faultData = data.shaded;
                    break;
                case 'PID效应':
                    faultData = data.pid;
                    break;
                default:
                    faultData = data.shaded;
            }
            
            const chart = window.chartManager.charts.get('iv-comparison-chart');
            if (chart) {
                chart.data.datasets[1].data = faultData.voltage.map((v, i) => ({ x: v, y: faultData.current[i] }));
                chart.data.datasets[1].label = `${faultType}曲线`;
                chart.update();
            }
            
            this.showToast(`已选择故障类型: ${faultType}`, 'info');
        }
    }
    
    updateCurveVisibility() {
        const chart = window.chartManager.charts.get('iv-comparison-chart');
        if (!chart) return;
        
        const showHealthy = document.getElementById('show-healthy').checked;
        const showFaulty = document.getElementById('show-faulty').checked;
        const showTheoretical = document.getElementById('show-theoretical').checked;
        
        chart.data.datasets[0].hidden = !showHealthy;
        chart.data.datasets[1].hidden = !showFaulty;
        chart.data.datasets[2].hidden = !showTheoretical;
        
        chart.update();
    }
    
    runAIDiagnosis() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>AI故障诊断</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="diagnosis-progress">
                        <div class="progress-text">
                            <i class="fas fa-cogs fa-spin"></i>
                            正在运行CNN-LSTM混合模型分析...
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="ai-progress"></div>
                        </div>
                        <div class="progress-steps">
                            <div class="step active">数据预处理</div>
                            <div class="step">特征提取</div>
                            <div class="step">模型推理</div>
                            <div class="step">结果生成</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modal-container').appendChild(modal);
        
        // 模拟AI诊断过程
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            const progressBar = modal.querySelector('#ai-progress');
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
            
            if (progress >= 100) {
                clearInterval(progressInterval);
                setTimeout(() => {
                    modal.remove();
                    this.showAIDiagnosisResult();
                }, 500);
            }
        }, 200);
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            clearInterval(progressInterval);
            modal.remove();
        });
    }
    
    showAIDiagnosisResult() {
        const result = {
            faultType: '阴影遮挡',
            confidence: 92,
            location: '阵列C-08组串',
            cause: '局部树木阴影',
            recommendation: '修剪树木，清理组件表面',
            timestamp: new Date().toISOString()
        };
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>AI诊断结果</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="diagnosis-result">
                        <div class="result-header">
                            <div class="result-type ${result.confidence > 80 ? 'high' : 'medium'}">
                                ${result.faultType}
                            </div>
                            <div class="result-confidence">
                                置信度: <span class="confidence-value">${result.confidence}%</span>
                            </div>
                        </div>
                        
                        <div class="result-details">
                            <div class="detail-item">
                                <label>故障位置:</label>
                                <span>${result.location}</span>
                            </div>
                            <div class="detail-item">
                                <label>可能原因:</label>
                                <span>${result.cause}</span>
                            </div>
                            <div class="detail-item">
                                <label>检测时间:</label>
                                <span>${new Date(result.timestamp).toLocaleString('zh-CN')}</span>
                            </div>
                        </div>
                        
                        <div class="result-recommendation">
                            <h5>建议操作:</h5>
                            <p>${result.recommendation}</p>
                        </div>
                        
                        <div class="result-algorithm">
                            <h5>使用算法:</h5>
                            <div class="algorithm-tags">
                                <span class="algorithm-tag">CNN特征提取</span>
                                <span class="algorithm-tag">LSTM时序分析</span>
                                <span class="algorithm-tag">随机森林分类</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="close-modal">关闭</button>
                    <button class="btn btn-primary" onclick="detailView.saveDiagnosisResult()">
                        <i class="fas fa-save"></i> 保存结果
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('modal-container').appendChild(modal);
        
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('#close-modal').addEventListener('click', () => modal.remove());
    }
    
    exportCurveData() {
        const data = window.systemData.ivCurveData;
        let csvContent = "电压(V),健康电流(A),故障电流(A),理论电流(A)\n";
        
        for (let i = 0; i < data.healthy.voltage.length; i++) {
            csvContent += `${data.healthy.voltage[i]},${data.healthy.current[i]},${data.shaded.current[i]},${(data.healthy.current[i] * 0.95).toFixed(2)}\n`;
        }
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'iv-curve-data.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.showToast('I-V曲线数据已导出', 'success');
    }
    
    markAsResolved(faultType) {
        const fault = window.systemData.faultDetection.recentFaults.find(f => f.type === faultType);
        if (fault) {
            fault.resolved = true;
            this.render();
            this.showToast(`故障"${faultType}"已标记为已解决`, 'success');
        }
    }
    
    showFaultDetails(faultType) {
        const faultInfo = window.faultTypes[faultType];
        if (!faultInfo) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>故障详情 - ${faultType}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="fault-detail">
                        <div class="detail-section">
                            <h5>描述</h5>
                            <p>${faultInfo.description}</p>
                        </div>
                        
                        <div class="detail-section">
                            <h5>严重等级</h5>
                            <span class="status-badge ${faultInfo.severity}">
                                ${this.getSeverityText(faultInfo.severity)}
                            </span>
                        </div>
                        
                        <div class="detail-section">
                            <h5>检测指标</h5>
                            <ul>
                                ${faultInfo.indicators.map(indicator => `<li>${indicator}</li>`).join('')}
                            </ul>
                        </div>
                        
                        <div class="detail-section">
                            <h5>标准操作流程</h5>
                            <ol>
                                ${faultInfo.action.split('，').map(step => `<li>${step}</li>`).join('')}
                            </ol>
                        </div>
                        
                        <div class="detail-section">
                            <h5>相关标准</h5>
                            <div class="standards">
                                <span class="standard-tag">IEC 62109-2</span>
                                <span class="standard-tag">NEC 690.12</span>
                                <span class="standard-tag">AS 4777.2</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="close-modal">关闭</button>
                </div>
            </div>
        `;
        
        document.getElementById('modal-container').appendChild(modal);
        
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('#close-modal').addEventListener('click', () => modal.remove());
    }
    
    getSeverityText(severity) {
        const severityMap = {
            'emergency': '紧急',
            'critical': '严重',
            'high': '高级',
            'medium': '中级',
            'low': '低级'
        };
        return severityMap[severity] || severity;
    }
    
    toggleAlgorithm(algorithmName) {
        const algorithm = window.systemData.faultDetection.algorithms.find(a => a.name === algorithmName);
        if (algorithm) {
            algorithm.status = algorithm.status === 'active' ? 'standby' : 'active';
            this.render();
            this.showToast(
                `${algorithmName} ${algorithm.status === 'active' ? '已启动' : '已暂停'}`,
                'info'
            );
        }
    }
    
    showAlgorithmDetails(algorithmName) {
        const algorithm = window.systemData.faultDetection.algorithms.find(a => a.name === algorithmName);
        if (!algorithm) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>算法详情 - ${algorithmName}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="algorithm-detail">
                        <div class="detail-section">
                            <h5>技术原理</h5>
                            <p>${this.getAlgorithmDescription(algorithmName)}</p>
                        </div>
                        
                        <div class="detail-section">
                            <h5>性能指标</h5>
                            <div class="performance-metrics">
                                <div class="metric">
                                    <div class="metric-label">识别准确率</div>
                                    <div class="metric-value">${algorithm.accuracy}%</div>
                                </div>
                                <div class="metric">
                                    <div class="metric-label">平均响应时间</div>
                                    <div class="metric-value">${algorithm.responseTime}ms</div>
                                </div>
                                <div class="metric">
                                    <div class="metric-label">计算复杂度</div>
                                    <div class="metric-value">${this.getComplexity(algorithmName)}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h5>适用场景</h5>
                            <ul>
                                ${this.getAlgorithmApplications(algorithmName).map(app => `<li>${app}</li>`).join('')}
                            </ul>
                        </div>
                        
                        <div class="detail-section">
                            <h5>配置参数</h5>
                            <div class="config-params">
                                ${this.getAlgorithmConfig(algorithmName)}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="close-modal">关闭</button>
                    <button class="btn btn-primary" onclick="detailView.configureAlgorithm('${algorithmName}')">
                        <i class="fas fa-cog"></i> 配置
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('modal-container').appendChild(modal);
        
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('#close-modal').addEventListener('click', () => modal.remove());
    }
    
    getAlgorithmDescription(name) {
        const descriptions = {
            'EWMA统计图': '基于指数加权移动平均的统计过程控制方法，通过监控残差向量的变化趋势来检测微小漂移故障。',
            '随机森林(RF)': '集成学习算法，通过构建多个决策树并结合它们的输出来提高故障分类的准确性和鲁棒性。',
            'CNN-LSTM混合': '结合卷积神经网络的特征提取能力和长短期记忆网络的时序分析能力，适用于复杂的多故障并发场景。',
            '小波变换(WT)': '时频分析方法，能够有效检测电弧放电等高频瞬态故障，具有多分辨率分析特性。'
        };
        return descriptions[name] || '暂无详细描述';
    }
    
    getComplexity(name) {
        const complexities = {
            'EWMA统计图': '低',
            '随机森林(RF)': '中',
            'CNN-LSTM混合': '高',
            '小波变换(WT)': '中'
        };
        return complexities[name] || '未知';
    }
    
    getAlgorithmApplications(name) {
        const applications = {
            'EWMA统计图': ['接线盒老化检测', '组件性能缓慢衰减', '盐雾腐蚀趋势分析'],
            '随机森林(RF)': ['阴影遮挡识别', 'PID效应分类', '多故障并发诊断'],
            'CNN-LSTM混合': ['复杂I-V曲线分析', '时序故障预测', '环境干扰补偿'],
            '小波变换(WT)': ['电弧故障检测', '高频噪声分析', '瞬态故障捕捉']
        };
        return applications[name] || ['通用故障检测'];
    }
    
    getAlgorithmConfig(name) {
        const configs = {
            'EWMA统计图': `
                <div class="config-item">
                    <label>平滑因子(λ):</label>
                    <span>0.2</span>
                </div>
                <div class="config-item">
                    <label>控制限:</label>
                    <span>±3σ</span>
                </div>
                <div class="config-item">
                    <label>采样间隔:</label>
                    <span>5分钟</span>
                </div>
            `,
            '随机森林(RF)': `
                <div class="config-item">
                    <label>决策树数量:</label>
                    <span>100</span>
                </div>
                <div class="config-item">
                    <label>最大深度:</label>
                    <span>10</span>
                </div>
                <div class="config-item">
                    <label>特征数量:</label>
                    <span>15</span>
                </div>
            `,
            'CNN-LSTM混合': `
                <div class="config-item">
                    <label>卷积层数:</label>
                    <span>3</span>
                </div>
                <div class="config-item">
                    <label>LSTM单元数:</label>
                    <span>128</span>
                </div>
                <div class="config-item">
                    <label>学习率:</label>
                    <span>0.001</span>
                </div>
            `,
            '小波变换(WT)': `
                <div class="config-item">
                    <label>小波基函数:</label>
                    <span>db4</span>
                </div>
                <div class="config-item">
                    <label>分解层数:</label>
                    <span>5</span>
                </div>
                <div class="config-item">
                    <label>采样频率:</label>
                    <span>1MHz</span>
                </div>
            `
        };
        return configs[name] || '<div class="config-item">暂无配置信息</div>';
    }
    
    configureAlgorithm(algorithmName) {
        alert(`配置 ${algorithmName} 算法\n\n在实际应用中，这里会打开算法配置界面，允许用户调整参数。`);
    }
    
    saveDiagnosisResult() {
        // 在实际应用中，这里会保存到数据库
        this.showToast('诊断结果已保存到历史记录', 'success');
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
window.DetailView = DetailView;
window.detailView = new DetailView();