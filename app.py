"""
沪深两市指数 & 两融数据分析系统 - Flask 后端
数据源: MySQL 数据库 finance_db
"""
import os
import pymysql
import pandas as pd
import numpy as np
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__, static_folder='static')
CORS(app)

# ─── MySQL 配置（从环境变量读取，本地开发用 .env） ───────────────
MYSQL_CONFIG = {
    'host':    os.getenv('DB_HOST', 'localhost'),
    'user':    os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASS', 'Admin@123'),
    'database': os.getenv('DB_NAME', 'finance_db'),
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor,
}

# ─── 全局加载数据（从 MySQL 读取到 pandas） ─────────────────────────
def load_data():
    conn = pymysql.connect(**MYSQL_CONFIG)
    try:
        sh_idx = pd.read_sql("SELECT * FROM sh_index ORDER BY trade_date", conn)
        sz_idx = pd.read_sql("SELECT * FROM sz_index ORDER BY trade_date", conn)
        sh_mgn = pd.read_sql("SELECT * FROM sh_margin_trade ORDER BY trade_date", conn)
        sz_mgn = pd.read_sql("SELECT * FROM sz_margin_trade ORDER BY trade_date", conn)
    finally:
        conn.close()

    # 统一日期列名
    for df in [sh_idx, sz_idx, sh_mgn, sz_mgn]:
        df['date'] = pd.to_datetime(df['trade_date'])
        df.drop(columns=['id'], inplace=True, errors='ignore')

    # 单位换算（两融余额原始单位：元 → 亿元）
    for df in [sh_mgn, sz_mgn]:
        for col in ['financing_balance', 'margin_balance',
                    'financing_purchase', 'financing_redeem',
                    'securities_lending_balance', 'securities_lending_sell']:
            if col in df.columns:
                df[col] = df[col] / 1e8

    return sh_idx, sz_idx, sh_mgn, sz_mgn

print("📊 正在从 MySQL 加载数据...")
sh_idx, sz_idx, sh_mgn, sz_mgn = load_data()
print(f"   上证综指: {len(sh_idx)} 条  ({sh_idx['date'].min().date()} ~ {sh_idx['date'].max().date()})")
print(f"   深证成指: {len(sz_idx)} 条  ({sz_idx['date'].min().date()} ~ {sz_idx['date'].max().date()})")
print(f"   沪市两融: {len(sh_mgn)} 条  ({sh_mgn['date'].min().date()} ~ {sh_mgn['date'].max().date()})")
print(f"   深市两融: {len(sz_mgn)} 条  ({sz_mgn['date'].min().date()} ~ {sz_mgn['date'].max().date()})")
print("✅ 数据加载完成\n")

# ─── 工具函数 ──────────────────────────────────────────────────────────
def df_to_json(df, date_col='date'):
    d = df.copy()
    d[date_col] = d[date_col].dt.strftime('%Y-%m-%d')
    d = d.replace({np.nan: None})
    return d.to_dict(orient='records')

def filter_date(df, start, end):
    mask = pd.Series([True] * len(df))
    if start:
        mask &= df['date'] >= pd.to_datetime(start)
    if end:
        mask &= df['date'] <= pd.to_datetime(end)
    return df[mask]

# ─── API：概览统计 ─────────────────────────────────────────────────────────
@app.route('/api/overview')
def overview():
    def stat(df, name, close_col='close', balance_col=None):
        latest   = df.iloc[-1]
        earliest  = df.iloc[0]
        result = {
            'name': name,
            'latest_date': latest['date'].strftime('%Y-%m-%d'),
            'total_days':  len(df),
            'data_start':  earliest['date'].strftime('%Y-%m-%d'),
        }
        if close_col and close_col in df.columns:
            result['latest_close'] = round(float(latest[close_col]), 2)
            result['max_close']    = round(float(df[close_col].max()), 2)
            result['min_close']    = round(float(df[close_col].min()), 2)
        if balance_col and balance_col in df.columns:
            result['latest_balance'] = round(float(latest[balance_col]), 2)
            result['max_balance']   = round(float(df[balance_col].max()), 2)
        return result

    return jsonify({
        'sh_index':  stat(sh_idx, '上证综指'),
        'sz_index':  stat(sz_idx, '深证成指'),
        'sh_margin': stat(sh_mgn, '沪市两融', close_col=None, balance_col='margin_balance'),
        'sz_margin': stat(sz_mgn, '深市两融', close_col=None, balance_col='margin_balance'),
    })

