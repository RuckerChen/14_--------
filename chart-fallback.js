/**
 * Chart.js 离线备用方案
 * 当CDN加载失败时提供基本图表功能
 */

(function() {
    'use strict';
    
    // 检查是否已经加载了Chart.js
    if (typeof Chart !== 'undefined') {
        console.log('Chart.js already loaded, skipping fallback');
        return;
    }
    
    console.log('Loading Chart.js fallback implementation');
    
    // 简单的Chart模拟类
    class SimpleChart {
        constructor(ctx, config) {
            this.ctx = ctx;
            this.config = config;
            this.data = config.data || {};
            this.options = config.options || {};
            this.type = config.type || 'line';
            this.canvas = ctx.canvas;
            this.init();
        }
        
        init() {
            // 设置canvas尺寸
            this.canvas.width = this.canvas.clientWidth || 400;
            this.canvas.height = this.canvas.clientHeight || 300;
            
            // 绘制初始图表
            this.draw();
        }
        
        draw() {
            const ctx = this.ctx;
            const width = this.canvas.width;
            const height = this.canvas.height;
            
            // 清空画布
            ctx.clearRect(0, 0, width, height);
            
            // 根据图表类型绘制
            switch (this.type) {
                case 'line':
                    this.drawLineChart(ctx, width, height);
                    break;
                case 'bar':
                    this.drawBarChart(ctx, width, height);
                    break;
                case 'pie':
                case 'doughnut':
                    this.drawPieChart(ctx, width, height);
                    break;
                default:
                    this.drawFallback(ctx, width, height);
            }
        }
        
        drawLineChart(ctx, width, height) {
            const datasets = this.data.datasets || [];
            const padding = 40;
            const chartWidth = width - padding * 2;
            const chartHeight = height - padding * 2;
            
            // 绘制坐标轴
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 1;
            
            // X轴
            ctx.beginPath();
            ctx.moveTo(padding, height - padding);
            ctx.lineTo(width - padding, height - padding);
            ctx.stroke();
            
            // Y轴
            ctx.beginPath();
            ctx.moveTo(padding, padding);
            ctx.lineTo(padding, height - padding);
            ctx.stroke();
            
            // 绘制数据线
            datasets.forEach((dataset, index) => {
                const data = dataset.data || [];
                if (data.length === 0) return;
                
                ctx.strokeStyle = dataset.borderColor || this.getColor(index);
                ctx.lineWidth = dataset.borderWidth || 2;
                ctx.fillStyle = dataset.backgroundColor || 'transparent';
                
                ctx.beginPath();
                
                data.forEach((point, i) => {
                    const x = padding + (i / (data.length - 1)) * chartWidth;
                    const y = height - padding - (point.y / 100) * chartHeight;
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                });
                
                ctx.stroke();
                
                // 填充区域
                if (dataset.fill) {
                    ctx.lineTo(width - padding, height - padding);
                    ctx.lineTo(padding, height - padding);
                    ctx.closePath();
                    ctx.fill();
                }
            });
        }
        
        drawBarChart(ctx, width, height) {
            const datasets = this.data.datasets || [];
            const labels = this.data.labels || [];
            const padding = 40;
            const chartWidth = width - padding * 2;
            const chartHeight = height - padding * 2;
            
            if (labels.length === 0) return;
            
            const barWidth = chartWidth / labels.length * 0.7;
            const barSpacing = chartWidth / labels.length * 0.3;
            
            datasets.forEach((dataset, datasetIndex) => {
                const data = dataset.data || [];
                
                data.forEach((value, index) => {
                    const x = padding + index * (barWidth + barSpacing);
                    const barHeight = (value / 100) * chartHeight;
                    const y = height - padding - barHeight;
                    
                    ctx.fillStyle = dataset.backgroundColor || this.getColor(datasetIndex);
                    ctx.fillRect(x, y, barWidth, barHeight);
                    
                    // 边框
                    ctx.strokeStyle = dataset.borderColor || '#333';
                    ctx.lineWidth = dataset.borderWidth || 1;
                    ctx.strokeRect(x, y, barWidth, barHeight);
                });
            });
        }
        
        drawPieChart(ctx, width, height) {
            const datasets = this.data.datasets || [];
            if (datasets.length === 0) return;
            
            const dataset = datasets[0];
            const data = dataset.data || [];
            const colors = dataset.backgroundColor || [];
            
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(width, height) / 2 - 20;
            
            let total = data.reduce((sum, value) => sum + value, 0);
            if (total === 0) total = 1;
            
            let startAngle = 0;
            
            data.forEach((value, index) => {
                const sliceAngle = (value / total) * 2 * Math.PI;
                const endAngle = startAngle + sliceAngle;
                
                // 绘制扇形
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, startAngle, endAngle);
                ctx.closePath();
                
                ctx.fillStyle = colors[index] || this.getColor(index);
                ctx.fill();
                
                // 边框
                ctx.strokeStyle = dataset.borderColor || '#fff';
                ctx.lineWidth = dataset.borderWidth || 1;
                ctx.stroke();
                
                startAngle = endAngle;
            });
            
            // 如果是环形图，绘制中心圆
            if (this.type === 'doughnut') {
                const cutout = this.options.cutout || '50%';
                const cutoutRadius = typeof cutout === 'string' ? 
                    parseInt(cutout) / 100 * radius : radius * 0.5;
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, cutoutRadius, 0, 2 * Math.PI);
                ctx.fillStyle = '#fff';
                ctx.fill();
            }
        }
        
        drawFallback(ctx, width, height) {
            // 绘制简单的占位符
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, width, height);
            
            ctx.fillStyle = '#666';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('图表加载中...', width / 2, height / 2);
        }
        
        getColor(index) {
            const colors = [
                '#2D862D', '#FF8C00', '#FF0000', '#FFD700',
                '#00BFFF', '#808080', '#4B0082', '#FF69B4'
            ];
            return colors[index % colors.length];
        }
        
        update() {
            this.draw();
        }
        
        destroy() {
            // 清空画布
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    // 全局Chart对象
    window.Chart = function(ctx, config) {
        return new SimpleChart(ctx, config);
    };
    
    // 添加Chart的静态方法
    Chart.helpers = {
        color: function(color) {
            return {
                rgbString: () => color
            };
        }
    };
    
    Chart.defaults = {
        global: {
            responsive: true,
            maintainAspectRatio: false
        }
    };
    
    Chart.plugins = {
        register: function() {},
        unregister: function() {}
    };
    
    console.log('Chart.js fallback loaded successfully');
    
})();