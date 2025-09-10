let myChart = null;
let datasetCounter = 1;
let currentZoom = 1.0;
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;

const elements = {
    chartCanvas: document.getElementById('myChart'),
    chartContainer: document.getElementById('chart-container'),
    mainContainer: document.getElementById('main-container'),
    chartTypeButtons: document.querySelectorAll('.chart-type-btn'),
    dataGrid: document.getElementById('data-grid'),
    yLabelInput: document.getElementById('y-label'),
    yLabel2Input: document.getElementById('y-label-2'),
    dualDataControls: document.getElementById('dual-data-controls'),
    chartTitleInput: document.getElementById('chart-title'),
    chartColorInput: document.getElementById('chart-color'),
    colorPresets: document.querySelectorAll('.color-preset'),
    showLegendCheckbox: document.getElementById('show-legend'),
    showAnimationCheckbox: document.getElementById('show-animation'),
    showGridCheckbox: document.getElementById('show-grid'),
    enableMixedChartCheckbox: document.getElementById('enable-mixed-chart'),
    mixedChartControls: document.getElementById('mixed-chart-controls'),
    zoomInButton: document.getElementById('zoom-in'),
    zoomOutButton: document.getElementById('zoom-out'),
    zoomLevel: document.getElementById('zoom-level'),
    generateButton: document.getElementById('generate-chart'),
    addDataRowButton: document.getElementById('add-data-row'),
    downloadButton: document.getElementById('download-chart'),
    resetButton: document.getElementById('reset-chart'),
    loadingOverlay: document.getElementById('loading-overlay'),
    autoScaleXCheckbox: document.getElementById('auto-scale-x'),
    xMinInput: document.getElementById('x-min'),
    xMaxInput: document.getElementById('x-max'),
    xAxisManualScale: document.getElementById('x-axis-manual-scale'),
    xAxisManualScaleMax: document.getElementById('x-axis-manual-scale-max')
};

const colorPalette = [
    '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#16a085'
];

document.addEventListener('DOMContentLoaded', function() {
    detectIframeMode();
    initializeEventListeners();
    // 初始化顏色選擇器
    updateColorPresetSelection('#3498db');
    // 初始化X軸範圍設定
    toggleXAxisScaleInputs();
    generateChart();
});

function initializeEventListeners() {
    elements.chartTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            selectChartType(this);
        });
    });

    elements.generateButton.addEventListener('click', generateChart);
    elements.addDataRowButton.addEventListener('click', addDataRow);
    elements.downloadButton.addEventListener('click', downloadChart);
    elements.resetButton.addEventListener('click', resetChart);

    // 顏色選擇器事件
    elements.chartColorInput.addEventListener('change', updateChartColor);
    elements.colorPresets.forEach(preset => {
        preset.addEventListener('click', function() {
            selectColorPreset(this);
        });
    });

    // 複合圖表控制
    elements.enableMixedChartCheckbox.addEventListener('change', toggleMixedChart);

    // 縮放控制
    elements.zoomInButton.addEventListener('click', zoomIn);
    elements.zoomOutButton.addEventListener('click', zoomOut);

    // X軸範圍控制
    elements.autoScaleXCheckbox.addEventListener('change', toggleXAxisScaleInputs);
    elements.xMinInput.addEventListener('input', debounce(generateChart, 500));
    elements.xMaxInput.addEventListener('input', debounce(generateChart, 500));

    // 移除自動生成功能，只有點擊按鈕才生成圖表
    // const inputElements = [
    //     elements.yLabelInput,
    //     elements.chartTitleInput,
    //     elements.showLegendCheckbox,
    //     elements.showAnimationCheckbox,
    //     elements.showGridCheckbox
    // ];

    // inputElements.forEach(element => {
    //     element.addEventListener('change', debounce(generateChart, 500));
    //     if (element.type !== 'checkbox') {
    //         element.addEventListener('input', debounce(generateChart, 800));
    //     }
    // });

    // 數據網格事件監聽
    elements.dataGrid.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-row')) {
            removeDataRow(e.target.closest('.data-row'));
        }
    });

    // 移除自動生成功能
    // elements.dataGrid.addEventListener('input', function(e) {
    //     if (e.target.classList.contains('label-input') || 
    //         e.target.classList.contains('value-input')) {
    //         debounce(generateChart, 500)();
    //     }
    // });
}

