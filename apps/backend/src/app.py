import asyncio
import os
from pathlib import Path
from queue import Queue

from flask import Flask, Response, send_from_directory
from flask_cors import CORS
from src.core.config import BASE_DIR, MAX_UPLOAD_SIZE


def create_app():
    """Flask应用工厂函数"""
    # 创建Flask应用
    app = Flask(__name__)

    # 允许所有来源跨域访问
    CORS(app)

    # 限制上传文件大小
    app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_SIZE

    # 获取当前目录（假设 index.html 和 assets 在这里）
    current_dir = os.path.dirname(os.path.abspath(__file__))

    # 处理所有静态资源请求（未来打包用）
    @app.route("/assets/<filename>")
    def custom_static(filename):
        return send_from_directory(os.path.join(current_dir, "assets"), filename)

    # 处理 favicon.ico 静态资源（未来打包用）
    @app.route("/favicon.ico")
    def favicon():
        return send_from_directory(os.path.join(current_dir, "assets"), "vite.svg")

    @app.route("/vite.svg")
    def vite_svg():
        return send_from_directory(os.path.join(current_dir, "assets"), "vite.svg")

    # （未来打包用）
    @app.route("/")
    def index():
        return send_from_directory(current_dir, "index.html")

    # 导入路由
    from src.routes import account, cookie, dashboard, file, group, publish

    # 注册蓝图
    app.register_blueprint(dashboard.bp)
    app.register_blueprint(account.bp)
    app.register_blueprint(file.bp)
    app.register_blueprint(publish.bp)
    app.register_blueprint(cookie.bp)
    app.register_blueprint(group.group_bp)

    return app


# 创建默认的Flask应用实例（向后兼容）
app = create_app()

if __name__ == "__main__":
    from src.core.config import SERVER_HOST, SERVER_PORT

    app.run(host=SERVER_HOST, port=SERVER_PORT)
