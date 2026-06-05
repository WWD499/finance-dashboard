<h1>📊 沪深两市金融数据分析系统</h1>
<p>基于 Flask + ECharts + MySQL 的金融数据分析系统，支持沪深指数行情分析与两融（融资融券）深度分析。</p>

<h2>🗂 项目结构</h2>
<pre>
金融分析系统/
├── finance-dashboard/
│   ├── app.py               # Flask 后端 API
│   ├── import_data.py       # CSV → MySQL 数据导入脚本
│   ├── requirements.txt      # Python 依赖
│   ├── start.bat            # Windows 一键启动脚本
│   ├── .env                 # 数据库配置（不提交）
│   ├── data/                # CSV 数据文件
│   │   ├── sh_index.csv     # 上证综指
│   │   ├── sz_index.csv     # 深证成指
│   │   ├── sh_margin_trade.csv  # 沪市两融
│   │   └── sz_margin_trade.csv  # 深市两融
│   └── static/
│       └── index.html       # 前端单页应用
└── README.md
</pre>

<h2>🛠 环境要求</h2>
<ul>
<li><b>Python</b> >= 3.10</li>
<li><b>MySQL</b> >= 8.0（需提前建库）</li>
<li><b>Node.js</b>（可选，用于静态资源开发）</li>
</ul>

<h2>🚀 快速启动</h2>

<h3>① 安装 Python 依赖</h3>
<pre>
cd "D:\st\金融分析系统\finance-dashboard"
pip install -r requirements.txt
</pre>

<h3>② 配置数据库连接</h3>
<p>创建 <code>.env</code> 文件（已加入 <code>.gitignore</code>，不会泄露密码）：</p>
<pre>
DB_HOST=localhost
DB_USER=root
DB_PASS=你的密码
DB_NAME=finance_db
</pre>

<h3>③ 导入数据到 MySQL</h3>
<pre>
# 先确保 MySQL 中已创建 finance_db 数据库
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < schema.sql

# 运行导入脚本
python import_data.py
</pre>

<h3>④ 启动系统</h3>
<pre>
# 方式一：直接运行
python app.py

# 方式二：使用启动脚本（Windows）
double-click start.bat
</pre>
<p>启动后访问：<a href="http://127.0.0.1:5000">http://127.0.0.1:5000</a></p>

<h2>📡 API 接口清单</h2>
<table>
<tr><th>接口</th><th>方法</th><th>说明</th></tr>
<tr><td><code>/api/overview</code></td><td>GET</td><td>总览统计（最新点位、极值、两融余额等）</td></tr>
<tr><td><code>/api/index?market=sh|sz|both</code></td><td>GET</td><td>指数行情数据（K线/收盘价）</td></tr>
<tr><td><code>/api/margin?market=sh|sz|both</code></td><td>GET</td><td>两融余额数据</td></tr>
<tr><td><code>/api/margin/monthly</code></td><td>GET</td><td>两融月度聚合数据</td></tr>
<tr><td><code>/api/margin/flow</code></td><td>GET</td><td>融资买入 vs 偿还 vs 融券卖出</td></tr>
<tr><td><code>/api/margin/ratio</code></td><td>GET</td><td>沪深两融余额占比趋势</td></tr>
<tr><td><code>/api/index/annual</code></td><td>GET</td><td>年度涨跌幅统计</td></tr>
<tr><td><code>/api/correlation</code></td><td>GET</td><td>指数与两融相关性分析（含滚动相关系数）</td></tr>
</table>

<h2>📈 前端功能页面</h2>
<ul>
<li><b>总览</b>：四大核心指标卡 + 指数归一化走势 + 两融余额堆叠柱状图 + 占比饼图</li>
<li><b>指数行情</b>：收盘价面积/折线图 + DataZoom 缩放 + 成交量/成交金额</li>
<li><b>两融分析</b>：融资余额趋势 + 融资买卖流量 + 融券卖出 + 月度热力图</li>
<li><b>相关性</b>：Pearson 相关系数卡片 + 30日滚动相关系数 + 散点图</li>
<li><b>年度统计</b>：年度涨跌幅柱状图（红涨绿跌）+ 年度数据表</li>
</ul>

<h2>🗄 数据库结构</h2>
<p>数据库名：<code>finance_db</code></p>
<table>
<tr><th>表名</th><th>字段</th><th>说明</th></tr>
<tr><td><code>sh_index</code></td><td>trade_date, close, open, high, low, vol, amount</td><td>上证综指日行情</td></tr>
<tr><td><code>sz_index</code></td><td>trade_date, close, open, high, low, vol, amount</td><td>深证成指日行情</td></tr>
<tr><td><code>sh_margin_trade</code></td><td>trade_date, financing_balance, financing_purchase, financing_redeem, securities_lending_balance, securities_lending_sell, securities_lending_shares, margin_balance</td><td>沪市两融日数据</td></tr>
<tr><td><code>sz_margin_trade</code></td><td>同左</td><td>深市两融日数据</td></tr>
</table>

<h2>📦 技术栈</h2>
<ul>
<li><b>后端</b>：Python 3.13 + Flask 3.x + pandas + PyMySQL</li>
<li><b>数据库</b>：MySQL 8.0</li>
<li><b>前端</b>：原生 HTML/CSS/JS + ECharts 5.4</li>
<li><b>数据源</b>：沪深交易所公开数据（CSV）</li>
</ul>

<h2>📄 数据说明</h2>
<ul>
<li>数据时间范围：1990-12-19（上证）~ 2022-06-17</li>
<li>两融数据起始：2010-03-31</li>
<li>金额单位：CSV 原始单位为 <b>元</b>，系统显示单位为 <b>亿元</b></li>
</ul>

<h2>👤 作者</h2>
<p>数据科学专业 · 期末项目 · 2026 届</p>
