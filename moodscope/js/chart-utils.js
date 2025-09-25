/**
 * MoodScope Chart Utilities
 * Provides chart rendering functionality for sentiment visualization
 * Author: Labib Bin Shahed
 */

class ChartUtils {
  constructor() {
    this.colors = {
      positive: '#4CAF50',
      neutral: '#FF9800',
      negative: '#F44336',
      background: '#ffffff',
      text: '#333333',
      grid: '#e0e0e0'
    };
    
    this.darkColors = {
      positive: '#66BB6A',
      neutral: '#FFB74D',
      negative: '#EF5350',
      background: '#1e1e1e',
      text: '#ffffff',
      grid: '#404040'
    };
  }
  
  /**
   * Get colors based on current theme
   */
  getColors(isDark = false) {
    return isDark ? this.darkColors : this.colors;
  }
  
  /**
   * Render a pie chart for sentiment distribution
   */
  renderPieChart(canvas, data, isDark = false) {
    const ctx = canvas.getContext('2d');
    const colors = this.getColors(isDark);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    
    const total = data.positive + data.neutral + data.negative;
    
    if (total === 0) {
      this.drawEmptyChart(ctx, canvas, 'No data available', colors);
      return;
    }
    
    // Calculate angles
    const angles = {
      positive: (data.positive / total) * 2 * Math.PI,
      neutral: (data.neutral / total) * 2 * Math.PI,
      negative: (data.negative / total) * 2 * Math.PI
    };
    
    let currentAngle = -Math.PI / 2; // Start from top
    
    // Draw segments
    const segments = [
      { key: 'positive', value: data.positive, color: colors.positive, label: 'Positive' },
      { key: 'neutral', value: data.neutral, color: colors.neutral, label: 'Neutral' },
      { key: 'negative', value: data.negative, color: colors.negative, label: 'Negative' }
    ];
    
    segments.forEach(segment => {
      if (segment.value > 0) {
        const segmentAngle = angles[segment.key];
        
        // Draw segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + segmentAngle);
        ctx.closePath();
        ctx.fillStyle = segment.color;
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = colors.background;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw label
        const labelAngle = currentAngle + segmentAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
        const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
        
        ctx.fillStyle = colors.text;
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const percentage = ((segment.value / total) * 100).toFixed(1);
        if (parseFloat(percentage) > 5) { // Only show label if segment is large enough
          ctx.fillText(`${percentage}%`, labelX, labelY);
        }
        
        currentAngle += segmentAngle;
      }
    });
    
    // Draw legend
    this.drawPieLegend(ctx, canvas, segments, total, colors);
  }
  
  /**
   * Draw legend for pie chart
   */
  drawPieLegend(ctx, canvas, segments, total, colors) {
    const legendX = 10;
    const legendY = canvas.height - 80;
    const legendItemHeight = 20;
    
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    segments.forEach((segment, index) => {
      const y = legendY + index * legendItemHeight;
      
      // Draw color box
      ctx.fillStyle = segment.color;
      ctx.fillRect(legendX, y - 6, 12, 12);
      
      // Draw text
      ctx.fillStyle = colors.text;
      const percentage = total > 0 ? ((segment.value / total) * 100).toFixed(1) : '0.0';
      ctx.fillText(`${segment.label}: ${segment.value} (${percentage}%)`, legendX + 20, y);
    });
  }
  
  /**
   * Render a bar chart for sentiment trends
   */
  renderBarChart(canvas, data, isDark = false) {
    const ctx = canvas.getContext('2d');
    const colors = this.getColors(isDark);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!data || data.length === 0) {
      this.drawEmptyChart(ctx, canvas, 'No trend data available', colors);
      return;
    }
    
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    
    // Find max value for scaling
    const maxValue = Math.max(...data.map(d => Math.max(d.positive, d.neutral, d.negative)));
    
    if (maxValue === 0) {
      this.drawEmptyChart(ctx, canvas, 'No data to display', colors);
      return;
    }
    
    const barWidth = chartWidth / data.length;
    const subBarWidth = barWidth / 4; // 3 bars + spacing
    
