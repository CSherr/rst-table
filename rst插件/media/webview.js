(function() {
    const vscode = acquireVsCodeApi();
    let currentData = {};
    let currentRows = 3;
    let currentCols = 3;
    
    // 初始化
    document.addEventListener('DOMContentLoaded', function() {
        initializeEventListeners();
        updateTable();
    });
    
    function initializeEventListeners() {
        document.getElementById('update-table').addEventListener('click', updateTable);
        document.getElementById('insert-btn').addEventListener('click', insertTable);
        document.getElementById('copy-btn').addEventListener('click', copyToClipboard);
        document.getElementById('clear-btn').addEventListener('click', clearAllData);
        document.getElementById('import-btn').addEventListener('click', importFromTextarea);
        document.getElementById('clear-import-btn').addEventListener('click', clearImportTextarea);
        
        document.getElementById('rows').addEventListener('input', checkForDataLoss);
        document.getElementById('cols').addEventListener('input', checkForDataLoss);
    }
    
    // 从文本区域导入表格
    function importFromTextarea() {
        const textarea = document.getElementById('import-textarea');
        const rstText = textarea.value.trim();
        
        if (!rstText) {
            showMessage('Please paste RST table content first', 'warning');
            return;
        }
        
        console.log('Importing RST text:', rstText);
        const tableData = parseRstTable(rstText);
        if (tableData) {
            console.log('Parsed table data:', tableData);
            handleImportedData(tableData);
            showMessage('Table imported successfully!', 'success');
            textarea.value = ''; // 清空文本区域
        } else {
            showMessage('Failed to parse RST table. Please check the format.', 'warning');
        }
    }
    
    // 清空导入文本区域
    function clearImportTextarea() {
        document.getElementById('import-textarea').value = '';
    }
    
    // 显示消息
    function showMessage(message, type) {
        // 移除现有的消息
        const existingMessage = document.querySelector('.import-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = `import-message ${type}`;
        messageElement.textContent = message;
        messageElement.style.marginTop = '10px';
        
        const importSection = document.querySelector('.import-section');
        importSection.appendChild(messageElement);
        
        // 3秒后自动消失
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 3000);
    }
    
    // 解析RST表格
    function parseRstTable(rstText) {
        try {
            const lines = rstText.split('\n').filter(line => line.trim());
            console.log('All lines:', lines);
            
            if (lines.length < 3) {
                showMessage('Table too short. Need at least 3 lines.', 'warning');
                return null;
            }
            
            // 识别内容行（包含 | 的行）
            const contentLines = lines.filter(line => line.includes('|'));
            console.log('Content lines:', contentLines);
            
            if (contentLines.length === 0) {
                showMessage('No table content found. Lines should contain | character', 'warning');
                return null;
            }
            
            // 解析列数（从第一个内容行）
            const firstContentLine = contentLines[0];
            console.log('First content line:', firstContentLine);
            
            // 分割单元格，过滤空值
            const columns = firstContentLine.split('|')
                .map(cell => cell.trim())
                .filter(cell => cell !== '');
            
            const numCols = columns.length;
            console.log('Columns found:', columns, 'Number of columns:', numCols);
            
            if (numCols === 0) {
                showMessage('No columns found in table', 'warning');
                return null;
            }
            
            // 解析数据
            const tableData = {};
            let rowIndex = 0;
            
            contentLines.forEach((line, index) => {
                console.log(`Processing line ${index}:`, line);
                
                const cells = line.split('|')
                    .map(cell => cell.trim())
                    .filter(cell => cell !== '');
                
                console.log(`Cells in line ${index}:`, cells);
                
                if (cells.length === numCols) {
                    for (let colIndex = 0; colIndex < numCols; colIndex++) {
                        const cellContent = cells[colIndex];
                        const key = `${rowIndex}-${colIndex}`;
                        tableData[key] = cellContent;
                        console.log(`Set cell [${rowIndex},${colIndex}] to:`, cellContent);
                    }
                    rowIndex++;
                } else if (cells.length > 0) {
                    console.warn(`Line ${index} has ${cells.length} cells, expected ${numCols}. Skipping.`);
                }
            });
            
            const numRows = rowIndex;
            
            console.log('Final parsed data:', {
                rows: numRows,
                cols: numCols,
                data: tableData
            });
            
            if (numRows === 0) {
                showMessage('No valid data rows found in table', 'warning');
                return null;
            }
            
            return {
                rows: numRows,
                cols: numCols,
                data: tableData
            };
            
        } catch (error) {
            console.error('Error parsing RST table:', error);
            showMessage('Error parsing table: ' + error.message, 'warning');
            return null;
        }
    }
    
    // 处理导入的数据 - 修复版本
    function handleImportedData(tableData) {
        console.log('Handling imported data:', tableData);
        
        // 直接设置数据，不调用 collectCurrentData()
        currentData = tableData.data || {};
        currentRows = tableData.rows || 3;
        currentCols = tableData.cols || 3;
        
        console.log('Setting current data:', currentData);
        console.log('Setting rows:', currentRows, 'cols:', currentCols);
        
        // 更新UI - 直接调用渲染，不收集当前数据
        document.getElementById('rows').value = currentRows;
        document.getElementById('cols').value = currentCols;
        renderTable(); // 使用新的渲染函数
        
        // 显示成功消息
        showMessage(`Imported ${currentRows}×${currentCols} table successfully!`, 'success');
    }
    
    // 新的渲染表格函数 - 不收集当前数据
    function renderTable() {
        console.log('Rendering table with data:', currentData);
        
        const newRows = parseInt(document.getElementById('rows').value) || 3;
        const newCols = parseInt(document.getElementById('cols').value) || 3;
        
        currentRows = newRows;
        currentCols = newCols;
        
        const container = document.getElementById('table-container');
        let tableHTML = '<table><thead><tr>';
        
        // 表头
        for (let c = 0; c < newCols; c++) {
            const value = getCellData(0, c);
            tableHTML += `<th><input type="text" class="cell-input" data-row="0" data-col="${c}" value="${value}" placeholder="Header ${c+1}"></th>`;
        }
        tableHTML += '</tr></thead><tbody>';
        
        // 表格主体
        for (let r = 1; r < newRows; r++) {
            tableHTML += '<tr>';
            for (let c = 0; c < newCols; c++) {
                const value = getCellData(r, c);
                tableHTML += `<td><input type="text" class="cell-input" data-row="${r}" data-col="${c}" value="${value}" placeholder="Cell ${r+1}-${c+1}"></td>`;
            }
            tableHTML += '</tr>';
        }
        tableHTML += '</tbody></table>';
        
        container.innerHTML = tableHTML;
        
        document.getElementById('data-warning').style.display = 'none';
        
        // 添加输入事件监听器
        document.querySelectorAll('.cell-input').forEach(input => {
            input.addEventListener('input', function() {
                // 只在用户输入时收集数据
                const row = parseInt(this.dataset.row);
                const col = parseInt(this.dataset.col);
                const key = `${row}-${col}`;
                currentData[key] = this.value;
                updatePreview();
            });
        });
        
        updatePreview();
    }
    
    // 检查是否会丢失数据
    function checkForDataLoss() {
        const newRows = parseInt(document.getElementById('rows').value) || 3;
        const newCols = parseInt(document.getElementById('cols').value) || 3;
        const warningElement = document.getElementById('data-warning');
        
        if ((newRows < currentRows || newCols < currentCols) && Object.keys(currentData).length > 0) {
            warningElement.style.display = 'block';
        } else {
            warningElement.style.display = 'none';
        }
    }
    
    // 收集当前表格数据 - 只在需要时调用
    function collectCurrentData() {
        const inputs = document.querySelectorAll('.cell-input');
        inputs.forEach(input => {
            const row = parseInt(input.dataset.row);
            const col = parseInt(input.dataset.col);
            const key = `${row}-${col}`;
            if (input.value.trim() !== '') {
                currentData[key] = input.value;
            } else {
                delete currentData[key];
            }
        });
    }
    
    // 获取单元格数据
    function getCellData(row, col) {
        const key = `${row}-${col}`;
        const value = currentData[key] || '';
        console.log(`Getting cell [${row},${col}]:`, value);
        return value;
    }
    
    // 更新表格 - 修改为使用 renderTable
    function updateTable() {
        console.log('Updating table with data:', currentData);
        
        // 只有在不是导入操作时才收集数据
        collectCurrentData();
        renderTable();
    }
    
    // 更新预览
    function updatePreview() {
        const tableData = [];
        const inputs = document.querySelectorAll('.cell-input');
        
        inputs.forEach(input => {
            const row = parseInt(input.dataset.row);
            const col = parseInt(input.dataset.col);
            
            if (!tableData[row]) tableData[row] = [];
            tableData[row][col] = input.value || '';
        });
        
        const rstTable = generateRstTable(tableData);
        document.getElementById('preview').textContent = rstTable;
    }
    
    // 生成RST表格
    function generateRstTable(data) {
        if (!data || data.length === 0) return '';
        
        const rows = data.length;
        const cols = data[0].length;
        
        const colWidths = [];
        for (let c = 0; c < cols; c++) {
            let maxWidth = 0;
            for (let r = 0; r < rows; r++) {
                if (data[r] && data[r][c]) {
                    const length = getDisplayWidth(data[r][c]);
                    maxWidth = Math.max(maxWidth, length);
                }
            }
            colWidths[c] = Math.max(maxWidth, 3);
        }
        
        let rst = '';
        rst += generateBorder(colWidths, 'top') + '\n';
        
        for (let r = 0; r < rows; r++) {
            rst += '|';
            for (let c = 0; c < cols; c++) {
                const cell = data[r] && data[r][c] ? data[r][c] : '';
                const width = colWidths[c];
                const padding = width - getDisplayWidth(cell);
                rst += ' ' + cell + ' '.repeat(padding) + ' |';
            }
            rst += '\n';
            
            if (r === 0) {
                rst += generateBorder(colWidths, 'header') + '\n';
            } else if (r < rows - 1) {
                rst += generateBorder(colWidths, 'middle') + '\n';
            }
        }
        
        rst += generateBorder(colWidths, 'bottom');
        return rst;
    }
    
    // 生成表格边框
    function generateBorder(colWidths, type) {
        let border = '';
        if (type === 'top' || type === 'bottom') {
            border = '+';
            colWidths.forEach(width => {
                border += '-'.repeat(width + 2) + '+';
            });
        } else if (type === 'header') {
            border = '+';
            colWidths.forEach(width => {
                border += '='.repeat(width + 2) + '+';
            });
        } else if (type === 'middle') {
            border = '+';
            colWidths.forEach(width => {
                border += '-'.repeat(width + 2) + '+';
            });
        }
        return border;
    }
    
    // 计算显示宽度
    function getDisplayWidth(str) {
        let width = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charAt(i);
            const code = char.charCodeAt(0);
            
            if (
                (code >= 0x3000 && code <= 0x303F) ||
                (code >= 0x4E00 && code <= 0x9FFF) ||
                (code >= 0xFF00 && code <= 0xFFEF)
            ) {
                width += 2;
            } else {
                width += 1;
            }
        }
        return width;
    }
    
    // 插入表格到编辑器
    function insertTable() {
        const rstTable = document.getElementById('preview').textContent;
        vscode.postMessage({
            command: 'insertTable',
            text: rstTable
        });
    }
    
    // 复制到剪贴板
    function copyToClipboard() {
        const rstTable = document.getElementById('preview').textContent;
        navigator.clipboard.writeText(rstTable).then(() => {
            vscode.postMessage({
                command: 'alert',
                text: 'RST table copied to clipboard!'
            });
        });
    }
    
    // 清除所有数据
    function clearAllData() {
        if (confirm('Are you sure you want to clear all data?')) {
            currentData = {};
            updateTable();
        }
    }
})();