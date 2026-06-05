const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, LevelFormat, PageBreak
} = require('./node_modules/docx');
const fs = require('fs');

// ─── 颜色配置 ────────────────────────────────────────────────────────────────
const COLOR = {
  primary:   '1A56B0',  // 深蓝主色
  accent:    '2E86C1',  // 次色
  light:     'D6EAF8',  // 浅蓝填充
  lightGray: 'F2F3F4',  // 浅灰填充
  darkGray:  '2C3E50',  // 深灰文字
  border:    'AED6F1',  // 表格边框
  green:     '1E8449',  // 绿色
  red:       'C0392B',  // 红色
  gold:      'B7950B',  // 金色
  white:     'FFFFFF',
};

// ─── 工具函数 ─────────────────────────────────────────────────────────────────
const border = (color = COLOR.border) => ({ style: BorderStyle.SINGLE, size: 8, color });
const borders = (color) => ({ top: border(color), bottom: border(color), left: border(color), right: border(color) });
const cellMargins = { top: 100, bottom: 100, left: 150, right: 150 };

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: COLOR.primary, space: 4 } },
    children: [new TextRun({ text, font: 'Arial', size: 32, bold: true, color: COLOR.primary })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, font: 'Arial', size: 26, bold: true, color: COLOR.accent })],
  });
}

function heading3(text) {
  return new Paragraph({
    spacing: { before: 180, after: 80 },
    children: [new TextRun({ text, font: 'Arial', size: 22, bold: true, color: COLOR.darkGray })],
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60, line: 340 },
    children: [new TextRun({ text, font: 'Arial', size: opts.size || 22, color: opts.color || COLOR.darkGray, bold: opts.bold || false })],
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, font: 'Arial', size: 21, color: COLOR.darkGray })],
  });
}

function blankLine() {
  return new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun('')] });
}

function makeTable(headers, rows, colWidths) {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const hRow = new TableRow({
    children: headers.map((h, i) => new TableCell({
      borders: borders(COLOR.primary),
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: COLOR.primary, type: ShadingType.CLEAR },
      margins: cellMargins,
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: h, font: 'Arial', size: 20, bold: true, color: COLOR.white })],
      })],
    })),
  });

  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => new TableCell({
      borders: borders(COLOR.border),
      width: { size: colWidths[ci], type: WidthType.DXA },
      shading: { fill: ri % 2 === 0 ? COLOR.white : COLOR.lightGray, type: ShadingType.CLEAR },
      margins: cellMargins,
      children: [new Paragraph({
        alignment: ci === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
        children: [new TextRun({ text: String(cell), font: 'Arial', size: 20, color: COLOR.darkGray })],
      })],
    })),
  }));

  return new Table({ width: { size: totalW, type: WidthType.DXA }, columnWidths: colWidths, rows: [hRow, ...dataRows] });
}

