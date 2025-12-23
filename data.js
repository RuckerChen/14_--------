// 模拟数据 - 台湾彰化北斗地区微电网
const systemData = {
    // 系统基本信息
    systemInfo: {
        name: "彰化北斗微电网光伏系统",
        location: "台湾彰化县北斗镇",
        coordinates: { lat: 23.897, lng: 120.524 },
        capacity: 5.2, // MW
        installedDate: "2023-06-15",
        operator: "台湾电力公司"
    },
    
    // 当前环境数据
    environment: {
        irradiance: 850, // W/m²
        temperature: 28.5, // °C
        humidity: 78, // %
        windSpeed: 3.2, // m/s
        saltFogLevel: "中等", // 盐雾浓度
        timestamp: new Date().toISOString()
    },
    
    // 核心KPI指标
    kpis: {
        totalPower: 4.12, // MW
        dailyGeneration: 28.4, // MWh
        performanceRatio: 0.92, // PR值
        systemEfficiency: 18.7, // %
        revenueToday: 85000, // 新台币
        co2Reduction: 22.8 // 吨
    },
    
    // 报警状态
    alarms: {
        active: 3,
        critical: 1,
        high: 1,
        medium: 1,
        low: 0,
        list: [
            {
                id: "ALM-2024-001",
                type: "critical",
                device: "逆变器-03",
                message: "直流拉弧检测 - 组串B-12",
                timestamp: "2024-01-15T10:23:45",
                acknowledged: false
            },
            {
                id: "ALM-2024-002",
                type: "high",
                device: "组串A-08",
                message: "电流离散度异常 (>20%)",
                timestamp: "2024-01-15T09:45:12",
                acknowledged: true
            },
            {
                id: "ALM-2024-003",
                type: "medium",
                device: "阵列C",
                message: "局部阴影检测 - 建议检查",
                timestamp: "2024-01-15T08:30:22",
                acknowledged: true
            }
        ]
    },
    
    // 设备状态
    devices: {
        inverters: [
            { id: "INV-01", status: "normal", power: 1.05, efficiency: 98.2, temperature: 42.3 },
            { id: "INV-02", status: "normal", power: 1.08, efficiency: 97.8, temperature: 45.1 },
            { id: "INV-03", status: "critical", power: 0.32, efficiency: 85.4, temperature: 52.7 },
            { id: "INV-04", status: "normal", power: 0.98, efficiency: 98.1, temperature: 43.2 },
            { id: "INV-05", status: "normal", power: 0.89, efficiency: 97.5, temperature: 41.8 }
        ],
        strings: [
            { id: "A-01", status: "normal", current: 8.2, voltage: 650, power: 5.33 },
            { id: "A-02", status: "normal", current: 8.1, voltage: 648, power: 5.25 },
            { id: "A-03", status: "medium", current: 6.5, voltage: 655, power: 4.26 },
            { id: "B-01", status: "normal", current: 8.3, voltage: 652, power: 5.41 },
            { id: "B-12", status: "critical", current: 0.8, voltage: 12, power: 0.01 }
        ],
        sensors: {
            irradiance: { value: 850, status: "normal" },
            temperature: { value: 28.5, status: "normal" },
            humidity: { value: 78, status: "high" },
            wind: { value: 3.2, status: "normal" },
            insulation: { value: 120, status: "low" } // kΩ
        }
    },
    
    // 故障检测数据
    faultDetection: {
        algorithms: [
            { name: "EWMA统计图", accuracy: 88.5, responseTime: 50, status: "active" },
            { name: "随机森林(RF)", accuracy: 91.2, responseTime: 120, status: "active" },
            { name: "CNN-LSTM混合", accuracy: 95.4, responseTime: 350, status: "active" },
            { name: "小波变换(WT)", accuracy: 90.1, responseTime: 150, status: "standby" }
        ],
        recentFaults: [
            { type: "阴影遮挡", confidence: 92, timestamp: "2024-01-14T14:30:00", resolved: true },
            { type: "PID效应", confidence: 15, timestamp: "2024-01-14T10:15:00", resolved: false },
            { type: "接线松动", confidence: 78, timestamp: "2024-01-13T16:45:00", resolved: true },
            { type: "盐雾腐蚀", confidence: 65, timestamp: "2024-01-12T09:20:00", resolved: false }
        ]
    },
    
    // I-V曲线数据
    ivCurveData: {
        healthy: {
            voltage: [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650],
            current: [9.2, 9.1, 9.0, 8.9, 8.8, 8.7, 8.6, 8.4, 8.2, 7.8, 7.2, 6.0, 3.5, 0]
        },
        shaded: {
            voltage: [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650],
            current: [6.5, 6.4, 6.3, 6.2, 6.1, 6.0, 5.9, 5.7, 5.5, 5.1, 4.5, 3.3, 1.8, 0]
        },
        pid: {
            voltage: [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650],
            current: [9.0, 8.9, 8.8, 8.7, 8.6, 8.5, 8.4, 8.2, 7.9, 7.4, 6.7, 5.4, 2.9, 0]
        }
    },
    
    // 历史数据
    historicalData: {
        dailyGeneration: [
            { date: "01-10", value: 26.8 },
            { date: "01-11", value: 27.2 },
            { date: "01-12", value: 25.9 },
            { date: "01-13", value: 28.1 },
            { date: "01-14", value: 27.8 },
            { date: "01-15", value: 28.4 }
        ],
        performanceRatio: [
            { hour: "00:00", value: 0 },
            { hour: "04:00", value: 0 },
            { hour: "08:00", value: 0.65 },
            { hour: "12:00", value: 0.92 },
            { hour: "16:00", value: 0.78 },
            { hour: "20:00", value: 0 }
        ]
    }
};

// 故障类型定义
const faultTypes = {
    "阴影遮挡": {
        description: "光伏组件被阴影部分或完全遮挡",
        severity: "high",
        indicators: ["电流下降", "I-V曲线多峰", "填充因子降低"],
        action: "检查遮挡物，清理组件表面"
    },
    "PID效应": {
        description: "电势诱导衰减导致组件性能下降",
        severity: "critical",
        indicators: ["绝缘电阻降低", "漏电流增加", "夜间功率损失"],
        action: "检查接地系统，考虑PID恢复装置"
    },
    "盐雾腐蚀": {
        description: "沿海盐雾环境导致的金属腐蚀",
        severity: "high",
        indicators: ["串联电阻增加", "连接点发热", "外观腐蚀"],
        action: "加强密封，定期清洗，使用防腐材料"
    },
    "接线松动": {
        description: "电缆连接点松动导致接触电阻增加",
        severity: "medium",
        indicators: ["局部过热", "电压波动", "功率不稳定"],
        action: "紧固连接端子，检查接线盒"
    },
    "电弧故障": {
        description: "直流侧电弧放电危险",
        severity: "emergency",
        indicators: ["高频噪声", "瞬时功率突变", "红外热点"],
        action: "立即关断相关回路，检查绝缘"
    }
};

// 导出数据
window.systemData = systemData;
window.faultTypes = faultTypes;