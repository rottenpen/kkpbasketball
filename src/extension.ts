
import * as path from 'path';
import * as vscode from 'vscode';

const cats = {
	'Coding Cat': 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
	'Compiling Cat': 'https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif',
	'Testing Cat': 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif'
};

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('catCoding.start', () => {
			CatCodingPanel.createOrShow(context.extensionPath);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('catCoding.doRefactor', () => {
			if (CatCodingPanel.currentPanel) {
				CatCodingPanel.currentPanel.doRefactor();
			}
		})
	);

	if (vscode.window.registerWebviewPanelSerializer) {
		// Make sure we register a serializer in activation event
		vscode.window.registerWebviewPanelSerializer(CatCodingPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				console.log(`Got state: ${state}`);
				CatCodingPanel.revive(webviewPanel, context.extensionPath);
			}
		});
	}
}

/**
 * Manages cat coding webview panels
 */
class CatCodingPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: CatCodingPanel | undefined;

	public static readonly viewType = 'catCoding';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionPath: string) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (CatCodingPanel.currentPanel) {
			CatCodingPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			CatCodingPanel.viewType,
			'Cat Coding',
			column || vscode.ViewColumn.One,
			{
				// Enable javascript in the webview
				enableScripts: true,

				// And restrict the webview to only loading content from our extension's `media` directory.
				localResourceRoots: [vscode.Uri.file(path.join(extensionPath, 'media'))]
			}
		);

		CatCodingPanel.currentPanel = new CatCodingPanel(panel, extensionPath);
	}

	public static revive(panel: vscode.WebviewPanel, extensionPath: string) {
		CatCodingPanel.currentPanel = new CatCodingPanel(panel, extensionPath);
	}

	private constructor(panel: vscode.WebviewPanel, extensionPath: string) {
		this._panel = panel;
		this._extensionPath = extensionPath;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
				}
			},
			null,
			this._disposables
		);
	}

	public doRefactor() {
		// Send a message to the webview webview.
		// You can send any JSON serializable data.
		this._panel.webview.postMessage({ command: 'refactor' });
	}

	public dispose() {
		CatCodingPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _update() {
		const z = 1 + 2;
		// Vary the webview's content based on where it is located in the editor.
		switch (this._panel.viewColumn) {
			case vscode.ViewColumn.Two:
				this._updateForCat('Compiling Cat');
				return;

			case vscode.ViewColumn.Three:
				this._updateForCat('Testing Cat');
				return;

			case vscode.ViewColumn.One:
			default:
				this._updateForCat('Coding Cat');
				return;
		}
	}

	private _updateForCat(catName: keyof typeof cats) {
		this._panel.title = catName;
		this._panel.webview.html = this._getHtmlForWebview(cats[catName]);
	}

	private _getHtmlForWebview(catGif: string) {
		// Local path to main script run in the webview
		const scriptPathOnDisk = vscode.Uri.file(
			path.join(this._extensionPath, 'media', 'main.js')
		);

		// And the uri we use to load this script in the webview
		const scriptUri = scriptPathOnDisk.with({ scheme: 'vscode-resource' });

		// Use a nonce to whitelist which scripts can be run
		const nonce = getNonce();
		const html = `<!DOCTYPE html>
    <html lang="zh_CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=11">
        <meta name="description" content="这是一款 HTML5 开发的 CXK 打篮球小游戏，无聊的时候玩玩吧！">
        <meta name="keywords" content="CXK,打篮球,游戏,弹球,篮球,HTML5,开源,caixukun,CXK出来打球,你打篮球像CXK">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/css/bootstrap.min.css" crossorigin="anonymous">
        <link rel="stylesheet" href="http://tda-1254092492.file.myqcloud.com/style1.css?s=21">
        <title>CXK 打篮球 - CXK，出来打球！CXK游戏_你打游戏像CXK_篮球打CXK</title>
        <!--<link rel="stylesheet" href="css/common.css">-->
        <script src="https://apps.bdimg.com/libs/jquery/2.1.4/jquery.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/showdown/1.9.0/showdown.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/js/bootstrap.min.js" crossorigin="anonymous"></script>
      </head>
      <body>
        <div class="container">
          <div class="row">
            <div class="col-sm-12">
              <h2>CXK 打篮球</h2>
              <p>CXK，出来打球！</p>
              <hr>
              <center>
                <p>
                  <div class="input-group">
                    <span class="input-group-addon">难度</span>
                    <select class="form-control" id="ballspeedset">
                      <option value="2">简单难度（Speed 2）</option>
                      <option value="3" selected>普通难度（Speed 3）</option>
                      <option value="5">困难模式（Speed 5）</option>
                      <option value="7">极限模式（Speed 7）</option>
                      <option value="9">非人类（Speed 9）</option>
                    </select>
                    <div class="input-group-btn">
                      <button type="button" class="btn btn-danger" onclick="window.startGame()">开始游戏</button>
                      <button type="button" class="btn btn-warning" onclick="window.pauseGame()">暂停游戏</button>
                      <button type="button" class="btn btn-success" onclick="window.nextGame()">下个关卡</button>
                    </div>
                  </div>
                </p>
              </center>
              <center id="cdiv" style="width: 100%;">
                <p><canvas id="canvas" style="width: 100%;height: 563px;"></canvas></p>
              </center>
              <hr>
              <h3>游戏说明</h3>
              <p>使用方向键控制 CXK 左右移动，使用回车让 CXK 发球，按 P 暂停游戏，通关后按 N 进入下一关</p>
              <p>移动端可以点击屏幕左右控制 CXK 移动。</p>
              <p>如果出现显示不正常的情况请截图并通过 Issues 反馈。</p>
              <hr>
              <h3>更新记录</h3>
              <details>
                <summary style="cursor: pointer;">点击查看更新内容</summary>
                <div style="margin-top: 8px;">
                  <p>1.6：增加接球动作，修复球落地判定问题</p>
                  <p>1.5：增加更多的特效</p>
                  <p>1.4：增加难度设定功能</p>
                  <p>1.3：修复移动端操作问题</p>
                  <p>1.2：修复图片显示问题</p>
                  <p>1.1：将显示方式改为 background</p>
                  <p>1.0：CXK 打篮球发布</p>
                </div>
              </details>
              <hr>
              <p>Fork：<a href="https://github.com/kasuganosoras/cxk-ball" target="_blank">https://github.com/kasuganosoras/cxk-ball</a>（原作者：<a href="https://github.com/yangyunhe369" target="_blank">yangyunhe369</a>）</p>
              <p>Github开源地址：<a href="https://github.com/rottenpen/kkpbasketball" target="_blank">https://github.com/rottenpen/kkpbasketball</a></p>
              <p>喜欢的话欢迎点个 Star~</p>
            </div>
          </div>
        </div>
      </body>
      <!-- 图片预缓存 -->
      <img src="http://tda-1254092492.file.myqcloud.com/ball.png" style="width: 0px;height: 0px;" />
      <img src="http://tda-1254092492.file.myqcloud.com/ballshadow.png" style="width: 0px;height: 0px;" />
      <img src="http://tda-1254092492.file.myqcloud.com/paddle_1.png" style="width: 0px;height: 0px;" />
      <img src="http://tda-1254092492.file.myqcloud.com/paddle_2.png" style="width: 0px;height: 0px;" />
      <img src="http://tda-1254092492.file.myqcloud.com/paddle2_1.png" style="width: 0px;height: 0px;" />
      <img src="http://tda-1254092492.file.myqcloud.com/paddle2_2.png" style="width: 0px;height: 0px;" />
      <img src="http://tda-1254092492.file.myqcloud.com/paddle3_1.png" style="width: 0px;height: 0px;" />
      <img src="http://tda-1254092492.file.myqcloud.com/paddle3_2.png" style="width: 0px;height: 0px;" />
      <img src="http://tda-1254092492.file.myqcloud.com/paddle4_1.png" style="width: 0px;height: 0px;" />
      <img src="http://tda-1254092492.file.myqcloud.com/paddle4_2.png" style="width: 0px;height: 0px;" />
      <!-- 背景音乐（已删除） -->
      <!-- <audio src="" style="width: 0px;height: 0px;border: 0px;" id="audio" loop="-1"></audio> -->
      <script src="http://tda-1254092492.file.myqcloud.com/common1.js?s=2"></script>
      <script src="http://tda-1254092492.file.myqcloud.com/scene.js"></script>
      <script src="http://tda-1254092492.file.myqcloud.com/skills.js"></script>
      <script src="http://tda-1254092492.file.myqcloud.com/game.js"></script>
      <script src="http://tda-1254092492.file.myqcloud.com/main.js"></script>
      <script>
        var clientWidth = document.body.clientWidth;
        var cxk_body = 1;
				var move_way = 1;
				// var cdiv = document.getElementById('cdiv')
        canvas.width = canvas.clientWidth;
        canvas.style.width = canvas.clientWidth + "px";
        cdiv.style.width = cdiv.clientWidth + "px";
        canvas.height = canvas.clientWidth / 1000 * 563;
        canvas.style.height = canvas.clientWidth / 1000 * 563 + "px";
        cdiv.style.height = cdiv.clientWidth / 1000 * 563 + "px";
        if(canvas.width < 936) {
          canvas.width = 936;
          canvas.height = 936 / 1000 * 563;
          canvas.setAttribute("style", "");
          canvas.style.zoom = (cdiv.clientWidth / 936);
        } else {
    
        }
        window.startGame = function() {
          // $("#audio").attr("src", "media/jntm.m4a");
          // audio.play();
          window.cacheBallSpeed = parseInt($("#ballspeedset").val());
          $("#ballspeedset").attr("disabled", "disabled");
          _main.start();
          setInterval(function() {
            if(cxk_body == 1) {
              _main.paddle.image.src = "http://tda-1254092492.file.myqcloud.com/paddle2_" + move_way + ".png";
              cxk_body = 2;
            } else if(cxk_body == 2) {
              _main.paddle.image.src = "http://tda-1254092492.file.myqcloud.com/paddle3_" + move_way + ".png";
              cxk_body = 3;
            }else if(cxk_body == 4){
              _main.paddle.image.src = "http://tda-1254092492.file.myqcloud.com/paddle4_" + move_way + ".png";
              cxk_body = 3;
            } else {
              _main.paddle.image.src = "http://tda-1254092492.file.myqcloud.com/paddle_" + move_way + ".png";
              cxk_body = 1;
            }
          }, 150);
    
          setInterval(function() {
            _main.ballshadow.y = 545;
            _main.ballshadow.x = _main.ball.x;
          }, 10);
        }
      </script>
    </html>`;
		return html
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