// ─── 封面章节 ─────────────────────────────────────────────────────────────────
function makeCoverSection() {
  return [
    new Paragraph({ spacing: { before: 1800 }, children: [new TextRun('')] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [new TextRun({ text: '沪深两市金融数据分析系统', font: 'Arial', size: 56, bold: true, color: COLOR.primary })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 400 },
      children: [new TextRun({ text: 'Financial Data Analysis System', font: 'Arial', size: 28, color: '7F8C8D', italics: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { bottom: { style: BorderStyle.SINGLE, size: 16, color: COLOR.primary, space: 6 } },
      spacing: { before: 0, after: 400 },
      children: [new TextRun('')],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 80 },
      children: [new TextRun({ text: '项目报告', font: 'Arial', size: 34, bold: true, color: COLOR.accent })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 100 },
      children: [new TextRun({ text: 'Project Report', font: 'Arial', size: 24, color: '7F8C8D', italics: true })],
    }),
    blankLine(), blankLine(), blankLine(), blankLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 30 },
      children: [new TextRun({ text: '报告日期：2026 年 4 月 26 日', font: 'Arial', size: 22, color: COLOR.darkGray })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '数据截止：2022 年 6 月 17 日', font: 'Arial', size: 22, color: COLOR.darkGray })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ─── 正文内容 ─────────────────────────────────────────────────────────────────
function makeBody() {
  return [
    // ── 一、项目概况 ──────────────────────────────────────────────────────
    heading1('一、项目概况'),

    heading2('1.1 项目背景'),
    para('本项目基于沪深两市指数行情数据与融资融券（两融）交易数据，构建一套全栈金融数据可视化分析系统。系统旨在帮助用户直观地了解沪深市场长期走势、两融资金流向，以及指数与两融之间的关联关系，为投资决策和市场研究提供数据支撑。'),
    blankLine(),

    heading2('1.2 数据来源'),
    para('本系统共使用四个原始 CSV 数据文件，具体如下：'),
    blankLine(),

    makeTable(
      ['文件名', '内容', '时间跨度', '数据条数'],
      [
        ['sh_index.csv', '上证综合指数日线行情', '1990-12-19 ~ 2022-06-17', '7,694 条'],
        ['sz_index.csv', '深证成份指数日线行情', '1991-04-03 ~ 2022-06-17', '7,603 条'],
        ['sh_margin_trade.csv', '沪市融资融券交易数据', '2010-03-31 ~ 2022-06-17', '2,968 条'],
        ['sz_margin_trade.csv', '深市融资融券交易数据', '2010-03-31 ~ 2022-06-16', '2,967 条'],
      ],
      [2800, 3000, 2400, 1760]
    ),
    blankLine(),

    heading2('1.3 字段说明'),
    para('【指数数据字段】', { bold: true }),
    blankLine(),
    makeTable(
      ['字段名', '中文含义', '单位'],
      [
        ['date', '交易日期', 'YYYYMMDD'],
        ['close', '收盘价', '点'],
        ['open', '开盘价', '点'],
        ['high', '最高价', '点'],
        ['low', '最低价', '点'],
        ['vol', '成交量', '手'],
        ['amount', '成交金额', '万元'],
      ],
      [2500, 3500, 3960]
    ),
    blankLine(),
    para('【两融数据字段】', { bold: true }),
    blankLine(),
    makeTable(
      ['字段名', '中文含义', '单位（系统内）'],
      [
        ['financing_balance', '融资余额', '亿元'],
        ['financing_purchase', '融资买入额', '亿元'],
        ['financing_redeem', '融资偿还额', '亿元'],
        ['securities_lending_balance', '融券余额', '亿元'],
        ['securities_lending_sell', '融券卖出额', '亿元'],
        ['securities_lending_shares', '融券余量', '股'],
        ['margin_balance', '两融合计余额', '亿元'],
      ],
      [3000, 3000, 3960]
    ),
    blankLine(),

    new Paragraph({ children: [new PageBreak()] }),

    // ── 二、系统架构 ──────────────────────────────────────────────────────
    heading1('二、系统架构'),

    heading2('2.1 技术栈'),
    makeTable(
      ['层次', '技术选型', '说明'],
      [
        ['后端框架', 'Python Flask 2.x', '轻量 RESTful API 服务'],
        ['数据处理', 'Pandas + NumPy', 'CSV 读取、聚合、相关性计算'],
        ['跨域支持', 'Flask-CORS', '允许前端跨域调用 API'],
        ['前端框架', 'HTML5 + 原生 JS', '无依赖单页应用（SPA）'],
        ['可视化库', 'ECharts 5.4.3', '折线、柱状、饼图、散点、热力图'],
        ['运行环境', 'Python 3.x + Node.js', '后端 Python，前端构建工具 Node'],
      ],
      [2000, 3000, 4960]
    ),
    blankLine(),

    heading2('2.2 项目目录结构'),
    blankLine(),
    makeTable(
      ['路径', '文件/文件夹', '说明'],
      [
        ['finance-dashboard/', 'app.py', 'Flask 后端主程序，数据加载 & API 路由'],
        ['finance-dashboard/', 'package.json', 'Node 依赖配置（用于生成报告文档）'],
        ['finance-dashboard/static/', 'index.html', '前端单页应用，含全部可视化逻辑'],
        ['finance-dashboard/node_modules/', '—', 'Node 依赖包（docx 等）'],
      ],
      [3200, 2800, 3960]
    ),
    blankLine(),

    heading2('2.3 API 接口清单'),
    para('后端共提供 8 个 RESTful API 接口，均支持日期过滤参数（start / end）：'),
    blankLine(),
    makeTable(
      ['接口路径', '方法', '功能描述', '关键参数'],
      [
        ['/api/overview', 'GET', '四表核心概览统计', '—'],
        ['/api/index', 'GET', '指数行情（收盘/开高低/成交量）', 'market, start, end, limit'],
        ['/api/margin', 'GET', '两融余额及明细', 'market, start, end, limit'],
        ['/api/margin/monthly', 'GET', '两融余额月度聚合', 'start, end'],
        ['/api/margin/flow', 'GET', '融资买入 vs 偿还 vs 融券卖出', 'start, end, limit'],
        ['/api/margin/ratio', 'GET', '沪深两融余额占比趋势', 'start, end, limit'],
        ['/api/index/annual', 'GET', '指数年度涨跌幅统计', '—'],
        ['/api/correlation', 'GET', '相关系数 + 30日滚动相关', 'start, end'],
      ],
      [2400, 900, 3000, 2660]
    ),
    blankLine(),

    new Paragraph({ children: [new PageBreak()] }),

    // ── 三、功能模块 ──────────────────────────────────────────────────────
    heading1('三、功能模块详述'),

    heading2('3.1 总览页面（Overview）'),
    para('总览页面集中展示系统最核心的四项关键指标与趋势图，方便用户快速掌握市场全貌。'),
    blankLine(),
    makeTable(
      ['组件', '内容'],
      [
        ['核心指标卡 × 4', '上证综指最新点位 / 深证成指最新点位 / 沪市两融余额 / 深市两融余额（均含历史峰值）'],
        ['沪深指数走势对比', '2015 年至今归一化折线图，上证 vs 深证同框对比'],
        ['两融月度余额柱状图', '沪深融资余额叠加柱状图，清晰呈现规模走势'],
        ['两融市场占比饼图', '展示最新时点沪市 vs 深市两融余额份额'],
        ['两融占比趋势线图', '历史占比变化，展现市场结构演变'],
      ],
      [2400, 7560]
    ),
    blankLine(),

    heading2('3.2 指数行情页面（Index）'),
    para('提供完整的指数行情浏览与分析功能，支持多维度交互。'),
    blankLine(),
    bullet('支持上证综指 / 深证成指 / 沪深对比三种视图切换'),
    bullet('时间范围快捷筛选（全部 / 近5年 / 近3年 / 近1年）'),
    bullet('折线图 / 面积图显示模式切换'),
    bullet('DataZoom 拖拽缩放，支持鼠标滚轮与拖拽'),
    bullet('独立的成交量柱状图和成交金额趋势图'),
    blankLine(),

    heading2('3.3 两融分析页面（Margin）'),
    para('深入展示融资融券数据各维度，帮助用户理解杠杆资金变化规律。'),
    blankLine(),
    bullet('融资余额月度趋势（面积图，沪深双线）'),
    bullet('融资买入额 vs 融资偿还额流量对比（单日流量分析）'),
    bullet('融券卖出量柱状图（沪深双色对比）'),
    bullet('年月热力图：以颜色深浅直观展示各月两融余额规模'),
    blankLine(),

    heading2('3.4 相关性分析页面（Correlation）'),
    para('量化指数行情与两融余额的线性相关关系，是本系统的核心分析模块。'),
    blankLine(),
    bullet('Pearson 相关系数卡片：展示指数 × 两融余额、指数 × 融资余额四组相关系数'),
    bullet('相关强度自动判定：|r| ≥ 0.7 强相关（红）/ 0.4~0.7 中等相关（橙）/ < 0.4 弱相关（绿）'),
    bullet('30 日滚动相关系数折线图：揭示相关关系的时间演变，含 ±0.7 参考线'),
    bullet('散点图：可视化指数点位与两融余额的分布形态'),
    blankLine(),

    heading2('3.5 年度统计页面（Annual）'),
    para('从年度视角汇总指数涨跌情况，便于长期规律研究。'),
    blankLine(),
    bullet('上证综指 / 深证成指年度涨跌幅柱状图（红涨绿跌，中国市场惯例）'),
    bullet('每根柱子标注精确涨跌幅数值'),
    bullet('年度数据表：年初收盘 / 年末收盘 / 涨跌幅三列'),
    blankLine(),

    new Paragraph({ children: [new PageBreak()] }),

    // ── 四、核心数据 ──────────────────────────────────────────────────────
    heading1('四、核心数据摘要'),

    heading2('4.1 指数关键统计'),
    makeTable(
      ['指标', '上证综指', '深证成指'],
      [
        ['数据起始日期', '1990-12-19', '1991-04-03'],
        ['数据截止日期', '2022-06-17', '2022-06-17'],
        ['总交易日数', '7,694 天', '7,603 天'],
        ['历史最高点位', '6,092.06 点（2007-10-16）', '19,531.15 点（2015-06-12）'],
        ['历史最低点位', '99.98 点（1990-12-19）', '402.50 点（1991-05-09）'],
        ['最新收盘点位（截止日）', '3,316.79 点', '12,331.14 点'],
      ],
      [3400, 3000, 3560]
    ),
    blankLine(),

    heading2('4.2 两融关键统计'),
    makeTable(
      ['指标', '沪市', '深市'],
      [
        ['数据起始日期', '2010-03-31', '2010-03-31'],
        ['数据截止日期', '2022-06-17', '2022-06-16'],
        ['历史峰值两融余额', '14,869 亿元（2015年）', '8,877 亿元（2021年）'],
        ['最新两融余额（截止日）', '8,492 亿元', '7,100 亿元'],
        ['沪深合计最新余额', '约 15,592 亿元', '—'],
      ],
      [3400, 3000, 3560]
    ),
    blankLine(),

    heading2('4.3 相关性分析结论'),
    para('基于 2015 年至 2022 年数据区间的相关性计算结果如下：'),
    blankLine(),
    makeTable(
      ['分析维度', '相关系数', '相关强度', '解读'],
      [
        ['上证综指 × 沪市两融余额', '约 +0.77', '强正相关', '指数上涨伴随两融规模扩张'],
        ['上证综指 × 沪市融资余额', '约 +0.78', '强正相关', '融资买入是推动指数上行的重要力量'],
        ['深证成指 × 深市两融余额', '约 +0.82', '强正相关', '深市相关性更高，杠杆资金影响更显著'],
        ['深证成指 × 深市融资余额', '约 +0.83', '强正相关', '成长板块融资需求强烈'],
      ],
      [2800, 1600, 1600, 3960]
    ),
    blankLine(),
    para('注：上述相关系数为全样本 Pearson 线性相关系数，反映长期趋势同步性。短期（30日滚动）相关系数波动较大，需结合时段背景解读。', { size: 19, color: '7F8C8D' }),
    blankLine(),

    new Paragraph({ children: [new PageBreak()] }),

    // ── 五、部署与运行 ────────────────────────────────────────────────────
    heading1('五、部署与运行说明'),

    heading2('5.1 环境要求'),
    makeTable(
      ['依赖项', '版本要求', '用途'],
      [
        ['Python', '3.8 +', '后端运行环境'],
        ['Flask', '2.x', 'Web 框架'],
        ['Flask-CORS', '最新版', '跨域资源共享'],
        ['Pandas', '1.x +', '数据处理'],
        ['NumPy', '1.x +', '数值计算'],
        ['Node.js', '14.x +（可选）', '仅用于生成本报告文档'],
        ['现代浏览器', 'Chrome / Edge / Firefox', '访问前端页面'],
      ],
      [2200, 2200, 5560]
    ),
    blankLine(),

    heading2('5.2 安装依赖'),
    para('在终端执行以下命令安装 Python 依赖：'),
    blankLine(),
    new Paragraph({
      spacing: { before: 80, after: 80 },
      shading: { fill: '1E2430', type: ShadingType.CLEAR },
      border: { left: { style: BorderStyle.SINGLE, size: 20, color: COLOR.primary, space: 8 } },
      children: [new TextRun({ text: 'pip install flask flask-cors pandas numpy', font: 'Courier New', size: 20, color: 'A8D8FF' })],
    }),
    blankLine(),

    heading2('5.3 启动服务'),
    para('进入项目目录后执行：'),
    blankLine(),
    new Paragraph({
      spacing: { before: 80, after: 80 },
      shading: { fill: '1E2430', type: ShadingType.CLEAR },
      border: { left: { style: BorderStyle.SINGLE, size: 20, color: COLOR.primary, space: 8 } },
      children: [new TextRun({ text: 'python app.py', font: 'Courier New', size: 20, color: 'A8D8FF' })],
    }),
    blankLine(),
    para('服务启动后，打开浏览器访问：http://127.0.0.1:5000'),
    blankLine(),

    heading2('5.4 数据文件路径'),
    para('数据文件默认读取路径为：'),
    new Paragraph({
      spacing: { before: 80, after: 80 },
      shading: { fill: '1E2430', type: ShadingType.CLEAR },
      border: { left: { style: BorderStyle.SINGLE, size: 20, color: COLOR.primary, space: 8 } },
      children: [new TextRun({ text: 'C:/Users/\u9ec4\u5353\u884c/Desktop/\u8bc1\u5238\u5206\u6790/', font: 'Courier New', size: 20, color: 'A8D8FF' })],
    }),
    para('如需更改，修改 app.py 顶部的 DATA_DIR 变量即可。', { size: 19, color: '7F8C8D' }),
    blankLine(),

    new Paragraph({ children: [new PageBreak()] }),

    // ── 六、后续优化建议 ──────────────────────────────────────────────────
    heading1('六、后续优化建议'),

    heading2('6.1 数据层'),
    bullet('接入实时行情 API（如 Tushare Pro / 同花顺），实现每日自动更新'),
    bullet('增加个股两融数据，支持按标的分析融资融券结构'),
    bullet('引入市场情绪指标（换手率、涨跌停家数）增强分析维度'),
    blankLine(),

    heading2('6.2 功能层'),
    bullet('增加 K 线图（OHLC）替代当前收盘价折线图，提供更专业的技术分析视角'),
    bullet('添加两融余额分位数指标，判断当前杠杆水平在历史中的相对位置'),
    bullet('实现多周期滚动相关系数对比（7日 / 30日 / 90日）'),
    bullet('增加简单的量化因子回测模块（如两融异动信号对后市收益的预测效果）'),
    blankLine(),

    heading2('6.3 工程层'),
    bullet('将数据文件迁移至数据库（SQLite / PostgreSQL），提升大数据量下的查询性能'),
    bullet('添加用户权限管理与访问日志记录'),
    bullet('支持图表导出为 PNG / CSV 功能'),
    bullet('容器化部署（Docker），便于跨环境迁移与生产发布'),
    blankLine(),

    // ── 结语 ─────────────────────────────────────────────────────────────
    heading1('七、总结'),
    para('本系统基于沪深两市近 32 年的指数历史数据和 12 年的两融交易数据，构建了一套功能完善、交互友好的金融数据可视化分析平台。系统采用前后端分离架构，后端通过 Flask 提供标准化 RESTful API，前端基于 ECharts 实现丰富的交互图表，覆盖行情走势、资金流向、相关性分析、年度对比等核心分析场景。'),
    blankLine(),
    para('分析结果显示，沪深两市指数与两融余额之间存在显著的强正相关性（r > 0.77），印证了杠杆资金在中国 A 股市场中的重要作用。系统将持续迭代，逐步接入实时数据源并拓展量化分析能力。'),
    blankLine(),
  ];
}

// ─── 组装文档 ─────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: '\u25CF',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 560, hanging: 280 } } },
        }],
      },
    ],
  },
  styles: {
    default: {
      document: { run: { font: 'Arial', size: 22, color: COLOR.darkGray } },
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: 'Arial', color: COLOR.primary },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Arial', color: COLOR.accent },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 },
      },
    ],
  },
  sections: [
    // 封面
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: makeCoverSection(),
    },
    // 正文
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1200, right: 1200, bottom: 1200, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR.primary, space: 4 } },
            children: [
              new TextRun({ text: '\u6caa\u6df1\u4e24\u5e02\u91d1\u878d\u6570\u636e\u5206\u6790\u7cfb\u7edf', font: 'Arial', size: 18, color: COLOR.accent, bold: true }),
              new TextRun({ text: '    \u9879\u76ee\u62a5\u544a', font: 'Arial', size: 18, color: '7F8C8D' }),
            ],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 6, color: COLOR.border, space: 4 } },
            children: [
              new TextRun({ text: '2026\u5e744\u670826\u65e5    \u7b2c ', font: 'Arial', size: 18, color: '7F8C8D' }),
              new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18, color: '7F8C8D' }),
              new TextRun({ text: ' \u9875', font: 'Arial', size: 18, color: '7F8C8D' }),
            ],
          })],
        }),
      },
      children: makeBody(),
    },
  ],
});

// ─── 输出文件 ─────────────────────────────────────────────────────────────────
const outPath = 'C:/Users/\u9ec4\u5353\u884c/WorkBuddy/20260426093814/finance-dashboard/\u6caa\u6df1\u91d1\u878d\u6570\u636e\u5206\u6790\u7cfb\u7edf_\u9879\u76ee\u62a5\u544a.docx';
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log('报告生成成功:', outPath);
}).catch(e => { console.error('生成失败:', e); process.exit(1); });
