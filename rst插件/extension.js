const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

let globalContext = null;

function activate(context) {
    globalContext = context;

    let disposable = vscode.commands.registerCommand('rstTableEditor.createTable', function () {
        createTableEditor();
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

function createTableEditor(initialData = null) {
    const panel = vscode.window.createWebviewPanel(
        'rstTableEditor',
        'RST Table Editor',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(globalContext.extensionPath, 'media'))
            ]
        }
    );

    // 设置HTML内容
    panel.webview.html = getWebviewContent(panel, initialData);

    // 处理来自webview的消息
    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'insertTable':
                    insertRstTable(message.text);
                    return;
                case 'alert':
                    vscode.window.showInformationMessage(message.text);
                    return;
                case 'importData':
                    // 处理从webview发送的导入数据
                    handleImportedData(panel, message.data);
                    return;
            }
        },
        undefined,
        globalContext.subscriptions
    );
}

function getWebviewContent(panel, initialData = null) {
    // 获取资源文件的URI
    const cssPath = vscode.Uri.file(path.join(globalContext.extensionPath, 'media', 'webview.css'));
    const jsPath = vscode.Uri.file(path.join(globalContext.extensionPath, 'media', 'webview.js'));
    const htmlPath = vscode.Uri.file(path.join(globalContext.extensionPath, 'media', 'webview.html'));
    
    const cssUri = panel.webview.asWebviewUri(cssPath);
    const jsUri = panel.webview.asWebviewUri(jsPath);

    // 读取HTML模板文件
    let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');
    
    // 替换资源路径
    htmlContent = htmlContent.replace('{{CSS_URI}}', cssUri.toString());
    htmlContent = htmlContent.replace('{{JS_URI}}', jsUri.toString());
    
    return htmlContent;
}

// 处理从webview发送的导入数据
function handleImportedData(panel, importedData) {
    // 重新加载webview并传递导入的数据
    panel.webview.html = getWebviewContent(panel, importedData);
}

function insertRstTable(tableText) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        editor.edit(editBuilder => {
            const position = editor.selection.active;
            editBuilder.insert(position, tableText);
        });
    } else {
        vscode.window.showErrorMessage('No active editor found!');
    }
}

module.exports = {
    activate,
    deactivate
};