    // Draw grid lines
    this.drawGrid(ctx, canvas, padding, chartHeight, maxValue, colors);
    
    // Draw bars
    data.forEach((item, index) => {
      const x = padding + index * barWidth;
      
      // Positive bar
      const positiveHeight = (item.positive / maxValue) * chartHeight;
      ctx.fillStyle = colors.positive;
      ctx.fillRect(x, padding + chartHeight - positiveHeight, subBarWidth, positiveHeight);
      
      // Neutral bar
      const neutralHeight = (item.neutral / maxValue) * chartHeight;
      ctx.fillStyle = colors.neutral;
      ctx.fillRect(x + subBarWidth, padding + chartHeight - neutralHeight, subBarWidth, neutralHeight);
      
      // Negative bar
      const negativeHeight = (item.negative / maxValue) * chartHeight;
      ctx.fillStyle = colors.negative;
      ctx.fillRect(x + 2 * subBarWidth, padding + chartHeight - negativeHeight, subBarWidth, negativeHeight);
      
      // Draw time label
      ctx.fillStyle = colors.text;
      ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      const timeLabel = this.formatTimeLabel(item.timestamp);
      ctx.fillText(timeLabel, x + barWidth / 2, padding + chartHeight + 5);
    });
    
    // Draw legend
    this.drawBarLegend(ctx, canvas, colors);
  }
  
  /**
   * Draw grid lines for bar chart
   */
  drawGrid(ctx, canvas, padding, chartHeight, maxValue, colors) {
    const gridLines = 5;
    const stepValue = maxValue / gridLines;
    
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= gridLines; i++) {
      const y = padding + chartHeight - (i / gridLines) * chartHeight;
      const value = Math.round(i * stepValue);
      
      // Draw grid line
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
      
      // Draw value label
      ctx.fillText(value.toString(), padding - 5, y);
    }
  }
  
  /**
   * Draw legend for bar chart
   */
  drawBarLegend(ctx, canvas, colors) {
    const legendItems = [
      { color: colors.positive, label: 'Positive' },
      { color: colors.neutral, label: 'Neutral' },
      { color: colors.negative, label: 'Negative' }
    ];
    
    const legendX = canvas.width - 120;
    const legendY = 20;
    const itemHeight = 20;
    
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    legendItems.forEach((item, index) => {
      const y = legendY + index * itemHeight;
      
      // Draw color box
      ctx.fillStyle = item.color;
      ctx.fillRect(legendX, y - 6, 12, 12);
      
      // Draw text
      ctx.fillStyle = colors.text;
      ctx.fillText(item.label, legendX + 20, y);
    });
  }
  
  /**
   * Draw empty chart message
   */
  drawEmptyChart(ctx, canvas, message, colors) {
    ctx.fillStyle = colors.text;
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
  }
  
  /**
   * Format timestamp for chart labels
   */
  formatTimeLabel(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      return 'Now';
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d`;
    }
  }
  
  /**
   * Generate sample trend data for demonstration
   */
  generateSampleTrendData(days = 7) {
    const data = [];
    const now = Date.now();
    
    for (let i = days - 1; i >= 0; i--) {
      const timestamp = now - (i * 24 * 60 * 60 * 1000);
      data.push({
        timestamp,
        positive: Math.floor(Math.random() * 50) + 10,
        neutral: Math.floor(Math.random() * 30) + 5,
        negative: Math.floor(Math.random() * 20) + 2
      });
    }
    
    return data;
  }
  
  /**
   * Animate chart rendering
   */
  animateChart(canvas, renderFunction, duration = 1000) {
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      renderFunction(easedProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  /**
   * Export chart as image
   */
  exportChart(canvas, filename = 'moodscope-chart.png') {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
  
  /**
   * Resize canvas for high DPI displays
   */
  setupHighDPICanvas(canvas) {
    const ctx = canvas.getContext('2d');
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Get the size the canvas should be displayed at
    const rect = canvas.getBoundingClientRect();
    
    // Set the internal size to the display size * device pixel ratio
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    
    // Scale the context so everything draws at the correct size
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    // Set the CSS size to the original size
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChartUtils;
} else {
  window.ChartUtils = ChartUtils;
}