@echo off
chcp 65001 > nul
echo ================================
echo   沪深金融数据分析系统 启动脚本
echo ================================
echo.

REM 检查 Python
where python >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Python，请先安装 Python 并添加到 PATH
    pause
    exit /b 1
)

REM 安装依赖
if exist "requirements.txt" (
    echo [1/3] 检查 Python 依赖...
    pip install -r requirements.txt -q --disable-pip-version-check
) else (
    echo [警告] requirements.txt 不存在，跳过依赖安装
)

REM 启动 Flask
echo [2/3] 启动后端服务...
echo [3/3] 启动完成后访问: http://127.0.0.1:5000
echo.
python app.py
pause