function selectChartType(button) {
    elements.chartTypeButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    button.style.animation = 'pulse 0.3s ease-in-out';
    setTimeout(() => {
        button.style.animation = '';
    }, 300);
    // 移除自動生成，需要用戶手動點擊生成按鈕
    // generateChart();
}

function getSelectedChartType() {
    const activeButton = document.querySelector('.chart-type-btn.active');
    return activeButton ? activeButton.dataset.type : 'bar';
}

// 新增數據行
function addDataRow() {
    const dataRow = document.createElement('div');
    dataRow.className = 'data-row';
    
    // 生成隨機顏色
    const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    const isMixed = elements.enableMixedChartCheckbox.checked;
    
    dataRow.innerHTML = `
        <input type="text" class="label-input" placeholder="標籤" value="">
        <input type="number" class="value-input" placeholder="${isMixed ? '數值1' : '數值'}" value="">
        <input type="number" class="value-input-2" placeholder="數值2" value="" style="display: ${isMixed ? 'block' : 'none'};">
        <input type="color" class="color-input" value="${randomColor}" title="顏色">
        <button class="btn btn-danger btn-small remove-row">-</button>
    `;
    
    elements.dataGrid.appendChild(dataRow);
    dataRow.style.animation = 'slideInLeft 0.3s ease-out';
    
    // 自動聚焦到新增的標籤輸入框
    dataRow.querySelector('.label-input').focus();
    // 移除自動生成
    // generateChart();
}

function showSecondDataInputs(show) {
    const valueInputs2 = document.querySelectorAll('.value-input-2');
    const dataGrid = elements.dataGrid;
    
    if (show) {
        dataGrid.classList.add('dual-data-mode');
        valueInputs2.forEach(input => {
            input.style.display = 'block';
        });
    } else {
        dataGrid.classList.remove('dual-data-mode');
        valueInputs2.forEach(input => {
            input.style.display = 'none';
        });
    }
}

// 移除數據行
function removeDataRow(dataRow) {
    if (elements.dataGrid.children.length > 1) {
        dataRow.style.animation = 'slideInLeft 0.3s ease-out reverse';
        setTimeout(() => {
            dataRow.remove();
        }, 300);
    } else {
        showNotification('至少需要保留一個數據項！', 'warning');
    }
}

// 檢測iframe模式
function detectIframeMode() {
    if (window !== window.top) {
        document.body.classList.add('iframe-mode');
    }
}

// 顏色選擇器功能
function updateChartColor() {
    const color = elements.chartColorInput.value;
    updateColorPresetSelection(color);
}

function selectColorPreset(presetButton) {
    const color = presetButton.dataset.color;
    elements.chartColorInput.value = color;
    updateColorPresetSelection(color);
}

function updateColorPresetSelection(selectedColor) {
    elements.colorPresets.forEach(preset => {
        preset.classList.remove('active');
        if (preset.dataset.color === selectedColor) {
            preset.classList.add('active');
        }
    });
}

// 複合圖表功能
function toggleMixedChart() {
    const isMixed = elements.enableMixedChartCheckbox.checked;
    if (isMixed) {
        elements.mixedChartControls.style.display = 'block';
        elements.dualDataControls.style.display = 'block';
        // 顯示第二組數據輸入欄
        showSecondDataInputs(true);
        // 自動選擇複合圖表類型
        const mixedButton = document.querySelector('[data-type="mixed"]');
        if (mixedButton) {
            selectChartType(mixedButton);
        }
    } else {
        elements.mixedChartControls.style.display = 'none';
        elements.dualDataControls.style.display = 'none';
        // 隱藏第二組數據輸入欄
        showSecondDataInputs(false);
        // 回到預設圖表類型
        const barButton = document.querySelector('[data-type="bar"]');
        if (barButton) {
            selectChartType(barButton);
        }
    }
}

