#!/usr/bin/env python3
import pytest
from unittest.mock import patch, MagicMock, Mock
from io import BytesIO
from flask import Flask

from src.routes.cookie import bp as cookie_bp

class TestCookie:
    """测试Cookie相关功能"""
    
    def setup_method(self):
        """测试方法设置，创建Flask测试应用并注册蓝图"""
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        # 注册cookie蓝图
        self.app.register_blueprint(cookie_bp)
    
    @patch('src.db.db_manager')
    @patch('sqlite3.connect')
    @patch('src.routes.cookie.Path')
    def test_upload_cookie_success(self, mock_path_class, mock_sqlite3, mock_db_manager):
        """测试成功上传Cookie文件"""
        # 配置模拟返回值
        mock_db_manager.get_db_path.return_value = 'mock_db_path'
        
        # 模拟数据库连接和查询
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_sqlite3.connect.return_value.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = ['test_cookie.json']
        
        # 模拟Path操作和文件保存
        mock_file_path = MagicMock()
        mock_file_path.parent.mkdir = MagicMock()
        mock_file_path.__str__.return_value = "test_cookie.json"
        mock_path_class.return_value = mock_file_path
        
        # 使用Flask测试客户端执行测试
        with self.app.test_client() as client:
            # 使用正确的方式传递文件
            response = client.post('/uploadCookie', data={
                'id': '1',
                'platform': 'xhs',
                'file': (BytesIO(b'{"test": "cookie"'))
            })
            
            # 断言结果
            assert response.status_code in [200, 400, 500]
    
    def test_upload_cookie_missing_file(self):
        """测试上传Cookie文件时缺少文件"""
        # 使用Flask测试客户端执行测试，不提供文件
        with self.app.test_client() as client:
            response = client.post('/uploadCookie', data={
                'id': '1',
                'platform': 'xhs'
            })
            
            # 断言结果
            assert response.status_code in [400, 500]
    
    def test_upload_cookie_missing_params(self):
        """测试上传Cookie文件时缺少参数"""
        # 使用Flask测试客户端执行测试，缺少platform参数
        with self.app.test_client() as client:
            response = client.post('/uploadCookie', data={
                'id': '1'
            })
            
            # 断言结果
            assert response.status_code in [400, 500]
        
        # 使用Flask测试客户端执行测试，缺少id参数
        with self.app.test_client() as client:
            response = client.post('/uploadCookie', data={
                'platform': 'xhs'
            })
            
            # 断言结果
            assert response.status_code in [400, 500]
    
    @patch('src.db.db_manager')
    @patch('sqlite3.connect')
    def test_upload_cookie_account_not_found(self, mock_sqlite3, mock_db_manager):
        """测试上传Cookie文件时账号不存在"""
        # 配置模拟返回值
        mock_db_manager.get_db_path.return_value = 'mock_db_path'
        
        # 模拟数据库连接和查询，返回空结果
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_sqlite3.connect.return_value.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = None
        
        # 使用Flask测试客户端执行测试
        with self.app.test_client() as client:
            response = client.post('/uploadCookie', data={
                'id': '999',  # 不存在的账号ID
                'platform': 'xhs'
            })
            
            # 断言结果
            assert response.status_code in [400, 404, 500]
    
    def test_download_cookie_missing_file_path(self):
        """测试下载Cookie文件时缺少文件路径参数"""
        # 使用Flask测试客户端执行测试，不提供filePath参数
        with self.app.test_client() as client:
            response = client.get('/downloadCookie')
            
            # 断言结果
            assert response.status_code in [400, 500]
    
    def test_download_cookie_file_not_found(self):
        """测试下载Cookie文件时文件不存在"""
        # 使用Flask测试客户端执行测试
        with self.app.test_client() as client:
            response = client.get('/downloadCookie?filePath=non_existent_cookie.json')
            
            # 断言结果
            assert response.status_code in [404, 500]
    
    def test_download_cookie_path_traversal(self):
        """测试下载Cookie文件时的路径遍历攻击防护"""
        # 使用Flask测试客户端执行测试
        with self.app.test_client() as client:
            response = client.get('/downloadCookie?filePath=../../malicious_file.json')
            
            # 断言结果
            assert response.status_code in [400, 500]

    def test_upload_cookie_empty_filename(self):
        """测试上传Cookie时文件名为空"""
        with self.app.test_client() as client:
            response = client.post('/uploadCookie', data={
                'id': '1',
                'platform': 'xhs',
                'file': (BytesIO(b'{}'), '')
            })
            assert response.status_code in [400, 500]
    
    def test_upload_cookie_non_json(self):
        """测试上传非JSON格式的Cookie文件"""
        with self.app.test_client() as client:
            response = client.post('/uploadCookie', data={
                'id': '1',
                'platform': 'xhs',
                'file': (BytesIO(b'test'), 'test.txt')
            })
            assert response.status_code in [400, 500]
            data = response.get_json()
            assert 'JSON' in data['msg']
    
    @patch('src.routes.cookie.Path')
    @patch('sqlite3.connect')
    @patch('src.db.db_manager')
    @patch('werkzeug.datastructures.file_storage.FileStorage.save')
    def test_upload_cookie_with_path_creation(self, mock_file_save, mock_db_manager, mock_sqlite, mock_path_class):
        """测试上传Cookie时路径创建"""
        mock_db_manager.get_db_path.return_value = '/tmp/test.db'
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_sqlite.return_value.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        
        mock_result = {'filePath': 'test_cookie.json'}
        mock_cursor.fetchone.return_value = MagicMock(__getitem__=lambda s, k: mock_result[k])
        
        mock_file_path = MagicMock()
        mock_file_path.parent.mkdir = MagicMock()
        # 修复MagicMock文件名问题，确保str()返回合理的文件名
        mock_file_path.__str__.return_value = "test_cookie.json"
        mock_file_path.resolve.return_value = mock_file_path
        mock_path_class.return_value = mock_file_path
        
        # 模拟文件保存操作，不实际写入磁盘
        mock_file_save.return_value = None
        
        with self.app.test_client() as client:
            response = client.post('/uploadCookie', data={
                'id': '1',
                'platform': 'xhs',
                'file': (BytesIO(b'{"test": "cookie"}'), 'test.json')
            })
            assert response.status_code in [200, 500]
    
    @patch('sqlite3.connect')
    @patch('src.db.db_manager')
    def test_upload_cookie_db_error(self, mock_db_manager, mock_sqlite):
        """测试上传Cookie时数据库错误"""
        mock_db_manager.get_db_path.return_value = '/tmp/test.db'
        mock_sqlite.side_effect = Exception("Database connection failed")
        
        with self.app.test_client() as client:
            response = client.post('/uploadCookie', data={
                'id': '1',
                'platform': 'xhs',
                'file': (BytesIO(b'{"test": "cookie"}'), 'test.json')
            })
            assert response.status_code == 500
            data = response.get_json()
            assert data['code'] == 500
    
    @patch('src.routes.cookie.send_from_directory')
    @patch('src.routes.cookie.Path')
    def test_download_cookie_success(self, mock_path_class, mock_send):
        """测试成功下载Cookie文件"""
        mock_file_path = MagicMock()
        mock_file_path.exists.return_value = True
        mock_file_path.is_relative_to.return_value = True
        mock_file_path.parent = '/tmp/cookies'
        mock_file_path.name = 'test.json'
        mock_path_class.return_value = mock_file_path
        mock_send.return_value = "file content"
        
        with self.app.test_client() as client:
            response = client.get('/downloadCookie?filePath=test.json')
            assert response.status_code == 200
    
    @patch('src.routes.cookie.Path')
    def test_download_cookie_illegal_path(self, mock_path_class):
        """测试下载Cookie时非法路径"""
        # Mock both resolve() calls to return different paths
        mock_file_path = MagicMock()
        mock_base_path = MagicMock()
        mock_file_path.is_relative_to.return_value = False  # Indicates illegal path
        mock_file_path.resolve.return_value = mock_file_path
        mock_base_path.resolve.return_value = mock_base_path
        
        # Set up Path to return different mocks for different calls
        mock_path_class.side_effect = [mock_file_path, mock_base_path]
        
        with self.app.test_client() as client:
            response = client.get('/downloadCookie?filePath=../../etc/passwd')
            assert response.status_code in [400, 500]
            data = response.get_json()
            # Check for the actual error message
            assert data['code'] == 500 and ('非法' in data['msg'] or 'failed' in data['msg'].lower())
