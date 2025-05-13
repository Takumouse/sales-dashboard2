// グローバル変数の定義
let salesData = [];        // 元のデータ
let filteredData = [];     // フィルター適用後のデータ
let currentPage = 1;       // 現在のページ
const rowsPerPage = 10;    // 1ページあたりの行数
let sortColumn = 'id';     // ソート列
let sortDirection = 'desc'; // ソート方向
let pieChart = null;       // 円グラフのインスタンス
let barChart = null;       // 棒グラフのインスタンス
let lineChart = null;      // 線グラフのインスタンス

// JSONデータの読み込み
function loadSalesData() {
    // インラインデータ（フォールバック用）
    const fallbackData = [
      {
        "id": 100,
        "date": "2025-05-11",
        "product": "Bread",
        "category": "Food",
        "region": "East",
        "amount": 1367,
        "quantity": 4,
        "status": "保留中"
      },
      // ここに残りのデータを追加
      // ...提供されたJSONデータをすべて貼り付ける
    ];

    // fetch APIを使用してJSONファイルを読み込む
    fetch('data/sales.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('JSONデータ読み込み成功:', data);
            salesData = data;
            initializeData();
        })
        .catch(error => {
            console.warn('JSONファイルの読み込みに失敗しました。フォールバックデータを使用します。', error);
            console.log('エラーの詳細:', error.message);
            
            // フォールバックデータを使用
            salesData = fallbackData;
            initializeData();
        });
}

// データの初期化と画面表示
function initializeData() {
    // フィルターのカテゴリーリストを生成
    populateCategoryFilter();
    
    // 初期データとして全データをセット
    filteredData = [...salesData];
    
    // 初期表示のためのデータ更新
    updateSummary();
    renderTable();
    
    // 初期チャートの描画（カテゴリー別）
    updateDualCharts('category');
    
    // カテゴリー選択タブを選択状態に
    document.querySelector('.chart-tab[data-chart-type="category"]').classList.add('active');
}

// カテゴリーフィルターの生成
function populateCategoryFilter() {
    const categorySelect = document.getElementById('category');
    
    // カテゴリーの一覧を抽出（重複を除去）
    const categories = [...new Set(salesData.map(item => item.category))];
    
    // ドロップダウンのオプションを生成
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

// ページ読み込み時にデータをロード
document.addEventListener('DOMContentLoaded', () => {
    loadSalesData();
    
    // イベントリスナーの設定
    setupEventListeners();
});

// イベントリスナーのセットアップ
function setupEventListeners() {
    // フィルター適用ボタン
    document.getElementById('apply-filters').addEventListener('click', applyFilters);
    
    // フィルターリセットボタン
    document.getElementById('reset-filters').addEventListener('click', resetFilters);
    
    // ページネーションボタン
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
        const maxPage = Math.ceil(filteredData.length / rowsPerPage);
        if (currentPage < maxPage) {
            currentPage++;
            renderTable();
        }
    });
    
    // テーブルヘッダーのソート
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.getAttribute('data-sort');
            sortData(column);
        });
    });
    
    // チャートタブの切り替え
    document.querySelectorAll('.chart-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // アクティブクラスの制御
            document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const chartType = tab.getAttribute('data-chart-type');
            
            // チャートの表示/非表示を切り替え
            if (chartType === 'trend') {
                document.getElementById('dual-charts').classList.add('hidden');
                document.getElementById('trend-chart').classList.remove('hidden');
                updateTrendChart();
            } else {
                document.getElementById('dual-charts').classList.remove('hidden');
                document.getElementById('trend-chart').classList.add('hidden');
                updateDualCharts(chartType);
            }
        });
    });
    
    // テーマ切り替えボタン
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
}

// フィルターの適用
function applyFilters() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const category = document.getElementById('category').value;
    const status = document.getElementById('status').value;
    
    filteredData = salesData.filter(item => {
        // 検索語でのフィルタリング（製品名または地域）
        const searchMatch = 
            searchTerm === '' || 
            item.product.toLowerCase().includes(searchTerm) || 
            item.region.toLowerCase().includes(searchTerm);
        
        // 日付範囲でのフィルタリング
        const dateMatch = 
            (startDate === '' || item.date >= startDate) && 
            (endDate === '' || item.date <= endDate);
        
        // カテゴリーでのフィルタリング
        const categoryMatch = category === '' || item.category === category;
        
        // ステータスでのフィルタリング
        const statusMatch = status === '' || item.status === status;
        
        return searchMatch && dateMatch && categoryMatch && statusMatch;
    });
    
    // ページを1に戻す
    currentPage = 1;
    
    // データの更新表示
    updateSummary();
    renderTable();
    
    // 現在アクティブなチャートを更新
    const activeChartType = document.querySelector('.chart-tab.active').getAttribute('data-chart-type');
    if (activeChartType === 'trend') {
        updateTrendChart();
    } else {
        updateDualCharts(activeChartType);
    }
}