// X軸範圍手動輸入框切換
function toggleXAxisScaleInputs() {
    const isAutoScale = elements.autoScaleXCheckbox.checked;
    if (isAutoScale) {
        elements.xAxisManualScale.style.display = 'none';
        elements.xAxisManualScaleMax.style.display = 'none';
    } else {
        elements.xAxisManualScale.style.display = 'block';
        elements.xAxisManualScaleMax.style.display = 'block';
    }
    generateChart();
}

function getMixedChartType() {
    const selectedRadio = document.querySelector('input[name="mixed-type"]:checked');
    return selectedRadio ? selectedRadio.value : 'double-bar';
}

// 縮放功能
function zoomIn() {
    if (currentZoom < MAX_ZOOM) {
        currentZoom += ZOOM_STEP;
        updateZoom();
    }
}

function zoomOut() {
    if (currentZoom > MIN_ZOOM) {
        currentZoom -= ZOOM_STEP;
        updateZoom();
    }
}

function updateZoom() {
    const zoomPercent = Math.round(currentZoom * 100);
    elements.zoomLevel.textContent = `${zoomPercent}%`;
    elements.mainContainer.style.transform = `scale(${currentZoom})`;
    elements.mainContainer.style.transformOrigin = 'center top';
    elements.mainContainer.style.transition = 'transform 0.3s ease';
    
    // 調整body padding以適應縮放後的內容
    if (currentZoom < 1) {
        document.body.style.paddingTop = '20px';
    } else if (currentZoom > 1) {
        document.body.style.paddingTop = `${20 * currentZoom}px`;
    } else {
        document.body.style.paddingTop = '20px';
    }
}

// 移除了數據集相關功能

// 從數據網格獲取基礎數據
function getDataFromGrid() {
    const dataRows = elements.dataGrid.querySelectorAll('.data-row');
    const labels = [];
    const values = [];
    const values2 = [];
    const colors = [];
    
    dataRows.forEach(row => {
        const labelInput = row.querySelector('.label-input');
        const valueInput = row.querySelector('.value-input');
        const valueInput2 = row.querySelector('.value-input-2');
        const colorInput = row.querySelector('.color-input');
        
        const label = labelInput.value.trim();
        const value = parseFloat(valueInput.value);
        const value2 = parseFloat(valueInput2.value);
        const color = colorInput.value;
        
        if (label) {
            labels.push(label);
            values.push(isNaN(value) ? 0 : value);
            values2.push(isNaN(value2) ? 0 : value2);
            colors.push(color);
        }
    });
    
    return { labels, values, values2, colors };
}