# ─── API：指数行情 ─────────────────────────────────────────────────────────
@app.route('/api/index')
def index_data():
    market = request.args.get('market', 'sh')
    start  = request.args.get('start', '2015-01-01')
    end    = request.args.get('end',   None)
    limit  = int(request.args.get('limit', 500))

    def prepare(df, label):
        d = filter_date(df, start, end)
        if len(d) > limit:
            step = max(1, len(d) // limit)
            d = d.iloc[::step]
        d = d.copy()
        d['label'] = label
        return d

    if market == 'sh':
        data = prepare(sh_idx, '上证综指')
        return jsonify(df_to_json(data))
    elif market == 'sz':
        data = prepare(sz_idx, '深证成指')
        return jsonify(df_to_json(data))
    else:
        return jsonify({
            'sh': df_to_json(prepare(sh_idx, '上证综指')),
            'sz': df_to_json(prepare(sz_idx, '深证成指')),
        })

# ─── API：两融数据 ─────────────────────────────────────────────────────────
@app.route('/api/margin')
def margin_data():
    market = request.args.get('market', 'both')
    start  = request.args.get('start', '2015-01-01')
    end    = request.args.get('end',   None)
    limit  = int(request.args.get('limit', 400))

    def prepare(df, label):
        d = filter_date(df, start, end)
        if len(d) > limit:
            step = max(1, len(d) // limit)
            d = d.iloc[::step]
        d = d.copy()
        d['label'] = label
        return d

    if market == 'sh':
        return jsonify(df_to_json(prepare(sh_mgn, '沪市')))
    elif market == 'sz':
        return jsonify(df_to_json(prepare(sz_mgn, '深市')))
    else:
        return jsonify({
            'sh': df_to_json(prepare(sh_mgn, '沪市')),
            'sz': df_to_json(prepare(sz_mgn, '深市')),
        })

# ─── API：两融与指数相关性 ──────────────────────────────────────────────────
@app.route('/api/correlation')
def correlation():
    start = request.args.get('start', '2015-01-01')
    end   = request.args.get('end',   None)

    def build(idx_df, mgn_df, idx_name, mgn_name):
        idx_f = filter_date(idx_df, start, end)[['date', 'close']].copy()
        mgn_f = filter_date(mgn_df, start, end)[['date', 'margin_balance', 'financing_balance']].copy()
        merged = pd.merge(idx_f, mgn_f, on='date', how='inner')
        if len(merged) < 10:
            return {}
        corr_margin     = round(float(merged['close'].corr(merged['margin_balance'])), 4)
        corr_financing = round(float(merged['close'].corr(merged['financing_balance'])), 4)

        merged['roll_corr'] = merged['close'].rolling(30).corr(merged['margin_balance'])
        roll = merged[['date', 'roll_corr']].dropna()
        roll_data = [{'date': r['date'].strftime('%Y-%m-%d'),
                      'corr': round(float(r['roll_corr']), 4)}
                     for _, r in roll.iterrows()]

        return {
            'market':       f'{idx_name} vs {mgn_name}',
            'corr_margin':  corr_margin,
            'corr_financing': corr_financing,
            'n_samples':    len(merged),
            'rolling_corr': roll_data[-200:],
        }

    return jsonify({
        'sh': build(sh_idx, sh_mgn, '上证综指', '沪市两融余额'),
        'sz': build(sz_idx, sz_mgn, '深证成指', '深市两融余额'),
    })

# ─── API：两融月度聚合 ──────────────────────────────────────────────────────
@app.route('/api/margin/monthly')
def margin_monthly():
    start = request.args.get('start', '2010-01-01')
    end   = request.args.get('end',   None)

    def monthly(df, label):
        d = filter_date(df, start, end).copy()
        d['ym'] = d['date'].dt.to_period('M')
        grp = d.groupby('ym').agg(
            financing_balance=('financing_balance', 'last'),
            margin_balance=('margin_balance', 'last'),
        ).reset_index()
        grp['date'] = grp['ym'].dt.to_timestamp().dt.strftime('%Y-%m')
        grp = grp.drop(columns=['ym'])
        grp['label'] = label
        grp = grp.where(grp.notna(), None)
        return grp.to_dict(orient='records')

    return jsonify({
        'sh': monthly(sh_mgn, '沪市'),
        'sz': monthly(sz_mgn, '深市'),
    })

# ─── API：融资买入 vs 偿还 对比 ─────────────────────────────────────────────
@app.route('/api/margin/flow')
def margin_flow():
    start = request.args.get('start', '2015-01-01')
    end   = request.args.get('end',   None)
    limit = int(request.args.get('limit', 300))

    def build(df, label):
        d = filter_date(df, start, end).copy()
        if len(d) > limit:
            step = max(1, len(d) // limit)
            d = d.iloc[::step]
        d['label'] = label
        cols = ['date', 'financing_purchase', 'financing_redeem', 'securities_lending_sell', 'label']
        cols = [c for c in cols if c in d.columns]
        return df_to_json(d[cols])

    return jsonify({
        'sh': build(sh_mgn, '沪市'),
        'sz': build(sz_mgn, '深市'),
    })

# ─── API：年度涨跌幅统计 ──────────────────────────────────────────────────
@app.route('/api/index/annual')
def index_annual():
    def annual(df, label):
        d = df.copy()
        d['year'] = d['date'].dt.year
        grp = d.groupby('year')['close'].agg(['first', 'last']).reset_index()
        grp['change_pct'] = ((grp['last'] - grp['first']) / grp['first'] * 100).round(2)
        grp.columns = ['year', 'open_close', 'year_close', 'change_pct']
        grp['label'] = label
        return grp.to_dict(orient='records')

    return jsonify({
        'sh': annual(sh_idx, '上证综指'),
        'sz': annual(sz_idx, '深证成指'),
    })

# ─── API：两融占比分析 ────────────────────────────────────────────────────
@app.route('/api/margin/ratio')
def margin_ratio():
    start = request.args.get('start', '2015-01-01')
    end   = request.args.get('end',   None)
    limit = int(request.args.get('limit', 300))

    sh_f = filter_date(sh_mgn, start, end)[['date', 'margin_balance', 'financing_balance']].copy()
    sz_f = filter_date(sz_mgn, start, end)[['date', 'margin_balance', 'financing_balance']].copy()
    sh_f = sh_f.rename(columns={'margin_balance': 'sh_margin', 'financing_balance': 'sh_financing'})
    sz_f = sz_f.rename(columns={'margin_balance': 'sz_margin', 'financing_balance': 'sz_financing'})

    merged = pd.merge(sh_f, sz_f, on='date', how='inner')
    merged['total_margin']    = merged['sh_margin'] + merged['sz_margin']
    merged['total_financing'] = merged['sh_financing'] + merged['sz_financing']
    merged['sh_ratio'] = (merged['sh_margin'] / merged['total_margin'] * 100).round(2)
    merged['sz_ratio'] = (merged['sz_margin'] / merged['total_margin'] * 100).round(2)

    if len(merged) > limit:
        step = max(1, len(merged) // limit)
        merged = merged.iloc[::step]

    return jsonify(df_to_json(merged))

# ─── API：系统状态（最新数据日期）─────────────────────────────
@app.route('/api/status')
def api_status():
    def latest_date(df):
        return df['date'].max().strftime('%Y-%m-%d')
    return jsonify({
        'data_date': latest_date(sh_idx),
        'sh_count':  len(sh_idx),
        'sz_count':  len(sz_idx),
        'sh_mgn_count': len(sh_mgn),
        'sz_mgn_count': len(sz_mgn),
    })


# ─── 静态页面 ──────────────────────────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

# ─── 启动 ──────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("🚀 金融数据分析系统启动中...")
    print("🌐 访问地址: http://127.0.0.1:5000")
    app.run(debug=False, port=5000, host='127.0.0.1')
