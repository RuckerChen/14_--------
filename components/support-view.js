class SupportView {
    constructor() {
        this.container = document.getElementById('support-view');
    }
    
    render() {
        this.container.innerHTML = `
            <div class="support-view-container">
                <!-- 报警历史库 -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-history"></i>
                            报警历史库
                        </h3>
                        <div class="card-actions">
                            <div class="filter-controls">
                                <select id="time-filter">
                                    <option value="7days">最近7天</option>
                                    <option value="30days">最近30天</option>
                                    <option value="90days">最近90天</option>
                                    <option value="all">全部</option>
                                </select>
                                <select id="type-filter">
                                    <option value="all">全部类型</option>
                                    <option value="critical">紧急</option>
                                    <option value="high">高级</option>
                                    <option value="medium">中级</option>
                                    <option value="low">低级</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="alarm-history">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>时间</th>
                                    <th>报警ID</th>
                                    <th>类型</th>
                                    <th>设备</th>
                                    <th>描述</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="alarm-history-body">
                                ${this.renderAlarmHistory()}
                            </tbody>
                        </table>
                    </div>
                    <div class="history-stats">
                        ${this.renderHistoryStats()}
                    </div>
                </div>
                
                <!-- 传感器校验 -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-ruler-combined"></i>
                            传感器校验设置
                        </h3>
                    </div>
                    <div class="sensor-calibration">
                        ${this.renderSensorCalibration()}
                    </div>
                </div>
                
                <!-- 系统配置 -->
                <div class="grid grid-2">
                    <!-- 快速关断设置 -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">
                                <i class="fas fa-power-off"></i>
                                快速关断设置 (NEC 690.12)
                            </h3>
                        </div>
                        <div class="shutdown-config">
                            ${this.renderShutdownConfig()}
                        </div>
                    </div>
                    
                    <!-- 绝缘保护设置 -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">
                                <i class="fas fa-shield-alt"></i>
                                绝缘保护设置 (IEC 62109-2)
                            </h3>
                        </div>
                        <div class="insulation-config">
                            ${this.renderInsulationConfig()}
                        </div>
                    </div>
                </div>
                
                <!-- 数据管理 -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-database"></i>
                            数据管理与备份
                        </h3>
                    </div>
                    <div class="data-management">
                        ${this.renderDataManagement()}
                    </div>
                </div>
                
                <!-- 系统信息 -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-info-circle"></i>
                            系统信息
                        </h3>
                    </div>
                    <div class="system-info">
                        ${this.renderSystemInfo()}
                    </div>
                </div>
            </div>
        `;
        
        this.bindEvents();
    }
    
    renderAlarmHistory() {
        // 模拟历史报警数据
        const historyAlarms = [
            {
                id: 'ALM-2024-001',
                type: 'critical',
                device: '逆变器-03',
                message: '直流拉弧检测',
                timestamp: '2024-01-15T10:23:45',
                resolved: true,
                resolvedTime: '2024-01-15T11:30:00'
            },
            {
                id: 'ALM-2024-002',
                type: 'high',
                device: '组串A-08',
                message: '电流离散度异常',
                timestamp: '2024-01-14T09:45:12',
                resolved: true,
                resolvedTime: '2024-01-14T10:15:00'
            },
            {
                id: 'ALM-2023-156',
                type: 'medium',
                device: '阵列C',
                message: '局部阴影检测',
                timestamp: '2023-12-20T14:30:22',
                resolved: true,
                resolvedTime: '2023-12-21T09:00:00'
            },
            {
                id: 'ALM-2023-142',
                type: 'critical',
                device: '逆变器-02',
                message: '过温保护',
                timestamp: '2023-11-05T13:15:33',
                resolved: true,
                resolvedTime: '2023-11-05T15:45:00'
            },
            {
                id: 'ALM-2023-128',
                type: 'high',
                device: '组串B-05',
                message: '绝缘电阻过低',
                timestamp: '2023-10-18T08:20:15',
                resolved: true,
                resolvedTime: '2023-10-18T10:30:00'
            }
        ];
        
        return historyAlarms.map(alarm => `
            <tr>
                <td>${new Date(alarm.timestamp).toLocaleDateString('zh-CN')}</td>
                <td>${alarm.id}</td>
                <td>
                    <span class="status-badge ${alarm.type}">
                        ${this.getAlarmTypeText(alarm.type)}
                    </span>
                </td>
                <td>${alarm.device}</td>
                <td>${alarm.message}</td>
                <td>
                    <span class="status-badge status-normal">
                        已解决
                    </span>
                </td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="supportView.viewAlarmDetails('${alarm.id}')">
                        详情
                    </button>
                </td>
            </tr>
        `).join('');
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
    
    renderHistoryStats() {
        return `
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-label">总报警数</div>
                    <div class="stat-value">156</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">紧急报警</div>
                    <div class="stat-value">12</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">平均响应时间</div>
                    <div class="stat-value">45分钟</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">解决率</div>
                    <div class="stat-value">98.7%</div>
                </div>
                <div class="stat-item">
                    <button class="btn btn-secondary" onclick="supportView.exportAlarmHistory()">
                        <i class="fas fa-download"></i> 导出历史
                    </button>
                </div>
            </div>
        `;
    }
    
    renderSensorCalibration() {
        const sensors = [
            { name: '辐照度计', type: 'pyranometer', current: 850, calibrated: 845, offset: -5, status: 'normal' },
            { name: '温度传感器', type: 'pt100', current: 28.5, calibrated: 28.3, offset: -0.2, status: 'normal' },
            { name: '湿度传感器', type: 'capacitive', current: 78, calibrated: 75, offset: -3, status: 'warning' },
            { name: '风速计', type: 'anemometer', current: 3.2, calibrated: 3.0, offset: -0.2, status: 'normal' },
            { name: '盐雾传感器', type: 'conductivity', current: 0.15, calibrated: 0.12, offset: -0.03, status: 'normal' }
        ];
        
        return `
            <div class="calibration-grid">
                ${sensors.map(sensor => `
                    <div class="sensor-item ${sensor.status}">
                        <div class="sensor-header">
                            <div class="sensor-name">${sensor.name}</div>
                            <div class="sensor-type">${sensor.type}</div>
                        </div>
                        <div class="sensor-values">
                            <div class="value-row">
                                <span class="label">当前值:</span>
                                <span class="value">${sensor.current}${this.getSensorUnit(sensor.type)}</span>
                            </div>
                            <div class="value-row">
                                <span class="label">校准值:</span>
                                <span class="value">${sensor.calibrated}${this.getSensorUnit(sensor.type)}</span>
                            </div>
                            <div class="value-row">
                                <span class="label">偏移量:</span>
                                <span class="value ${sensor.offset >= 0 ? 'positive' : 'negative'}">
                                    ${sensor.offset >= 0 ? '+' : ''}${sensor.offset}
                                </span>
                            </div>
                        </div>
                        <div class="sensor-actions">
                            <button class="btn btn-secondary btn-sm" onclick="supportView.calibrateSensor('${sensor.name}')">
                                校准
                            </button>
                            <button class="btn btn-secondary btn-sm" onclick="supportView.viewSensorLog('${sensor.name}')">
                                日志
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="calibration-notes">
                <h5>校准说明:</h5>
                <ul>
                    <li>建议每月进行一次传感器校准</li>
                    <li>盐雾地区建议每两周检查一次盐雾传感器</li>
                    <li>校准前请确保传感器表面清洁</li>
                    <li>使用标准仪器进行对比校准</li>
                </ul>
            </div>
        `;
    }
    
    getSensorUnit(type) {
        const units = {
            'pyranometer': ' W/m²',
            'pt100': ' °C',
            'capacitive': ' %',
            'anemometer': ' m/s',
            'conductivity': ' mg/cm²'
        };
        return units[type] || '';
    }
    
    renderShutdownConfig() {
        return `
            <div class="config-form">
                <div class="form-group">
                    <label for="shutdown-timeout">关断超时时间</label>
                    <div class="input-with-unit">
                        <input type="number" id="shutdown-timeout" value="30" min="10" max="60">
                        <span class="unit">秒</span>
                    </div>
                    <div class="form-help">NEC 690.12要求: 30秒内电压降至30V以下</div>
                </div>
                
                <div class="form-group">
                    <label for="shutdown-voltage">安全电压阈值</label>
                    <div class="input-with-unit">
                        <input type="number" id="shutdown-voltage" value="30" min="20" max="50">
                        <span class="unit">V</span>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="shutdown-mode">关断模式</label>
                    <select id="shutdown-mode">
                        <option value="automatic">自动关断</option>
                        <option value="manual">手动确认</option>
                        <option value="remote">远程控制</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="emergency-contact">紧急联系人</label>
                    <input type="text" id="emergency-contact" value="张三 - 13800138000">
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="enable-test" checked>
                        启用每周自动测试
                    </label>
                </div>
                
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="supportView.saveShutdownConfig()">
                        <i class="fas fa-save"></i> 保存设置
                    </button>
                    <button class="btn btn-secondary" onclick="supportView.testShutdown()">
                        <i class="fas fa-play"></i> 测试关断
                    </button>
                </div>
            </div>
        `;
    }
    
    renderInsulationConfig() {
        return `
            <div class="config-form">
                <div class="form-group">
                    <label for="insulation-warning">预警阈值</label>
                    <div class="input-with-unit">
                        <input type="number" id="insulation-warning" value="500" min="100" max="1000">
                        <span class="unit">kΩ</span>
                    </div>
                    <div class="form-help">当绝缘电阻低于此值时发出预警</div>
                </div>
                
                <div class="form-group">
                    <label for="insulation-fault">故障阈值</label>
                    <div class="input-with-unit">
                        <input type="number" id="insulation-fault" value="100" min="50" max="200">
                        <span class="unit">kΩ</span>
                    </div>
                    <div class="form-help">IEC 62109-2要求: 非隔离型逆变器最小100kΩ</div>
                </div>
                
                <div class="form-group">
                    <label for="leakage-current">漏电流阈值</label>
                    <div class="input-with-unit">
                        <input type="number" id="leakage-current" value="300" min="100" max="500">
                        <span class="unit">mA</span>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="humidity-compensation">湿度补偿</label>
                    <select id="humidity-compensation">
                        <option value="auto">自动调整</option>
                        <option value="manual">手动设置</option>
                        <option value="disabled">禁用</option>
                    </select>
                    <div class="form-help">高湿环境(>80%)下自动放宽阈值</div>
                </div>
                
                <div class="form-group">
                    <label for="compensation-factor">补偿系数</label>
                    <div class="input-with-unit">
                        <input type="number" id="compensation-factor" value="0.7" min="0.5" max="1.0" step="0.1">
                        <span class="unit">倍</span>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="supportView.saveInsulationConfig()">
                        <i class="fas fa-save"></i> 保存设置
                    </button>
                </div>
            </div>
        `;
    }
    
    renderDataManagement() {
        return `
            <div class="data-management-grid">
                <div class="data-section">
                    <h5>数据备份</h5>
                    <div class="backup-controls">
                        <div class="backup-info">
                            <div class="info-item">
                                <span class="label">上次备份:</span>
                                <span class="value">2024-01-14 23:00</span>
                            </div>
                            <div class="info-item">
                                <span class="label">备份大小:</span>
                                <span class="value">2.3 GB</span>
                            </div>
                            <div class="info-item">
                                <span class="label">保留周期:</span>
                                <span class="value">365天</span>
                            </div>
                        </div>
                        <div class="backup-actions">
                            <button class="btn btn-secondary" onclick="supportView.manualBackup()">
                                <i class="fas fa-database"></i> 立即备份
                            </button>
                            <button class="btn btn-secondary" onclick="supportView.restoreBackup()">
                                <i class="fas fa-undo"></i> 恢复备份
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="data-section">
                    <h5>数据导出</h5>
                    <div class="export-options">
                        <div class="export-format">
                            <label>
                                <input type="radio" name="export-format" value="csv" checked>
                                CSV格式
                            </label>
                            <label>
                                <input type="radio" name="export-format" value="excel">
                                Excel格式
                            </label>
                            <label>
                                <input type="radio" name="export-format" value="json">
                                JSON格式
                            </label>
                        </div>
                        <div class="export-range">
                            <label>时间范围:</label>
                            <select id="export-range">
                                <option value="today">今日数据</option>
                                <option value="week">本周数据</option>
                                <option value="month">本月数据</option>
                                <option value="quarter">本季度数据</option>
                                <option value="year">本年数据</option>
                            </select>
                        </div>
                        <div class="export-actions">
                            <button class="btn btn-primary" onclick="supportView.exportData()">
                                <i class="fas fa-download"></i> 导出数据
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="data-section">
                    <h5>数据清理</h5>
                    <div class="cleanup-controls">
                        <div class="cleanup-option">
                            <label>
                                <input type="checkbox" id="clean-old-alarms">
                                清理超过1年的报警记录
                            </label>
                            <span class="count">(约12,500条)</span>
                        </div>
                        <div class="cleanup-option">
                            <label>
                                <input type="checkbox" id="clean-old-measurements">
                                清理超过2年的测量数据
                            </label>
                            <span class="count">(约8.7GB)</span>
                        </div>
                        <div class="cleanup-actions">
                            <button class="btn btn-danger" onclick="supportView.cleanupData()">
                                <i class="fas fa-trash"></i> 执行清理
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderSystemInfo() {
        const systemInfo = {
            version: '2.3.1',
            buildDate: '2024-01-10',
            apiVersion: 'v1.5',
            database: 'PostgreSQL 14.5',
            uptime: '15天 8小时 23分钟',
            lastRestart: '2024-01-01 00:00',
            diskUsage: '45%',
            memoryUsage: '68%',
            cpuUsage: '23%'
        };
        
        return `
            <div class="system-info-grid">
                <div class="info-section">
                    <h5>软件信息</h5>
                    <div class="info-items">
                        <div class="info-item">
                            <span class="label">版本号:</span>
                            <span class="value">${systemInfo.version}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">构建日期:</span>
                            <span class="value">${systemInfo.buildDate}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">API版本:</span>
                            <span class="value">${systemInfo.apiVersion}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">数据库:</span>
                            <span class="value">${systemInfo.database}</span>
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <h5>运行状态</h5>
                    <div class="info-items">
                        <div class="info-item">
                            <span class="label">运行时间:</span>
                            <span class="value">${systemInfo.uptime}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">最后重启:</span>
                            <span class="value">${systemInfo.lastRestart}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">磁盘使用:</span>
                            <span class="value">
                                ${systemInfo.diskUsage}
                                <div class="progress-bar small">
                                    <div class="progress-fill" style="width: ${systemInfo.diskUsage}"></div>
                                </div>
                            </span>
                        </div>
                        <div class="info-item">
                            <span class="label">内存使用:</span>
                            <span class="value">
                                ${systemInfo.memoryUsage}
                                <div class="progress-bar small">
                                    <div class="progress-fill" style="width: ${systemInfo.memoryUsage}"></div>
                                </div>
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <h5>系统维护</h5>
                    <div class="maintenance-actions">
                        <button class="btn btn-secondary" onclick="supportView.checkUpdates()">
                            <i class="fas fa-sync-alt"></i> 检查更新
                        </button>
                        <button class="btn btn-secondary" onclick="supportView.viewLogs()">
                            <i class="fas fa-file-alt"></i> 查看日志
                        </button>
                        <button class="btn btn-secondary" onclick="supportView.restartSystem()">
                            <i class="fas fa-redo"></i> 重启系统
                        </button>
                        <button class="btn btn-danger" onclick="supportView.shutdownSystem()">
                            <i class="fas fa-power-off"></i> 关机
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    bindEvents() {
        // 报警历史筛选
        const timeFilter = this.container.querySelector('#time-filter');
        const typeFilter = this.container.querySelector('#type-filter');
        
        if (timeFilter) {
            timeFilter.addEventListener('change', () => {
                this.filterAlarmHistory();
            });
        }
        
        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                this.filterAlarmHistory();
            });
        }
    }
    
    viewAlarmDetails(alarmId) {
        alert(`查看报警详情: ${alarmId}\n\n在实际应用中，这里会显示完整的报警历史记录，包括处理过程和解决方案。`);
    }
    
    exportAlarmHistory() {
        alert('正在导出报警历史记录...\n格式: CSV\n包含字段: 时间, 报警ID, 类型, 设备, 描述, 状态, 处理人, 处理时间');
    }
    
    calibrateSensor(sensorName) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>传感器校准 - ${sensorName}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="calibration-instructions">
                        <h5>校准步骤:</h5>
                        <ol>
                            <li>准备标准校准仪器</li>
                            <li>将传感器与标准仪器置于相同环境</li>
                            <li>记录标准仪器读数</li>
                            <li>输入校准值</li>
                            <li>保存校准结果</li>
                        </ol>
                    </div>
                    
                    <div class="calibration-form">
                        <div class="form-group">
                            <label for="standard-value">标准仪器读数</label>
                            <input type="number" id="standard-value" step="0.1">
                        </div>
                        <div class="form-group">
                            <label for="calibration-note">校准备注</label>
                            <textarea id="calibration-note" rows="2" placeholder="例如: 使用Fluke 287进行校准"></textarea>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancel-calibration">取消</button>
                    <button class="btn btn-primary" onclick="supportView.saveCalibration('${sensorName}')">
                        <i class="fas fa-save"></i> 保存校准
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('modal-container').appendChild(modal);
        
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('#cancel-calibration').addEventListener('click', () => modal.remove());
    }
    
    saveCalibration(sensorName) {
        this.showToast(`${sensorName} 校准已保存`, 'success');
        // 关闭所有模态框
        document.querySelectorAll('.modal').forEach(modal => modal.remove());
    }
    
    viewSensorLog(sensorName) {
        alert(`查看 ${sensorName} 的校准历史日志`);
    }
    
    saveShutdownConfig() {
        const timeout = document.getElementById('shutdown-timeout').value;
        const voltage = document.getElementById('shutdown-voltage').value;
        const mode = document.getElementById('shutdown-mode').value;
        
        this.showToast(`快速关断设置已保存\n超时: ${timeout}秒\n安全电压: ${voltage}V\n模式: ${mode}`, 'success');
    }
    
    testShutdown() {
        if (confirm('确定要测试快速关断功能吗？\n\n测试期间系统将模拟关断过程，不会实际切断电源。')) {
            alert('快速关断测试已启动...\n\n1. 发送关断指令\n2. 监控电压下降\n3. 验证30秒内电压降至30V以下\n4. 测试完成');
        }
    }
    
    saveInsulationConfig() {
        const warning = document.getElementById('insulation-warning').value;
        const fault = document.getElementById('insulation-fault').value;
        const leakage = document.getElementById('leakage-current').value;
        
        this.showToast(`绝缘保护设置已保存\n预警: ${warning}kΩ\n故障: ${fault}kΩ\n漏电流: ${leakage}mA`, 'success');
    }
    
    manualBackup() {
        alert('开始手动数据备份...\n\n备份内容:\n- 报警历史记录\n- 测量数据\n- 系统配置\n- 用户设置\n\n预计耗时: 5-10分钟');
    }
    
    restoreBackup() {
        alert('数据恢复功能\n\n请选择要恢复的备份文件，系统将恢复到指定时间点的状态。');
    }
    
    exportData() {
        const format = document.querySelector('input[name="export-format"]:checked').value;
        const range = document.getElementById('export-range').value;
        
        alert(`正在导出数据...\n格式: ${format.toUpperCase()}\n时间范围: ${range}\n\n文件将自动下载到您的电脑。`);
    }
    
    cleanupData() {
        if (confirm('确定要清理旧数据吗？\n\n此操作不可逆转，请确保已备份重要数据。')) {
            alert('数据清理已开始...\n\n清理完成后将释放存储空间，系统性能将得到提升。');
        }
    }
    
    checkUpdates() {
        alert('正在检查系统更新...\n\n当前版本: 2.3.1\n最新版本: 2.3.2\n\n更新内容:\n- 修复I-V曲线显示问题\n- 优化AI诊断算法\n- 增强盐雾环境适应性');
    }
    
    viewLogs() {
        alert('系统日志查看器\n\n包含:\n- 操作日志\n- 错误日志\n- 系统日志\n- 安全日志\n\n支持按时间、类型、用户筛选。');
    }
    
    restartSystem() {
        if (confirm('确定要重启系统吗？\n\n重启期间系统将不可用，预计耗时2分钟。')) {
            alert('系统重启中...\n\n请勿关闭浏览器，重启完成后将自动重新连接。');
        }
    }
    
    shutdownSystem() {
        if (confirm('⚠️ 确定要关闭系统吗？\n\n关闭后所有监控功能将停止，需要手动重启才能恢复。')) {
            alert('系统正在关闭...\n\n感谢使用光伏故障检测系统。');
        }
    }
    
    filterAlarmHistory() {
        // 在实际应用中，这里会从服务器获取筛选后的数据
        this.showToast('报警历史已按筛选条件更新', 'info');
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
window.SupportView = SupportView;
window.supportView = new SupportView();