function getDatasets() {
    const baseData = getDataFromGrid();
    const datasets = [];
    const chartType = getSelectedChartType();
    
    if (chartType === 'mixed') {
        const mixedType = getMixedChartType();
        
        if (mixedType === 'double-bar') {
            // 雙棒形圖
            datasets.push({
                type: 'bar',
                label: elements.yLabelInput.value || '第一組數據',
                data: baseData.values,
                backgroundColor: baseData.colors.map(color => color + '80'), // 添加透明度
                borderColor: baseData.colors,
                borderWidth: 2
            });
            
            datasets.push({
                type: 'bar',
                label: elements.yLabel2Input.value || '第二組數據',
                data: baseData.values2,
                backgroundColor: baseData.colors.map(color => {
                    // 將顏色變暗一些
                    const rgb = hexToRgb(color);
                    return `rgba(${Math.max(0, rgb.r - 40)}, ${Math.max(0, rgb.g - 40)}, ${Math.max(0, rgb.b - 40)}, 0.8)`;
                }),
                borderColor: baseData.colors.map(color => {
                    const rgb = hexToRgb(color);
                    return `rgb(${Math.max(0, rgb.r - 40)}, ${Math.max(0, rgb.g - 40)}, ${Math.max(0, rgb.b - 40)})`;
                }),
                borderWidth: 2
            });
        } else if (mixedType === 'double-line') {
            // 雙折線圖
            datasets.push({
                type: 'line',
                label: elements.yLabelInput.value || '第一組數據',
                data: baseData.values,
                backgroundColor: 'transparent',
                borderColor: baseData.colors,
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: baseData.colors,
                fill: false
            });
            
            datasets.push({
                type: 'line',
                label: elements.yLabel2Input.value || '第二組數據',
                data: baseData.values2,
                backgroundColor: 'transparent',
                borderColor: baseData.colors.map(color => {
                    const rgb = hexToRgb(color);
                    return `rgb(${Math.max(0, rgb.r - 40)}, ${Math.max(0, rgb.g - 40)}, ${Math.max(0, rgb.b - 40)})`;
                }),
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: baseData.colors.map(color => {
                    const rgb = hexToRgb(color);
                    return `rgb(${Math.max(0, rgb.r - 40)}, ${Math.max(0, rgb.g - 40)}, ${Math.max(0, rgb.b - 40)})`;
                }),
                fill: false,
                borderDash: [5, 5] // 虛線樣式
            });
        } else if (mixedType === 'line-bar') {
            // 折線圖 + 棒形圖
            datasets.push({
                type: 'bar',
                label: elements.yLabelInput.value || '棒形數據',
                data: baseData.values,
                backgroundColor: baseData.colors.map(color => color + '80'),
                borderColor: baseData.colors,
                borderWidth: 2,
                yAxisID: 'y'
            });
            
            datasets.push({
                type: 'line',
                label: elements.yLabel2Input.value || '折線數據',
                data: baseData.values2,
                backgroundColor: 'transparent',
                borderColor: '#e74c3c',
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#e74c3c',
                fill: false,
                yAxisID: 'y1'
            });
        }
    } else {
        // 普通圖表，使用個別顏色
        const chartType = getSelectedChartType();
        if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') {
            datasets.push({
                label: elements.yLabelInput.value || '數據',
                data: baseData.values,
                backgroundColor: baseData.colors,
                borderColor: baseData.colors.map(color => {
                    const rgb = hexToRgb(color);
                    return `rgb(${Math.max(0, rgb.r - 20)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)})`;
                }),
                borderWidth: 2
            });
        } else {
            datasets.push({
                label: elements.yLabelInput.value || '數據',
                data: baseData.values,
                backgroundColor: baseData.colors.map(color => color + '80'),
                borderColor: baseData.colors,
                borderWidth: 3,
                fill: false
            });
        }
    }
    
    return datasets;
}

