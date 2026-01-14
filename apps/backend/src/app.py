import asyncio
import os
from pathlib import Path
from queue import Queue
from flask_cors import CORS
from flask import Flask, Response, send_from_directory
from src.conf import BASE_DIR

# 全局变量
active_queues = {}

def create_app():
    """Flask应用工厂函数"""
    # 创建Flask应用
    app = Flask(__name__)

    # 允许所有来源跨域访问
    CORS(app)

    # 限制上传文件大小为160MB
    app.config['MAX_CONTENT_LENGTH'] = 160 * 1024 * 1024

    # 获取当前目录（假设 index.html 和 assets 在这里）
    current_dir = os.path.dirname(os.path.abspath(__file__))

    # 处理所有静态资源请求（未来打包用）
    @app.route('/assets/<filename>')
    def custom_static(filename):
        return send_from_directory(os.path.join(current_dir, 'assets'), filename)

    # 处理 favicon.ico 静态资源（未来打包用）
    @app.route('/favicon.ico')
    def favicon():
        return send_from_directory(os.path.join(current_dir, 'assets'), 'vite.svg')

    @app.route('/vite.svg')
    def vite_svg():
        return send_from_directory(os.path.join(current_dir, 'assets'), 'vite.svg')

    # （未来打包用）
    @app.route('/')
    def index():
        return send_from_directory(current_dir, 'index.html')

    # 导入路由
    from src.routes import dashboard, account, file, publish, cookie, group

    # 注册蓝图
    app.register_blueprint(dashboard.bp)
    app.register_blueprint(account.bp)
    app.register_blueprint(file.bp)
    app.register_blueprint(publish.bp)
    app.register_blueprint(cookie.bp)
    app.register_blueprint(group.group_bp)

    return app

# SSE 流生成器函数
def sse_stream(status_queue):
    import time
    while True:
        if not status_queue.empty():
            msg = status_queue.get()
            yield f"data: {msg}\n\n"
        else:
            # 避免 CPU 占满
            time.sleep(0.1)

# 包装函数：在线程中运行异步函数
def run_async_function(type, id, status_queue, group_name=None):
    from src.services.login_service import DefaultLoginService

    # 创建登录服务实例
    login_service = DefaultLoginService()

    match type:
        case '1':
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(login_service.xiaohongshu_cookie_gen(id, status_queue, group_name))
            loop.close()
        case '2':
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(login_service.get_tencent_cookie(id, status_queue, group_name))
            loop.close()
        case '3':
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(login_service.douyin_cookie_gen(id, status_queue, group_name))
            loop.close()
        case '4':
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(login_service.get_ks_cookie(id, status_queue, group_name))
            loop.close()

# 创建默认的Flask应用实例（向后兼容）
app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5409)

