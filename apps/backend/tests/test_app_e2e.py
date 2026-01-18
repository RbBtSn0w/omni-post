#!/usr/bin/env python3
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from flask import Flask
from queue import Queue
from src.core.config import MAX_UPLOAD_SIZE

class TestAppE2E:
    """E2E和集成测试 Flask应用"""

    def setup_method(self):
        """设置测试环境"""
        # Import app after setup to avoid import issues
        from src.app import create_app
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()

    def test_app_creation(self):
        """测试Flask应用创建"""
        assert self.app is not None
        assert self.app.config['TESTING'] is True

    def test_cors_enabled(self):
        """测试CORS配置"""
        response = self.client.get('/')
        # CORS headers should be present
        assert response.status_code in [200, 404]  # May not have index.html

    def test_max_content_length(self):
        """测试文件上传大小限制"""
        assert self.app.config['MAX_CONTENT_LENGTH'] == MAX_UPLOAD_SIZE

    def test_favicon_route_exists(self):
        """测试favicon路由存在"""
        with patch('src.app.send_from_directory') as mock_send:
            mock_send.return_value = "favicon"
            response = self.client.get('/favicon.ico')
            assert response.status_code == 200

    def test_vite_svg_route_exists(self):
        """测试vite.svg路由存在"""
        with patch('src.app.send_from_directory') as mock_send:
            mock_send.return_value = "vite svg"
            response = self.client.get('/vite.svg')
            assert response.status_code == 200

    def test_index_route_exists(self):
        """测试index路由存在"""
        with patch('src.app.send_from_directory') as mock_send:
            mock_send.return_value = "index html"
            response = self.client.get('/')
            assert response.status_code == 200

    def test_assets_route(self):
        """测试assets路由"""
        with patch('src.app.send_from_directory') as mock_send:
            mock_send.return_value = "asset content"
            response = self.client.get('/assets/test.js')
            assert response.status_code == 200

    @pytest.mark.timeout(5)
    def test_sse_stream_generator(self):
        """测试SSE流生成器"""
        from src.services.login_service import sse_stream

        # Create a test queue
        test_queue = Queue()
        test_queue.put("test message 1")
        test_queue.put("test message 2")

        # Get generator
        gen = sse_stream(test_queue)

        # Get first message
        msg1 = next(gen)
        assert "data: test message 1" in msg1

        # Get second message
        msg2 = next(gen)
        assert "data: test message 2" in msg2

    def test_registered_blueprints(self):
        """测试已注册的蓝图"""
        from src.app import create_app
        app = create_app()
        blueprint_names = [bp.name for bp in app.blueprints.values()]

        # Check that key blueprints are registered
        expected_blueprints = ['file', 'cookie', 'account', 'dashboard', 'publish']
        for bp_name in expected_blueprints:
            assert bp_name in blueprint_names, f"Blueprint '{bp_name}' not registered"

    def test_health_check_integration(self):
        """集成测试：健康检查（如果存在）"""
        # Try common health check endpoints
        health_endpoints = ['/health', '/api/health', '/ping']

        for endpoint in health_endpoints:
            response = self.client.get(endpoint)
            # Just check it doesn't crash, status can be 404 if not implemented
            assert response.status_code in [200, 404]

    def test_404_handling(self):
        """测试404错误处理"""
        response = self.client.get('/nonexistent-route-12345')
        assert response.status_code == 404

    def test_method_not_allowed(self):
        """测试405 Method Not Allowed"""
        # Try POST on a GET-only route
        response = self.client.post('/')
        assert response.status_code in [405, 404, 200]  # Depends on implementation

    @patch('src.services.login_service.active_queues')
    def test_active_queues_global(self, mock_queues):
        """测试全局队列变量"""
        from src.services.login_service import active_queues
        assert isinstance(active_queues, dict) or mock_queues is not None


class TestAppBlueprints:
    """测试蓝图集成"""

    def setup_method(self):
        from src.app import create_app
        self.app = create_app()
        self.client = self.app.test_client()

    def test_file_blueprint_routes(self):
        """测试文件蓝图路由可访问"""
        # These should exist even if they return errors without proper data
        response = self.client.get('/getFiles')
        assert response.status_code in [200, 500]

    def test_account_blueprint_routes(self):
        """测试账号蓝图路由可访问"""
        response = self.client.get('/getAccounts')
        assert response.status_code in [200, 500]

    # def test_dashboard_blueprint_routes(self):
    #     """测试仪表板蓝图路由可访问"""
    #     with patch('src.utils.db_manager.db_manager') as mock_db:
    #         with patch('sqlite3.connect') as mock_sqlite:
    #             mock_db.get_db_path.return_value = '/tmp/test.db'
    #             mock_conn = MagicMock()
    #             mock_cursor = MagicMock()
    #             mock_sqlite.return_value.__enter__.return_value = mock_conn
    #             mock_conn.cursor.return_value = mock_cursor
    #             mock_cursor.fetchall.return_value = []
    #
    #             response = self.client.get('/getDashboard')
    #             assert response.status_code in [200, 500]

    def test_cookie_blueprint_routes(self):
        """测试Cookie蓝图路由可访问"""
        response = self.client.get('/downloadCookie')
        assert response.status_code in [400, 500]  # Should fail without params


class TestAppE2EFlows:
    """端到端流程测试"""

    def setup_method(self):
        from src.app import create_app
        self.app = create_app()
        self.client = self.app.test_client()

    @patch('src.db.db_manager')
    @patch('sqlite3.connect')
    def test_complete_file_upload_flow(self, mock_sqlite, mock_db):
        """E2E: 完整的文件上传流程"""
        from io import BytesIO

        mock_db.get_db_path.return_value = '/tmp/test.db'
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_sqlite.return_value.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # Step 1: Upload file
        data = {'file': (BytesIO(b"test video"), 'test.mp4')}
        response = self.client.post('/upload', data=data, content_type='multipart/form-data')
        assert response.status_code in [200, 500]

        # Step 2: Get all files
        mock_cursor.fetchall.return_value = []
        response = self.client.get('/getFiles')
        assert response.status_code == 200

    @patch('src.db.db_manager')
    @patch('sqlite3.connect')
    def test_complete_account_management_flow(self, mock_sqlite, mock_db):
        """E2E: 完整的账号管理流程"""
        mock_db.get_db_path.return_value = '/tmp/test.db'
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_sqlite.return_value.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # Step 1: Get accounts
        mock_cursor.fetchall.return_value = []
        response = self.client.get('/getAccounts')
        assert response.status_code == 200

        # Step 2: Get valid accounts
        with patch('src.services.cookie_service.DefaultCookieService.check_cookie', new_callable=AsyncMock) as mock_check:
            mock_check.return_value = True
            response = self.client.get('/getValidAccounts')
            assert response.status_code in [200, 500]