function getBackgroundColors(baseColor, count) {
    const chartType = getSelectedChartType();
    
    if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') {
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(colorPalette[i % colorPalette.length]);
        }
        return colors;
    } else {
        const rgb = hexToRgb(baseColor);
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`;
    }
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function generateChart() {
    showLoading(true);
    
    setTimeout(() => {
        try {
            const chartType = getSelectedChartType();
            const baseData = getDataFromGrid();
            const datasets = getDatasets();
            
            if (baseData.labels.length === 0) {
                showNotification('請至少輸入一個數據項！', 'error');
                showLoading(false);
                return;
            }
            
            if (datasets.length === 0) {
                showNotification('請至少新增一個數據集！', 'error');
                showLoading(false);
                return;
            }
            
            if (myChart) {
                myChart.destroy();
            }
            
            const config = getChartConfig(chartType, baseData.labels, datasets);
            myChart = new Chart(elements.chartCanvas, config);
            showNotification('圖表生成成功！', 'success');
            
        } catch (error) {
            console.error('生成圖表時出錯:', error);
            showNotification('生成圖表時出錯，請檢查您的數據格式！', 'error');
        }
        
        showLoading(false);
    }, 300);
}

function getChartConfig(type, labels, datasets) {
    const config = {
        type: type === 'mixed' ? 'bar' : type, // 複合圖表基於bar類型
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 20,
                    bottom: 20,
                    left: 10,
                    right: 10
                }
            },
            animation: {
                duration: elements.showAnimationCheckbox.checked ? 1200 : 0,
                easing: 'easeInOutQuart'
            },
            plugins: {
                title: {
                    display: !!elements.chartTitleInput.value,
                    text: elements.chartTitleInput.value,
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    color: '#2c3e50',
                    padding: 20
                },
                legend: {
                    display: elements.showLegendCheckbox.checked,
                    position: 'top',
                    labels: {
                        font: {
                            size: 12
                        },
                        color: '#2c3e50',
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: '#3498db',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true
                }
            }
        }
    };
    
    switch (type) {
        case 'mixed':
            // 複合圖表配置
            config.options.scales = {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    grace: '5%',
                    grid: {
                        display: elements.showGridCheckbox.checked,
                        color: 'rgba(0,0,0,0.1)'
                    },
                    title: {
                        display: !!elements.yLabelInput.value,
                        text: elements.yLabelInput.value,
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        color: '#2c3e50'
                    },
                    ticks: {
                        padding: 10
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    grace: '5%',
                    grid: {
                        drawOnChartArea: false,
                    },
                    title: {
                        display: true,
                        text: '趨勢',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        color: '#e74c3c'
                    },
                    ticks: {
                        padding: 10
                    }
                },
                x: {
                    grid: {
                        display: elements.showGridCheckbox.checked,
                        color: 'rgba(0,0,0,0.1)'
                    },
                    ticks: {
                        padding: 10,
                        maxRotation: 45
                    },
                    // X軸範圍自動調節和手動設定
                    min: elements.autoScaleXCheckbox.checked ? undefined : parseFloat(elements.xMinInput.value) || undefined,
                    max: elements.autoScaleXCheckbox.checked ? undefined : parseFloat(elements.xMaxInput.value) || undefined
                }
            };
            break;
            
        case 'bar':
            config.options.scales = {
                y: {
                    beginAtZero: true,
                    grace: '5%',
                    grid: {
                        display: elements.showGridCheckbox.checked,
                        color: 'rgba(0,0,0,0.1)'
                    },
                    title: {
                        display: !!elements.yLabelInput.value,
                        text: elements.yLabelInput.value,
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        color: '#2c3e50'
                    },
                    ticks: {
                        padding: 10
                    }
                },
                x: {
                    grid: {
                        display: elements.showGridCheckbox.checked,
                        color: 'rgba(0,0,0,0.1)'
                    },
                    ticks: {
                        padding: 10,
                        maxRotation: 45
                    },
                    // X軸範圍自動調節和手動設定
                    min: elements.autoScaleXCheckbox.checked ? undefined : parseFloat(elements.xMinInput.value) || undefined,
                    max: elements.autoScaleXCheckbox.checked ? undefined : parseFloat(elements.xMaxInput.value) || undefined
                }
            };
            break;
            
        case 'line':
            config.options.scales = {
                y: {
                    beginAtZero: true,
                    grace: '5%',
                    grid: {
                        display: elements.showGridCheckbox.checked,
                        color: 'rgba(0,0,0,0.1)'
                    },
                    title: {
                        display: !!elements.yLabelInput.value,
                        text: elements.yLabelInput.value,
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        color: '#2c3e50'
                    },
                    ticks: {
                        padding: 10
                    }
                },
                x: {
                    grid: {
                        display: elements.showGridCheckbox.checked,
                        color: 'rgba(0,0,0,0.1)'
                    },
                    ticks: {
                        padding: 10,
                        maxRotation: 45
                    },
                    // X軸範圍自動調節和手動設定
                    min: elements.autoScaleXCheckbox.checked ? undefined : parseFloat(elements.xMinInput.value) || undefined,
                    max: elements.autoScaleXCheckbox.checked ? undefined : parseFloat(elements.xMaxInput.value) || undefined
                }
            };
            datasets.forEach(dataset => {
                dataset.tension = 0.4;
                dataset.pointRadius = 5;
                dataset.pointHoverRadius = 8;
                dataset.pointBackgroundColor = dataset.borderColor;
            });
            break;
            
        case 'radar':
            config.options.scales = {
                r: {
                    beginAtZero: true,
                    grid: {
                        display: elements.showGridCheckbox.checked,
                        color: 'rgba(0,0,0,0.2)'
                    },
                    angleLines: {
                        display: elements.showGridCheckbox.checked,
                        color: 'rgba(0,0,0,0.2)'
                    }
                }
            };
            break;
    }
    
    return config;
}

function downloadChart() {
    if (!myChart) {
        showNotification('請先生成圖表！', 'warning');
        return;
    }
    
    const link = document.createElement('a');
    link.download = `chart_${new Date().getTime()}.png`;
    link.href = myChart.toBase64Image('image/png', 1);
    link.click();
    showNotification('圖表下載成功！', 'success');
}

function resetChart() {
    if (confirm('確定要重設所有設定嗎？')) {
        elements.yLabelInput.value = '銷售額';
        elements.yLabel2Input.value = '利潤';
        elements.chartTitleInput.value = 'LPMS數據分析報告';
        elements.chartColorInput.value = '#3498db';
        elements.showLegendCheckbox.checked = true;
        elements.showAnimationCheckbox.checked = true;
        elements.showGridCheckbox.checked = true;
        elements.enableMixedChartCheckbox.checked = false;
        elements.mixedChartControls.style.display = 'none';
        elements.dualDataControls.style.display = 'none';
        
        // 重設縮放
        currentZoom = 1.0;
        updateZoom();
        document.body.style.paddingTop = '20px';
        
        // 重設數據模式
        showSecondDataInputs(false);
        
        // 重設顏色選擇器
        updateColorPresetSelection('#3498db');

        // 重設X軸範圍設定
        elements.autoScaleXCheckbox.checked = true;
        elements.xAxisManualScale.style.display = 'none';
        elements.xAxisManualScaleMax.style.display = 'none';
        elements.xMinInput.value = '';
        elements.xMaxInput.value = '';
        
        elements.chartTypeButtons.forEach(btn => btn.classList.remove('active'));
        elements.chartTypeButtons[0].classList.add('active');
        
        // 重設數據網格
        elements.dataGrid.innerHTML = `
            <div class="data-row">
                <input type="text" class="label-input" placeholder="標籤" value="一月">
                <input type="number" class="value-input" placeholder="數值" value="120">
                <button class="btn btn-danger btn-small remove-row">-</button>
            </div>
            <div class="data-row">
                <input type="text" class="label-input" placeholder="標籤" value="二月">
                <input type="number" class="value-input" placeholder="數值" value="190">
                <button class="btn btn-danger btn-small remove-row">-</button>
            </div>
            <div class="data-row">
                <input type="text" class="label-input" placeholder="標籤" value="三月">
                <input type="number" class="value-input" placeholder="數值" value="300">
                <button class="btn btn-danger btn-small remove-row">-</button>
            </div>
            <div class="data-row">
                <input type="text" class="label-input" placeholder="標籤" value="四月">
                <input type="number" class="value-input" placeholder="數值" value="500">
                <button class="btn btn-danger btn-small remove-row">-</button>
            </div>
            <div class="data-row">
                <input type="text" class="label-input" placeholder="標籤" value="五月">
                <input type="number" class="value-input" placeholder="數值" value="200">
                <button class="btn btn-danger btn-small remove-row">-</button>
            </div>
        `;
        
        datasetCounter = 1;
        // 重設後自動生成一次圖表
        generateChart();
        showNotification('重設完成！', 'success');
    }
}

function showLoading(show) {
    if (show) {
        elements.loadingOverlay.classList.add('show');
    } else {
        elements.loadingOverlay.classList.remove('show');
    }
}

function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1001;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease-out;
        font-weight: 500;
        max-width: 300px;
    `;
    
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        margin-left: 10px;
    `;
    
    document.body.appendChild(notification);
    
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    });
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
}

function getNotificationColor(type) {
    const colors = {
        success: 'linear-gradient(135deg, #2ecc71, #27ae60)',
        error: 'linear-gradient(135deg, #e74c3c, #c0392b)',
        warning: 'linear-gradient(135deg, #f39c12, #e67e22)',
        info: 'linear-gradient(135deg, #3498db, #2980b9)'
    };
    return colors[type] || colors.info;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const slideInRightCSS = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;

const style = document.createElement('style');
style.textContent = slideInRightCSS;
document.head.appendChild(style);

document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        generateChart();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        downloadChart();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'r' && e.shiftKey) {
        e.preventDefault();
        resetChart();
    }
});

window.addEventListener('resize', debounce(function() {
    if (myChart) {
        myChart.resize();
    }
}, 250)); 