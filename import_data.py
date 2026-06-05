"""
将CSV数据导入MySQL数据库
"""
import pandas as pd
import pymysql
import numpy as np
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
MYSQL_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Admin@123',
    'database': 'finance_db',
    'charset': 'utf8mb4',
}

def read_csv(fname):
    path = os.path.join(DATA_DIR, fname)
    df = pd.read_csv(path, encoding='utf-8')
    df['date'] = pd.to_datetime(df['date'].astype(str), format='%Y%m%d')
    df = df.sort_values('date').reset_index(drop=True)
    df.rename(columns={'date': 'trade_date'}, inplace=True)
    return df

def clean_nan(df):
    """将 NaN / NaT 替换为 None，使 pymysql 能正确处理"""
    return df.where(df.notna(), None)

def import_df(df, table_name, conn):
    cursor = conn.cursor()
    cursor.execute(f"TRUNCATE TABLE {table_name}")

    df = clean_nan(df)
    cols = df.columns.tolist()
    placeholders = ', '.join(['%s'] * len(cols))
    col_names = ', '.join([f'`{c}`' for c in cols])
    sql = f"INSERT IGNORE INTO `{table_name}` ({col_names}) VALUES ({placeholders})"

    rows = [tuple(None if pd.isna(v) else v for v in row)
             for row in df.itertuples(index=False, name=None)]
    batch_size = 500
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        cursor.executemany(sql, batch)
        conn.commit()
        print(f"  {table_name}: {min(i+batch_size, len(rows))}/{len(rows)} 条")

    cursor.close()

def main():
    conn = pymysql.connect(**MYSQL_CONFIG)
    print("MySQL 连接成功\n")

    # 导入指数数据
    print("=== 导入沪深指数数据 ===")
    for fname, table in [('sh_index.csv', 'sh_index'), ('sz_index.csv', 'sz_index')]:
        df = read_csv(fname)
        print(f"{fname}: {len(df)} 条记录")
        import_df(df, table, conn)

    # 导入两融数据
    print("\n=== 导入两融数据 ===")
    for fname, table in [('sh_margin_trade.csv', 'sh_margin_trade'), ('sz_margin_trade.csv', 'sz_margin_trade')]:
        df = read_csv(fname)
        print(f"{fname}: {len(df)} 条记录")
        import_df(df, table, conn)

    # 验证
    print("\n=== 验证数据 ===")
    for table in ['sh_index', 'sz_index', 'sh_margin_trade', 'sz_margin_trade']:
        cursor = conn.cursor()
        cursor.execute(f"SELECT COUNT(*), MIN(trade_date), MAX(trade_date) FROM `{table}`")
        cnt, dmin, dmax = cursor.fetchone()
        print(f"  {table}: {cnt} 条, {dmin} ~ {dmax}")
        cursor.close()

    conn.close()
    print("\n✅ 数据导入完成！")

if __name__ == '__main__':
    main()