// フィルターのリセット
function resetFilters() {
    document.getElementById('search').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.getElementById('category').value = '';
    document.getElementById('status').value = '';
    
    filteredData = [...salesData];
    currentPage = 1;
    
    updateSummary();
    renderTable();
    
    // 現在アクティブなチャートを更新
    const activeChartType = document.querySelector('.chart-tab.active').getAttribute('data-chart-type');
    if (activeChartType === 'trend') {
        updateTrendChart();
    } else {
        updateDualCharts(activeChartType);
    }
}

// テーマの切り替え
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // ローカルストレージに保存
    localStorage.setItem('theme', newTheme);
    
    // チャートの再描画（テーマに合わせて色を変更）
    const activeChartType = document.querySelector('.chart-tab.active').getAttribute('data-chart-type');
    if (activeChartType === 'trend') {
        updateTrendChart();
    } else {
        updateDualCharts(activeChartType);
    }
}

// ストレージからテーマを復元
function restoreTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
}

// ページ読み込み時にテーマを復元
restoreTheme();
// テーブルの描画
function renderTable() {
    const tableBody = document.querySelector('#sales-table tbody');
    tableBody.innerHTML = '';
    
    // ページ計算
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pagedData = filteredData.slice(start, end);
    
    // データの表示
    if (pagedData.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.textContent = 'データが見つかりません';
        cell.colSpan = 8;
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        tableBody.appendChild(row);
    } else {
        pagedData.forEach(item => {
            const row = document.createElement('tr');
            
            // ステータスタグのクラス
            let statusClass = '';
            switch (item.status) {
                case '完了':
                    statusClass = 'status-completed';
                    break;
                case '保留中':
                    statusClass = 'status-pending';
                    break;
                case 'キャンセル':
                    statusClass = 'status-cancelled';
                    break;
                default:
                    statusClass = '';
            }
            
            // 各セルの作成
            row.innerHTML = `
                <td>order-${item.id}</td>
                <td>${formatDate(item.date)}</td>
                <td>${item.product}</td>
                <td>${item.category}</td>
                <td>${item.region}</td>
                <td>¥${item.amount.toLocaleString()}</td>
                <td>${item.quantity}</td>
                <td><span class="status-tag ${statusClass}">${item.status}</span></td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    // ページネーション情報の更新
    const maxPage = Math.ceil(filteredData.length / rowsPerPage) || 1;
    document.getElementById('page-info').textContent = `${currentPage} / ${maxPage}`;
    
    // ページネーションボタンの有効/無効設定
    document.getElementById('prev-page').disabled = currentPage <= 1;
    document.getElementById('next-page').disabled = currentPage >= maxPage;
}

// サマリーの更新
function updateSummary() {
    // 総売上
    const totalSales = filteredData.reduce((sum, item) => sum + item.amount, 0);
    document.getElementById('total-sales').textContent = `¥${totalSales.toLocaleString()}`;
    
    // 平均注文額
    const avgOrder = filteredData.length ? Math.round(totalSales / filteredData.length) : 0;
    document.getElementById('avg-order').textContent = `¥${avgOrder.toLocaleString()}`;
    
    // 総販売数
    const totalQuantity = filteredData.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('total-quantity').textContent = totalQuantity.toLocaleString();
    
    // 完了注文数
    const completedOrders = filteredData.filter(item => item.status === '完了').length;
    document.getElementById('completed-orders').textContent = completedOrders.toLocaleString();
}

// デュアルチャート（円グラフと棒グラフ）の更新
function updateDualCharts(dataType) {
    // 円グラフのコンテキスト
    const pieCtx = document.getElementById('pie-chart').getContext('2d');
    // 棒グラフのコンテキスト
    const barCtx = document.getElementById('bar-chart').getContext('2d');
    
    // 既存のチャートがあれば破棄
    if (pieChart) {
        pieChart.destroy();
    }
    if (barChart) {
        barChart.destroy();
    }
    
    let chartData;
    
    // データタイプに応じたデータの準備
    switch (dataType) {
        case 'category':
            chartData = prepareCategoryData();
            break;
        case 'region':
            chartData = prepareRegionData();
            break;
    }

    // テーマの取得
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDarkMode ? '#f1f1f1' : '#333333';
    
    // 円グラフの作成
    pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: chartData.labels,
            datasets: [{
                data: chartData.values,
                backgroundColor: chartData.colors,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: textColor
                    }
                },
                title: {
                    display: true,
                    text: dataType === 'category' ? 'カテゴリー別売上比率' : '地域別売上比率',
                    color: textColor
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ¥${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // 棒グラフの作成
    barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: '売上',
                data: chartData.values,
                backgroundColor: chartData.colors,
                borderColor: chartData.colors.map(color => color.replace('0.7', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: dataType === 'category' ? 'カテゴリー別売上額' : '地域別売上額',
                    color: textColor
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.raw || 0;
                            const total = chartData.values.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ¥${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '売上（円）',
                        color: textColor
                    },
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
}

// トレンドチャートの更新
function updateTrendChart() {
    const lineCtx = document.getElementById('line-chart').getContext('2d');
    
    // 既存のチャートがあれば破棄
    if (lineChart) {
        lineChart.destroy();
    }
    
    const trendData = prepareTrendData();
    
    // テーマの取得
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDarkMode ? '#f1f1f1' : '#333333';
    
    // 線グラフの作成
    lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: trendData.labels,
            datasets: [{
                label: '売上',
                data: trendData.values,
                fill: false,
                borderColor: '#0088FE', // メインカラーと統一（青）
                backgroundColor: 'rgba(0, 136, 254, 0.1)', // 薄い青で背景
                tension: 0.1,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: '日別売上トレンド',
                    font: {
                        size: 16
                    },
                    color: textColor
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '売上（円）',
                        color: textColor
                    },
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '日付',
                        color: textColor
                    },
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
}

// カテゴリー別データの準備
function prepareCategoryData() {
    // カテゴリーごとの合計を計算
    const categoryTotals = {};
    
    filteredData.forEach(item => {
        if (!categoryTotals[item.category]) {
            categoryTotals[item.category] = 0;
        }
        categoryTotals[item.category] += item.amount;
    });
    
    const labels = Object.keys(categoryTotals);
    const values = Object.values(categoryTotals);
    
    // 指定された固定の色
    const categoryColors = [
        '#0088FE', // 青
        '#8884D8', // 紫
        '#FF8042', // オレンジ
        '#FFBB28', // 黄色
        '#00C49F'  // ターコイズ
    ];
    
    // カテゴリーの数に合わせて色を割り当て（必要に応じて繰り返し使用）
    const colors = labels.map((_, index) => categoryColors[index % categoryColors.length]);
    
    return {
        labels: labels,
        values: values,
        colors: colors
    };
}

// 地域別データの準備
function prepareRegionData() {
    // 地域ごとの合計を計算
    const regionTotals = {};
    
    filteredData.forEach(item => {
        if (!regionTotals[item.region]) {
            regionTotals[item.region] = 0;
        }
        regionTotals[item.region] += item.amount;
    });
    
    const labels = Object.keys(regionTotals);
    const values = Object.values(regionTotals);
    
    // 地域用の固定色セット（カテゴリーとは少し異なる色味）
    const regionColors = [
        '#2196F3', // 青
        '#673AB7', // 紫
        '#FF5722', // オレンジ
        '#FFC107', // 黄色
        '#009688', // ティール
        '#E91E63', // ピンク
        '#3F51B5', // インディゴ
        '#4CAF50', // 緑
        '#9C27B0'  // 濃い紫
    ];
    
    // 地域の数に合わせて色を割り当て（必要に応じて繰り返し使用）
    const colors = labels.map((_, index) => regionColors[index % regionColors.length]);
    
    return {
        labels: labels,
        values: values,
        colors: colors
    };
}

// トレンドデータの準備（日別）
function prepareTrendData() {
    // 日付ごとの合計を計算
    const dateTotals = {};
    
    // 日付でソート
    const sortedData = [...filteredData].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sortedData.forEach(item => {
        if (!dateTotals[item.date]) {
            dateTotals[item.date] = 0;
        }
        dateTotals[item.date] += item.amount;
    });
    
    const dateLabels = Object.keys(dateTotals).sort();
    const values = dateLabels.map(date => dateTotals[date]);
    
    // フォーマットされた日付ラベル
    const formattedLabels = dateLabels.map(date => formatDate(date));
    
    return {
        labels: formattedLabels,
        values: values
    };
}

// データのソート
function sortData(column) {
    // 前回と同じカラムならソート方向を反転
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }
    
    // ソートアイコンの設定
    document.querySelectorAll('.sort-icon').forEach(icon => {
        icon.textContent = '';
    });
    
    const currentIcon = document.querySelector(`th[data-sort="${column}"] .sort-icon`);
    currentIcon.textContent = sortDirection === 'asc' ? '↑' : '↓';
    
    // データのソート
    filteredData.sort((a, b) => {
        let valueA = a[column];
        let valueB = b[column];
        
        // 数値の場合
        if (typeof valueA === 'number') {
            return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
        }
        
        // 日付の場合
        if (column === 'date') {
            return sortDirection === 'asc' 
                ? new Date(valueA) - new Date(valueB) 
                : new Date(valueB) - new Date(valueA);
        }
        
        // 文字列の場合
        valueA = String(valueA).toLowerCase();
        valueB = String(valueB).toLowerCase();
        
        if (valueA < valueB) {
            return sortDirection === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
            return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
    });
    
    // テーブルの再描画
    renderTable();
}

// 日付のフォーマット
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}
