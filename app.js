// 添加Chart.js等待函数
// Chart.js 等待加载函数
function waitForChartJs() {
    return new Promise((resolve) => {
        if (typeof Chart !== 'undefined') {
            resolve();
            return;
        }
        const checkInterval = setInterval(() => {
            if (typeof Chart !== 'undefined') {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);
        setTimeout(() => {
            clearInterval(checkInterval);
            resolve(); // 超时也继续，使用降级方案
        }, 5000);
    });
}

// 主应用控制器
class PVFaultDetectionApp {
    constructor() {
        this.currentView = 'overview';
        
        // --- 关键修复开始 ---
        // 1. 创建实例
        // 注意：这里我们检查 window 上是否已经存在实例（由组件文件底部创建），如果不存在则 new 一个
        // 对于 unit-control.js，因为你注释掉了底部的实例化，这里必须 new
        const overviewInstance = (window.overviewView instanceof OverviewView) ? window.overviewView : new OverviewView();
        const unitControlInstance = new UnitControlView();
        const detailInstance = new DetailView(); // 组件可能已创建，但覆盖它以确保由App管理
        const supportInstance = new SupportView();

        // 2. 将实例挂载到 this.views
        this.views = {
            overview: overviewInstance,
            'unit-control': unitControlInstance,
            detail: detailInstance,
            support: supportInstance
        };
        
        // 3. 【核心修复】将实例暴露给全局 window 对象
        // 这样 HTML 中的 onclick="unitControlView.xxx()" 才能找到对象
        window.overviewView = overviewInstance;
        window.unitControlView = unitControlInstance; // 修复 ReferenceError: unitControlView is not defined
        window.detailView = detailInstance;
        window.supportView = supportInstance;
        
        console.log('[App] Views initialized and exposed to window:', this.views);
        // --- 关键修复结束 ---

        // 定时器管理
        this.timers = {
            timeUpdate: null,
            shutdownProgress: null,
            scanProgress: null,
            reportProgress: null
        };
        
        // 标签页可见性状态
        this.isTabVisible = true;
        
        this.init();
    }
    
    async init() {
        // 1. 等待 Chart.js 加载
        await waitForChartJs();
        
        // 2. 更新 ChartManager 状态
        if (typeof Chart !== 'undefined' && window.chartManager) {
            window.chartManager.chartAvailable = true;
            window.chartManager.fallbackMode = false;
            console.log('[App] ChartManager status updated: Ready');
        }

        // 3. 初始化逻辑
        this.initPageVisibility();
        this.updateTime();
        this.timers.timeUpdate = setInterval(() => this.updateTime(), 1000);
        this.bindNavTabs();
        this.bindQuickActions();
        this.initAlertBar();
        
        // 4. 渲染初始视图
        this.switchView('overview');
    }
    
    // 初始化标签页可见性监听
    initPageVisibility() {
        const visibilityChange = () => {
            this.isTabVisible = !document.hidden;
            this.onVisibilityChange(this.isTabVisible);
        };
        
        if (typeof document.hidden !== "undefined") {
            document.addEventListener("visibilitychange", visibilityChange);
        }
        
        window.addEventListener('beforeunload', () => {
            this.cleanupAllTimers();
        });
    }
    
    onVisibilityChange(isVisible) {
        if (isVisible) {
            if (!this.timers.timeUpdate) {
                this.timers.timeUpdate = setInterval(() => this.updateTime(), 1000);
            }
        } else {
            this.pauseNonEssentialTimers();
        }
    }
    
    pauseNonEssentialTimers() {
        if (this.timers.timeUpdate) {
            clearInterval(this.timers.timeUpdate);
            this.timers.timeUpdate = setInterval(() => this.updateTime(), 5000);
        }
    }
    
    cleanupAllTimers() {
        Object.values(this.timers).forEach(timer => {
            if (timer) clearInterval(timer);
        });
        
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.dataset.progressInterval) {
                clearInterval(parseInt(modal.dataset.progressInterval));
            }
        });
    }
    
    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            timeElement.textContent = timeString;
        }
    }
    
    bindNavTabs() {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                // 处理点击图标或文字的情况，确保获取到 button 元素
                const button = e.target.closest('.nav-tab');
                if (button) {
                    const view = button.dataset.view;
                    this.switchView(view);
                }
            });
        });
    }
    
    bindQuickActions() {
        const btnShutdown = document.getElementById('quick-shutdown');
        if(btnShutdown) btnShutdown.addEventListener('click', () => this.quickShutdown());
        
        const btnScan = document.getElementById('iv-scan');
        if(btnScan) btnScan.addEventListener('click', () => this.startIVScan());
        
        const btnReport = document.getElementById('report-gen');
        if(btnReport) btnReport.addEventListener('click', () => this.generateReport());
        
        const btnDiagnose = document.getElementById('ai-diagnose');
        if(btnDiagnose) btnDiagnose.addEventListener('click', () => this.runAIDiagnosis());
    }
    
    initAlertBar() {
        const alertBar = document.getElementById('alert-bar');
        const alertMessage = document.getElementById('alert-message');
        const ackButton = document.getElementById('ack-alert');
        
        if (!alertBar || !alertMessage || !ackButton) return;
        
        const updateStatus = () => {
            const criticalAlarm = window.systemData.alarms.list.find(
                alarm => alarm.type === 'critical' && !alarm.acknowledged
            );
            
            if (criticalAlarm) {
                alertBar.className = 'alert-widget critical';
                alertMessage.textContent = `紧急: ${criticalAlarm.message}`;
            } else {
                alertBar.className = 'alert-widget normal';
                alertMessage.textContent = '系统运行正常';
            }
        };

        updateStatus();
        
        ackButton.addEventListener('click', () => {
            const criticalAlarm = window.systemData.alarms.list.find(
                alarm => alarm.type === 'critical' && !alarm.acknowledged
            );
            if (criticalAlarm) {
                criticalAlarm.acknowledged = true;
                this.showToast('紧急报警已确认', 'success');
                updateStatus();
            } else {
                this.showToast('当前无待确认报警', 'info');
            }
        });
    }
    
    switchView(viewName) {
        // 更新侧边栏导航状态
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === viewName);
        });
        
        // 更新视图显示
        document.querySelectorAll('.view').forEach(view => {
            view.classList.toggle('active', view.id === `${viewName}-view`);
        });
        
        // 渲染对应视图
        if (this.views[viewName]) {
            if (typeof this.views[viewName].render === 'function') {
                this.views[viewName].render();
            }
        }
        
        this.currentView = viewName;
    }
    
    quickShutdown() {
        if (confirm('⚠️ 确定要执行快速关断吗？\n\n根据NEC 690.12标准，系统将在30秒内将电压降至安全水平。')) {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>快速关断执行中</h3>
                    </div>
                    <div class="modal-body">
                        <div class="progress-text" style="text-align:center; margin-bottom:15px;">
                            <i class="fas fa-power-off fa-spin" style="color:var(--status-critical);"></i>
                            正在执行快速关断...
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill critical" id="shutdown-progress" style="width:0%"></div>
                        </div>
                        <div class="shutdown-steps" style="display:flex; justify-content:space-between; margin-top:20px; font-size:0.8rem; color:#666;">
                            <span>发送指令</span>
                            <span>断开接触器</span>
                            <span>监控电压</span>
                            <span>确认安全</span>
                        </div>
                        <div style="text-align:center; margin-top:20px; font-family:'JetBrains Mono'; font-weight:bold;">
                            当前电压: <span id="current-voltage" style="color:var(--status-critical);">650 V</span>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('modal-container').appendChild(modal);
            
            let progress = 0;
            let voltage = 650;
            const progressInterval = setInterval(() => {
                progress += 5; 
                voltage = Math.max(0, 650 - (progress / 100 * 650));
                
                const progressBar = modal.querySelector('#shutdown-progress');
                const voltageDisplay = modal.querySelector('#current-voltage');
                
                if (progressBar) progressBar.style.width = `${progress}%`;
                if (voltageDisplay) voltageDisplay.textContent = `${voltage.toFixed(0)} V`;
                
                if (progress >= 100) {
                    clearInterval(progressInterval);
                    setTimeout(() => {
                        modal.remove();
                        this.showToast('快速关断完成，系统已进入安全状态', 'success');
                    }, 800);
                }
            }, 200);
            
            // 存储定时器以便清理
            modal.dataset.progressInterval = progressInterval;
        }
    }
    
    startIVScan() {
        // 由于原代码的 startIVScan 逻辑在 app.js 中比较复杂，这里调用 unitControlView 中的逻辑或者简化的逻辑
        // 如果 unitControlView 已经实例化，我们可以直接调用它的方法，或者在这里实现一个通用方法
        // 为了简单起见，这里复用 UnitControlView 中的逻辑，前提是它存在
        if (window.unitControlView && typeof window.unitControlView.startIVScan === 'function') {
             // 模拟调用一个逆变器的扫描，或者弹出一个选择框
             window.unitControlView.startIVScan('INV-01 (全局演示)');
        } else {
             alert('正在初始化 I-V 扫描模块...');
        }
    }
    
    generateReport() {
        if (typeof this.generateReportUI === 'function') {
            this.generateReportUI();
        } else {
            // 简单的回退逻辑
             const modal = document.createElement('div');
             modal.className = 'modal';
             modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header"><h3>生成报告</h3><button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button></div>
                    <div class="modal-body"><p>正在生成系统运行报告...</p></div>
                </div>`;
             document.getElementById('modal-container').appendChild(modal);
        }
    }
    
    runAIDiagnosis() {
        this.switchView('detail');
        setTimeout(() => {
            if (window.detailView && typeof window.detailView.runAIDiagnosis === 'function') {
                window.detailView.runAIDiagnosis();
            }
        }, 100);
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'alert-widget';
        toast.style.position = 'fixed';
        toast.style.bottom = '30px';
        toast.style.right = '30px';
        toast.style.zIndex = '9999';
        toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        toast.style.animation = 'fadeIn 0.3s ease';
        toast.style.padding = '12px 20px';
        toast.style.background = '#fff';
        
        let icon = 'info-circle';
        let colorClass = 'normal';
        let iconColor = '#3b82f6';
        
        if (type === 'success') { icon = 'check-circle'; colorClass = 'normal'; iconColor = '#10b981'; }
        if (type === 'warning') { icon = 'exclamation-triangle'; colorClass = 'high'; iconColor = '#f59e0b'; }
        if (type === 'error') { icon = 'times-circle'; colorClass = 'critical'; iconColor = '#ef4444'; }
        
        toast.classList.add(colorClass);
        toast.innerHTML = `
            <i class="fas fa-${icon}" style="margin-right:8px; font-size:1.2rem; color:${iconColor}"></i>
            <span style="font-weight:500; color:#333">${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PVFaultDetectionApp();
});

// 添加额外的CSS样式
const extraStyles = `
/* 热力图网格 */
.heatmap-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-template-rows: repeat(8, 1fr);
    gap: 2px;
    height: 100%;
    padding: 10px;
}

.heatmap-cell {
    position: relative;
    border-radius: 4px;
    cursor: pointer;
    transition: transform 0.2s, opacity 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 10px;
    font-weight: bold;
}

.heatmap-cell:hover {
    transform: scale(1.1);
    z-index: 10;
    box-shadow: 0 0 10px rgba(0,0,0,0.3);
}

.cell-label {
    position: absolute;
    bottom: 2px;
    right: 2px;
    font-size: 8px;
    color: rgba(255,255,255,0.8);
}

.heatmap-legend {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: 10px;
    font-size: 12px;
    color: #666;
}

.gradient-bar {
    width: 200px;
    height: 10px;
    background: linear-gradient(to right, #00ff00, #ffff00, #ff0000);
    border-radius: 5px;
}

/* 环境统计网格 */
.env-stats-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 15px;
    margin-bottom: 20px;
}

.env-stat {
    text-align: center;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 8px;
}

.env-label {
    font-size: 12px;
    color: #666;
    margin-bottom: 5px;
}

.env-value {
    font-size: 18px;
    font-weight: bold;
    color: #333;
    margin-bottom: 5px;
}

.env-status {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
    display: inline-block;
}

/* 设备摘要网格 */
.summary-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
    margin-bottom: 20px;
}

.summary-item {
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #2D862D;
}

.summary-label {
    font-size: 12px;
    color: #666;
    margin-bottom: 5px;
}

.summary-value {
    font-size: 24px;
    font-weight: bold;
    color: #333;
    margin-bottom: 5px;
}

.summary-detail {
    font-size: 11px;
    display: flex;
    justify-content: space-between;
}

/* 报警列表 */
.alarm-list {
    max-height: 300px;
    overflow-y: auto;
}

.alarm-item {
    display: flex;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #eee;
    transition: background-color 0.2s;
}

.alarm-item:hover {
    background-color: #f8f9fa;
}

.alarm-item.unacknowledged {
    animation: pulse-bg 2s infinite;
}

@keyframes pulse-bg {
    0% { background-color: #fff; }
    50% { background-color: #fff8e1; }
    100% { background-color: #fff; }
}

.alarm-item.critical {
    border-left: 4px solid #FF0000;
}

.alarm-item.high {
    border-left: 4px solid #FF8C00;
}

.alarm-item.medium {
    border-left: 4px solid #FFD700;
}

.alarm-item.low {
    border-left: 4px solid #00BFFF;
}

.alarm-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
}

.alarm-item.critical .alarm-icon {
    background-color: rgba(255, 0, 0, 0.1);
    color: #FF0000;
}

.alarm-item.high .alarm-icon {
    background-color: rgba(255, 140, 0, 0.1);
    color: #FF8C00;
}

.alarm-content {
    flex: 1;
}

.alarm-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
}

.alarm-id {
    font-weight: bold;
    color: #333;
}

.alarm-time {
    font-size: 12px;
    color: #666;
}

.alarm-message {
    font-weight: 500;
    margin-bottom: 3px;
}

.alarm-device {
    font-size: 12px;
    color: #666;
}

.alarm-actions {
    display: flex;
    gap: 5px;
}

/* 逆变器网格 */
.inverter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
}

.inverter-card {
    padding: 15px;
    border-radius: 8px;
    background: #f8f9fa;
    border: 2px solid #ddd;
    cursor: pointer;
    transition: all 0.3s ease;
}

.inverter-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.inverter-card.critical {
    border-color: #FF0000;
    background: rgba(255, 0, 0, 0.05);
}

.inverter-card.high {
    border-color: #FF8C00;
    background: rgba(255, 140, 0, 0.05);
}

.inverter-card.medium {
    border-color: #FFD700;
    background: rgba(255, 215, 0, 0.05);
}

.inverter-card.normal {
    border-color: #2D862D;
    background: rgba(45, 134, 45, 0.05);
}

.inverter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.inverter-id {
    font-weight: bold;
    font-size: 16px;
    color: #333;
}

.inverter-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin: 10px 0;
}

.inverter-stats .stat {
    text-align: center;
}

.inverter-stats .stat-label {
    font-size: 11px;
    color: #666;
    margin-bottom: 3px;
}

.inverter-stats .stat-value {
    font-size: 14px;
    font-weight: bold;
    color: #333;
}

/* 拓扑图 */
.topology-container {
    height: 300px;
    position: relative;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    overflow: hidden;
}

.topology-diagram {
    position: relative;
    width: 100%;
    height: 100%;
}

.topology-node {
    position: absolute;
    width: 120px;
    height: 80px;
    background: white;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 2;
}

.array-node { top: 20%; left: 10%; }
.combiner-node { top: 20%; left: 40%; }
.inverter-node { top: 20%; left: 70%; }
.ac-node { top: 60%; left: 40%; }
.grid-node { top: 60%; left: 70%; }
.battery-node { top: 60%; left: 10%; }

.node-icon {
    font-size: 24px;
    margin-bottom: 5px;
}

.array-node .node-icon { color: #2D862D; }
.combiner-node .node-icon { color: #FF8C00; }
.inverter-node .node-icon { color: #00BFFF; }
.ac-node .node-icon { color: #FFD700; }
.grid-node .node-icon { color: #808080; }
.battery-node .node-icon { color: #4B0082; }

.node-label {
    font-size: 12px;
    font-weight: bold;
    margin-bottom: 3px;
}

.node-value {
    font-size: 11px;
    color: #666;
}

.topology-line {
    position: absolute;
    background: white;
    z-index: 1;
}

.line-1 { top: 60px; left: 130px; width: 110px; height: 2px; }
.line-2 { top: 60px; left: 370px; width: 110px; height: 2px; }
.line-3 { top: 100px; left: 370px; width: 2px; height: 80px; }
.line-4 { top: 180px; left: 130px; width: 110px; height: 2px; }
.line-5 { top: 180px; left: 370px; width: 110px; height: 2px; }

.energy-flow {
    position: absolute;
    width: 20px;
    height: 4px;
    background: #FFD700;
    border-radius: 2px;
    animation: flow 3s linear infinite;
    z-index: 3;
}

@keyframes flow {
    0% { left: 10%; top: 60px; }
    25% { left: 40%; top: 60px; }
    50% { left: 70%; top: 60px; }
    75% { left: 40%; top: 180px; }
    100% { left: 10%; top: 180px; }
}

/* 故障特征分析 */
.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
    margin: 15px 0;
}

.feature-item {
    padding: 15px;
    border-radius: 8px;
    background: #f8f9fa;
    border-left: 4px solid #ddd;
}

.feature-item.critical { border-left-color: #FF0000; }
.feature-item.high { border-left-color: #FF8C00; }
.feature-item.medium { border-left-color: #FFD700; }
.feature-item.normal { border-left-color: #2D862D; }

.feature-name {
    font-weight: bold;
    margin-bottom: 10px;
    color: #333;
}

.feature-values {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.current-value {
    font-size: 18px;
    font-weight: bold;
}

.deviation {
    font-size: 14px;
    font-weight: bold;
}

.deviation.positive { color: #2D862D; }
.deviation.negative { color: #FF0000; }

/* AI诊断结果 */
.ai-results {
    max-height: 300px;
    overflow-y: auto;
}

.ai-result-item {
    padding: 15px;
    border-radius: 8px;
    background: #f8f9fa;
    margin-bottom: 10px;
    border: 1px solid #ddd;
}

.ai-result-item.active {
    border-color: #FF8C00;
    background: rgba(255, 140, 0, 0.05);
}

.ai-result-item.resolved {
    border-color: #2D862D;
    background: rgba(45, 134, 45, 0.05);
    opacity: 0.8;
}

.ai-result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.ai-fault-type {
    font-weight: bold;
    font-size: 16px;
    color: #333;
}

.ai-confidence {
    display: flex;
    align-items: center;
    gap: 5px;
}

.confidence-label {
    font-size: 12px;
    color: #666;
}

.confidence-value {
    font-weight: bold;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
}

.confidence-value.high { background: rgba(45, 134, 45, 0.2); color: #2D862D; }
.confidence-value.medium { background: rgba(255, 215, 0, 0.2); color: #FFD700; }
.confidence-value.low { background: rgba(255, 0, 0, 0.2); color: #FF0000; }

.ai-result-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    font-size: 12px;
    color: #666;
}

.ai-recommendation {
    padding: 10px;
    background: white;
    border-radius: 6px;
    margin-bottom: 10px;
    font-size: 14px;
}

.ai-actions {
    display: flex;
    gap: 10px;
}

/* 算法比较 */
.algorithm-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
}

.algorithm-card {
    padding: 20px;
    border-radius: 8px;
    background: #f8f9fa;
    border: 2px solid #ddd;
}

.algorithm-card.active {
    border-color: #2D862D;
    background: rgba(45, 134, 45, 0.05);
}

.algorithm-card.standby {
    border-color: #808080;
    background: rgba(128, 128, 128, 0.05);
}

.algorithm-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.algorithm-header h4 {
    margin: 0;
    color: #333;
}

.algorithm-stats {
    margin-bottom: 15px;
}

.algorithm-stats .stat {
    margin-bottom: 10px;
}

.algorithm-stats .stat-label {
    font-size: 12px;
    color: #666;
    margin-bottom: 3px;
}

.algorithm-stats .stat-value {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-bottom: 5px;
}

.algorithm-actions {
    display: flex;
    gap: 10px;
}

/* 维护指南 */
.guide-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
}

.guide-section {
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
}

.guide-section h5 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #333;
    border-bottom: 2px solid #ddd;
    padding-bottom: 5px;
}

.guide-section ol,
.guide-section ul {
    margin: 0;
    padding-left: 20px;
}

.guide-section li {
    margin-bottom: 5px;
    font-size: 14px;
    line-height: 1.5;
}

/* 传感器校准 */
.calibration-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

.sensor-item {
    padding: 15px;
    border-radius: 8px;
    background: #f8f9fa;
    border: 2px solid #ddd;
}

.sensor-item.warning {
    border-color: #FFD700;
    background: rgba(255, 215, 0, 0.05);
}

.sensor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.sensor-name {
    font-weight: bold;
    color: #333;
}

.sensor-type {
    font-size: 11px;
    color: #666;
    background: #eee;
    padding: 2px 6px;
    border-radius: 10px;
}

.sensor-values {
    margin-bottom: 10px;
}

.value-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    font-size: 13px;
}

.value-row .label {
    color: #666;
}

.value-row .value {
    font-weight: bold;
    color: #333;
}

.sensor-actions {
    display: flex;
    gap: 10px;
}

/* 配置表单 */
.config-form {
    padding: 10px;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #333;
}

.form-control {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.input-with-unit {
    display: flex;
    align-items: center;
}

.input-with-unit input {
    flex: 1;
    border-right: none;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
}

.input-with-unit .unit {
    padding: 8px 12px;
    background: #f8f9fa;
    border: 1px solid #ddd;
    border-left: none;
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    color: #666;
}

.form-help {
    font-size: 12px;
    color: #666;
    margin-top: 5px;
}

.form-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
}

/* 数据管理 */
.data-management-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
}

.data-section {
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
}

.data-section h5 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #333;
    border-bottom: 2px solid #ddd;
    padding-bottom: 5px;
}

.backup-info,
.export-options,
.cleanup-controls {
    margin-bottom: 15px;
}

.info-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 14px;
}

.info-item .label {
    color: #666;
}

.info-item .value {
    font-weight: bold;
    color: #333;
}

.export-format,
.export-range {
    margin-bottom: 10px;
}

.export-format label,
.cleanup-option label {
    display: block;
    margin-bottom: 5px;
    cursor: pointer;
}

.cleanup-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.cleanup-option .count {
    font-size: 12px;
    color: #666;
}

/* 系统信息 */
.system-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
}

.info-section {
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
}

.info-section h5 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #333;
    border-bottom: 2px solid #ddd;
    padding-bottom: 5px;
}

.info-items {
    margin-bottom: 15px;
}

.maintenance-actions {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
}

/* 进度条 */
.progress-bar.small {
    height: 6px;
    margin-top: 5px;
}

/* 模态框 */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 20px;
}

.modal-content {
    background: white;
    border-radius: 12px;
    max-width: 800px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
    from {
        opacity: 0;
        transform: translateY(-50px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #eee;
}

.modal-header h3 {
    margin: 0;
    color: #333;
}

.modal-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.modal-close:hover {
    background: #f8f9fa;
    color: #333;
}

.modal-body {
    padding: 20px;
}

.modal-footer {
    padding: 20px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

/* 进度指示器 */
.progress-text {
    text-align: center;
    margin-bottom: 20px;
    font-size: 16px;
    color: #333;
}

.progress-text i {
    margin-right: 10px;
    color: #2D862D;
}

.progress-steps {
    display: flex;
    justify-content: space-between;
    margin: 20px 0;
}

.step {
    text-align: center;
    font-size: 12px;
    color: #999;
    flex: 1;
    position: relative;
    padding-top: 25px;
}

.step:before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #eee;
    border: 2px solid #ddd;
}

.step.active:before {
    background: #2D862D;
    border-color: #2D862D;
}

.step.active {
    color: #333;
    font-weight: bold;
}

/* Toast通知 */
.toast {
    position: fixed;
    bottom: 30px;
    right: 30px;
    padding: 15px 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 3000;
    transform: translateY(100px);
    opacity: 0;
    transition: all 0.3s ease;
    transform: translateY(0);
    opacity: 1;
}

.toast i {
    font-size: 20px;
}

.toast-success {
    border-left: 4px solid #2D862D;
}

.toast-success i {
    color: #2D862D;
}

.toast-info {
    border-left: 4px solid #00BFFF;
}

.toast-info i {
    color: #00BFFF;
}

.toast-warning {
    border-left: 4px solid #FFD700;
}

.toast-warning i {
    color: #FFD700;
}

.toast-error {
    border-left: 4px solid #FF0000;
}

.toast-error i {
    color: #FF0000;
}

/* 响应式调整 */
@media (max-width: 768px) {
    .env-stats-grid,
    .summary-grid,
    .feature-grid,
    .algorithm-grid,
    .calibration-grid,
    .data-management-grid,
    .system-info-grid {
        grid-template-columns: 1fr;
    }
    
    .grid-2 {
        grid-template-columns: 1fr;
    }
    
    .inverter-grid {
        grid-template-columns: 1fr;
    }
    
    .topology-node {
        width: 80px;
        height: 60px;
    }
    
    .node-icon {
        font-size: 18px;
    }
    
    .node-label {
        font-size: 10px;
    }
    
    .node-value {
        font-size: 9px;
    }
    
    .modal-content {
        margin: 10px;
        max-height: 80vh;
    }
}

/* 打印样式 */
@media print {
    .navbar,
    .alert-bar,
    .quick-actions,
    .modal,
    .toast {
        display: none !important;
    }
    
    .main-content {
        padding: 0;
    }
    
    .card {
        break-inside: avoid;
        box-shadow: none;
        border: 1px solid #000;
    }
    
    .chart-container {
        height: 200px;
    }
}

/* 加载动画 */
.loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #2D862D;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* 占位符 */
.placeholder {
    text-align: center;
    padding: 50px 20px;
    color: #666;
}

.placeholder i {
    font-size: 48px;
    margin-bottom: 20px;
    color: #ddd;
}

.placeholder h3 {
    margin-bottom: 10px;
    color: #333;
}

.placeholder p {
    color: #666;
}

/* 工具提示 */
.tooltip {
    position: relative;
    display: inline-block;
}

.tooltip .tooltip-text {
    visibility: hidden;
    width: 200px;
    background-color: #333;
    color: #fff;
    text-align: center;
    border-radius: 6px;
    padding: 5px;
    position: absolute;
    z-index: 1;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0;
    transition: opacity 0.3s;
    font-size: 12px;
}

.tooltip:hover .tooltip-text {
    visibility: visible;
    opacity: 1;
}

/* 徽章 */
.badge {
    display: inline-block;
    padding: 3px 8px;
    font-size: 12px;
    font-weight: bold;
    border-radius: 10px;
    margin-left: 5px;
}

.badge-danger {
    background-color: #FF0000;
    color: white;
}

.badge-warning {
    background-color: #FFD700;
    color: #333;
}

.badge-success {
    background-color: #2D862D;
    color: white;
}

.badge-info {
    background-color: #00BFFF;
    color: white;
}

/* 按钮尺寸 */
.btn-sm {
    padding: 5px 10px;
    font-size: 12px;
}

.btn-lg {
    padding: 12px 24px;
    font-size: 16px;
}

/* 表单组 */
.form-group.checkbox {
    display: flex;
    align-items: center;
    gap: 10px;
}

.form-group.checkbox label {
    margin-bottom: 0;
    cursor: pointer;
}

/* 日期范围选择器 */
.date-range {
    display: flex;
    align-items: center;
    gap: 10px;
}

.date-range input {
    flex: 1;
}

.date-range span {
    color: #666;
}

/* 报告预览 */
.report-sections {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-top: 10px;
}

.report-sections label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 14px;
    cursor: pointer;
}

.preview-content {
    padding: 15px;
    background: #f8f9fa;
    border-radius: 6px;
    margin-top: 10px;
}

.preview-content p {
    margin: 5px 0;
}

/* 成功图标 */
.success-icon {
    text-align: center;
    margin: 20px 0;
}

.success-icon i {
    font-size: 48px;
    color: #2D862D;
}

.report-info {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 6px;
    margin: 20px 0;
}

.report-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 20px;
}

/* 电压显示 */
.voltage-display {
    text-align: center;
    margin-top: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
}

.voltage-label {
    font-size: 14px;
    color: #666;
    margin-bottom: 5px;
}

.voltage-value {
    font-size: 24px;
    font-weight: bold;
    color: #333;
    font-family: 'Courier New', monospace;
}

/* 当前读数 */
.current-reading {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-top: 20px;
}

.reading {
    text-align: center;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
}

.reading .label {
    display: block;
    font-size: 14px;
    color: #666;
    margin-bottom: 5px;
}

.reading .value {
    display: block;
    font-size: 20px;
    font-weight: bold;
    color: #333;
    font-family: 'Courier New', monospace;
}

/* 扫描配置 */
.scan-config {
    margin-bottom: 20px;
}

.scan-preview {
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    margin-top: 20px;
}

.scan-preview h5 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #333;
}

.scan-preview p {
    margin: 0;
    color: #666;
    font-size: 14px;
}

/* 结果摘要 */
.result-summary {
    margin-bottom: 20px;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
}

.summary-item {
    padding: 10px;
    background: #f8f9fa;
    border-radius: 6px;
}

.summary-item .label {
    font-size: 12px;
    color: #666;
    margin-bottom: 3px;
}

.summary-item .value {
    font-size: 16px;
    font-weight: bold;
    color: #333;
}

.analysis-result {
    padding: 15px;
    border-radius: 8px;
    margin: 15px 0;
    display: flex;
    align-items: center;
    gap: 10px;
}

.analysis-result.normal {
    background: rgba(45, 134, 45, 0.1);
    border: 1px solid rgba(45, 134, 45, 0.3);
}

.analysis-result.warning {
    background: rgba(255, 215, 0, 0.1);
    border: 1px solid rgba(255, 215, 0, 0.3);
}

.analysis-result i {
    font-size: 20px;
}

.analysis-result.normal i {
    color: #2D862D;
}

.analysis-result.warning i {
    color: #FFD700;
}

/* 最终完成样式 */
body {
    font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
    line-height: 1.6;
    color: #333;
}

h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    line-height: 1.3;
}

a {
    color: #2D862D;
    text-decoration: none;
}

a:hover {
    text-decoration: underline;
}

code {
    font-family: 'Courier New', monospace;
    background: #f8f9fa;
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 0.9em;
}

pre {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    overflow-x: auto;
    font-family: 'Courier New', monospace;
}

blockquote {
    border-left: 4px solid #2D862D;
    padding-left: 15px;
    margin-left: 0;
    color: #666;
    font-style: italic;
}

hr {
    border: none;
    border-top: 1px solid #eee;
    margin: 20px 0;
}

/* 滚动条样式 */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

/* 选择文本样式 */
::selection {
    background-color: rgba(45, 134, 45, 0.3);
    color: #333;
}

/* 焦点样式 */
:focus {
    outline: 2px solid #2D862D;
    outline-offset: 2px;
}

/* 禁用状态 */
.disabled,
:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* 高亮文本 */
.highlight {
    background-color: #fff8e1;
    padding: 2px 4px;
    border-radius: 3px;
}

/* 警告框 */
.alert {
    padding: 15px;
    border-radius: 8px;
    margin: 15px 0;
    display: flex;
    align-items: flex-start;
    gap: 10px;
}

.alert i {
    font-size: 20px;
    flex-shrink: 0;
}

.alert-normal {
    background: rgba(45, 134, 45, 0.1);
    border: 1px solid rgba(45, 134, 45, 0.3);
    color: #2D862D;
}

.alert-warning {
    background: rgba(255, 215, 0, 0.1);
    border: 1px solid rgba(255, 215, 0, 0.3);
    color: #FFD700;
}

.alert-high {
    background: rgba(255, 140, 0, 0.1);
    border: 1px solid rgba(255, 140, 0, 0.3);
    color: #FF8C00;
}

.alert-critical {
    background: rgba(255, 0, 0, 0.1);
    border: 1px solid rgba(255, 0, 0, 0.3);
    color: #FF0000;
}

/* 标签 */
.tag {
    display: inline-block;
    padding: 3px 8px;
    font-size: 12px;
    border-radius: 12px;
    margin-right: 5px;
    margin-bottom: 5px;
}

.tag-primary {
    background: rgba(45, 134, 45, 0.1);
    color: #2D862D;
}

.tag-secondary {
    background: rgba(0, 191, 255, 0.1);
    color: #00BFFF;
}

.tag-warning {
    background: rgba(255, 215, 0, 0.1);
    color: #FFD700;
}

.tag-danger {
    background: rgba(255, 0, 0, 0.1);
    color: #FF0000;
}

/* 分页 */
.pagination {
    display: flex;
    justify-content: center;
    gap: 5px;
    margin: 20px 0;
}

.page-item {
    display: inline-block;
}

.page-link {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    color: #333;
    text-decoration: none;
}

.page-link:hover {
    background: #f8f9fa;
}

.page-item.active .page-link {
    background: #2D862D;
    color: white;
    border-color: #2D862D;
}

/* 下拉菜单 */
.dropdown {
    position: relative;
    display: inline-block;
}

.dropdown-toggle {
    cursor: pointer;
}

.dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    min-width: 200px;
    z-index: 1000;
    display: none;
}

.dropdown:hover .dropdown-menu {
    display: block;
}

.dropdown-item {
    display: block;
    padding: 10px 15px;
    color: #333;
    text-decoration: none;
    border-bottom: 1px solid #eee;
}

.dropdown-item:last-child {
    border-bottom: none;
}

.dropdown-item:hover {
    background: #f8f9fa;
}

/* 标签页 */
.tab-container {
    margin: 20px 0;
}

.tab-header {
    display: flex;
    border-bottom: 2px solid #eee;
}

.tab-button {
    padding: 10px 20px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    font-size: 14px;
    color: #666;
    transition: all 0.3s;
}

.tab-button:hover {
    color: #333;
}

.tab-button.active {
    color: #2D862D;
    border-bottom-color: #2D862D;
    font-weight: bold;
}

.tab-content {
    padding: 20px 0;
}

.tab-pane {
    display: none;
}

.tab-pane.active {
    display: block;
}

/* 折叠面板 */
.accordion {
    margin: 20px 0;
}

.accordion-item {
    border: 1px solid #eee;
    border-radius: 8px;
    margin-bottom: 10px;
    overflow: hidden;
}

.accordion-header {
    padding: 15px;
    background: #f8f9fa;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 500;
}

.accordion-header:hover {
    background: #f0f0f0;
}

.accordion-content {
    padding: 15px;
    display: none;
}

.accordion-item.active .accordion-content {
    display: block;
}

.accordion-item.active .accordion-header {
    background: #e8f5e8;
    color: #2D862D;
}

/* 工具类 */
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }
.text-justify { text-align: justify; }

.mt-0 { margin-top: 0; }
.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 1rem; }
.mt-4 { margin-top: 1.5rem; }
.mt-5 { margin-top: 3rem; }

.mb-0 { margin-bottom: 0; }
.mb-1 { margin-bottom: 0.25rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-3 { margin-bottom: 1rem; }
.mb-4 { margin-bottom: 1.5rem; }
.mb-5 { margin-bottom: 3rem; }

.p-0 { padding: 0; }
.p-1 { padding: 0.25rem; }
.p-2 { padding: 0.5rem; }
.p-3 { padding: 1rem; }
.p-4 { padding: 1.5rem; }
.p-5 { padding: 3rem; }

.d-none { display: none; }
.d-block { display: block; }
.d-inline { display: inline; }
.d-inline-block { display: inline-block; }
.d-flex { display: flex; }
.d-grid { display: grid; }

.flex-column { flex-direction: column; }
.flex-row { flex-direction: row; }
.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.align-start { align-items: flex-start; }
.align-center { align-items: center; }
.align-end { align-items: flex-end; }

.w-100 { width: 100%; }
.h-100 { height: 100%; }
.vh-100 { height: 100vh; }

.position-relative { position: relative; }
.position-absolute { position: absolute; }
.position-fixed { position: fixed; }
.position-sticky { position: sticky; }

.overflow-hidden { overflow: hidden; }
.overflow-auto { overflow: auto; }
.overflow-scroll { overflow: scroll; }

.border { border: 1px solid #ddd; }
.border-0 { border: none; }
.border-top { border-top: 1px solid #ddd; }
.border-bottom { border-bottom: 1px solid #ddd; }
.border-left { border-left: 1px solid #ddd; }
.border-right { border-right: 1px solid #ddd; }

.rounded { border-radius: 4px; }
.rounded-circle { border-radius: 50%; }
.rounded-pill { border-radius: 50rem; }

.shadow { box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.shadow-lg { box-shadow: 0 10px 20px rgba(0,0,0,0.15); }

.bg-primary { background-color: #2D862D; color: white; }
.bg-secondary { background-color: #6c757d; color: white; }
.bg-success { background-color: #2D862D; color: white; }
.bg-danger { background-color: #FF0000; color: white; }
.bg-warning { background-color: #FFD700; color: #333; }
.bg-info { background-color: #00BFFF; color: white; }
.bg-light { background-color: #f8f9fa; color: #333; }
.bg-dark { background-color: #343a40; color: white; }
.bg-white { background-color: white; color: #333; }

.text-primary { color: #2D862D; }
.text-secondary { color: #6c757d; }
.text-success { color: #2D862D; }
.text-danger { color: #FF0000; }
.text-warning { color: #FFD700; }
.text-info { color: #00BFFF; }
.text-light { color: #f8f9fa; }
.text-dark { color: #343a40; }
.text-white { color: white; }
.text-muted { color: #6c757d; }

.font-weight-light { font-weight: 300; }
.font-weight-normal { font-weight: 400; }
.font-weight-bold { font-weight: 700; }
.font-italic { font-style: italic; }

.font-size-sm { font-size: 0.875rem; }
.font-size-base { font-size: 1rem; }
.font-size-lg { font-size: 1.25rem; }
.font-size-xl { font-size: 1.5rem; }
.font-size-xxl { font-size: 2rem; }

/* 动画效果 */
.fade-in {
    animation: fadeIn 0.5s ease;
}

.slide-in-up {
    animation: slideInUp 0.3s ease;
}

.slide-in-down {
    animation: slideInDown 0.3s ease;
}

.slide-in-left {
    animation: slideInLeft 0.3s ease;
}

.slide-in-right {
    animation: slideInRight 0.3s ease;
}

.scale-in {
    animation: scaleIn 0.3s ease;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideInUp {
    from {
        transform: translateY(50px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

@keyframes slideInDown {
    from {
        transform: translateY(-50px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

@keyframes slideInLeft {
    from {
        transform: translateX(-50px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideInRight {
    from {
        transform: translateX(50px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes scaleIn {
    from {
        transform: scale(0.9);
        opacity: 0;
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
}

/* 旋转动画 */
.rotate {
    animation: rotate 2s linear infinite;
}

@keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

/* 脉冲动画 */
.pulse {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}

/* 呼吸动画 */
.breathe {
    animation: breathe 3s ease-in-out infinite;
}

@keyframes breathe {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

/* 最终调整 */
* {
    box-sizing: border-box;
}

html {
    scroll-behavior: smooth;
}

body {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

main {
    flex: 1;
}

/* 打印优化 */
@media print {
    .no-print {
        display: none !important;
    }
    
    .print-break {
        page-break-before: always;
    }
    
    .print-avoid-break {
        page-break-inside: avoid;
    }
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
    :root {
        --bg-primary: #1a1a1a;
        --bg-secondary: #2d2d2d;
        --bg-card: #2d2d2d;
        --text-primary: #ffffff;
        --text-secondary: #b3b3b3;
        --border-color: #404040;
    }
    
    .card {
        background-color: var(--bg-card);
        color: var(--text-primary);
    }
    
    .data-table th {
        background-color: var(--bg-secondary);
    }
    
    .data-table tr:hover {
        background-color: rgba(255, 255, 255, 0.05);
    }
}

/* 可访问性优化 */
.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

.skip-to-content {
    position: absolute;
    top: -40px;
    left: 0;
    background: #2D862D;
    color: white;
    padding: 8px;
    z-index: 10000;
    text-decoration: none;
}

.skip-to-content:focus {
    top: 0;
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
    :root {
        --status-normal: #006400;
        --status-critical: #8b0000;
        --status-high: #ff4500;
        --status-medium: #ffd700;
        --status-low: #1e90ff;
    }
    
    .btn-primary {
        background-color: #006400;
    }
    
    .btn-danger {
        background-color: #8b0000;
    }
}

/* 减少动画 */
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
    .btn,
    .nav-tab,
    .alarm-item,
    .inverter-card {
        min-height: 44px;
        min-width: 44px;
    }
    
    .dropdown:hover .dropdown-menu {
        display: none;
    }
    
    .dropdown.active .dropdown-menu {
        display: block;
    }
}

/* 大字体模式 */
@media (prefers-font-size: large) {
    :root {
        font-size: 18px;
    }
    
    .btn,
    .nav-tab,
    .form-control {
        font-size: 1.1rem;
    }
}

/* 完成消息 */
.completion-message {
    text-align: center;
    padding: 50px 20px;
    background: linear-gradient(135deg, #2D862D, #247224);
    color: white;
    border-radius: 12px;
    margin: 20px 0;
}

.completion-message i {
    font-size: 64px;
    margin-bottom: 20px;
    display: block;
}

.completion-message h2 {
    margin-bottom: 15px;
    font-size: 2rem;
}

.completion-message p {
    font-size: 1.2rem;
    margin-bottom: 25px;
    opacity: 0.9;
}

.completion-actions {
    display: flex;
    gap: 15px;
    justify-content: center;
    flex-wrap: wrap;
}

/* 系统状态指示器 */
.system-status-indicator {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
}

.system-status-indicator.online {
    background: rgba(45, 134, 45, 0.1);
    color: #2D862D;
}

.system-status-indicator.offline {
    background: rgba(255, 0, 0, 0.1);
    color: #FF0000;
}

.system-status-indicator.warning {
    background: rgba(255, 215, 0, 0.1);
    color: #FFD700;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
}

.status-dot.online {
    background: #2D862D;
    animation: pulse 2s infinite;
}

.status-dot.offline {
    background: #FF0000;
}

.status-dot.warning {
    background: #FFD700;
}

/* 数据卡片 */
.data-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    transition: all 0.3s ease;
    border: 1px solid #eee;
}

.data-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.data-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 2px solid #f0f0f0;
}

.data-card-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    display: flex;
    align-items: center;
    gap: 10px;
}

.data-card-value {
    font-size: 32px;
    font-weight: 700;
    color: #2D862D;
    margin: 10px 0;
    font-family: 'Courier New', monospace;
}

.data-card-trend {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 14px;
    color: #666;
}

.data-card-trend.up {
    color: #2D862D;
}

.data-card-trend.down {
    color: #FF0000;
}

/* 时间线 */
.timeline {
    position: relative;
    padding-left: 30px;
}

.timeline::before {
    content: '';
    position: absolute;
    left: 10px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #ddd;
}

.timeline-item {
    position: relative;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #eee;
}

.timeline-item:last-child {
    margin-bottom: 0;
    border-bottom: none;
}

.timeline-marker {
    position: absolute;
    left: -30px;
    top: 0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #2D862D;
    border: 3px solid white;
    box-shadow: 0 0 0 3px #2D862D;
}

.timeline-content {
    padding-left: 10px;
}

.timeline-time {
    font-size: 12px;
    color: #666;
    margin-bottom: 5px;
}

.timeline-title {
    font-weight: 600;
    margin-bottom: 5px;
    color: #333;
}

.timeline-description {
    font-size: 14px;
    color: #666;
    line-height: 1.5;
}

/* 统计图表容器 */
.stats-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.stat-chart {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.stat-chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.stat-chart-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
}

.stat-chart-value {
    font-size: 24px;
    font-weight: 700;
    color: #2D862D;
}

/* 加载骨架屏 */
.skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 4px;
}

@keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

.skeleton-text {
    height: 16px;
    margin-bottom: 8px;
}

.skeleton-title {
    height: 24px;
    width: 60%;
    margin-bottom: 16px;
}

.skeleton-button {
    height: 36px;
    width: 100px;
    border-radius: 4px;
}

/* 完成所有样式 */
`;

// 将CSS样式添加到页面
const styleElement = document.createElement('style');
styleElement.textContent = extraStyles;
document.head.appendChild(styleElement);