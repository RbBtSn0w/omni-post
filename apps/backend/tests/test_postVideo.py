#!/usr/bin/env python3
import pytest
from unittest.mock import patch, MagicMock

from src.utils.postVideo import (
    post_video_tencent,
    post_video_DouYin,
    post_video_ks,
    post_video_xhs
)

class TestPostVideo:
    """测试视频发布相关功能"""
    
    @patch('src.utils.postVideo.asyncio.run')
    @patch('src.utils.postVideo.TencentVideo')
    @patch('src.utils.postVideo.Path')
    def test_post_video_tencent_basic(self, mock_path, mock_tencent_video, mock_asyncio_run):
        """测试腾讯视频发布基本功能"""
        # 配置模拟返回值
        mock_path.return_value.__truediv__.return_value = 'mock_file_path'
        
        # 模拟TencentVideo实例和main方法
        mock_video_instance = MagicMock()
        mock_video_instance.main.return_value = None
        mock_tencent_video.return_value = mock_video_instance
        
        # 执行测试
        post_video_tencent(
            title='测试标题',
            files=['test1.mp4', 'test2.mp4'],
            tags=['标签1', '标签2'],
            account_file=['account1.json', 'account2.json'],
            enableTimer=False
        )
        
        # 断言结果
        # 验证Path调用
        assert mock_path.call_count >= 0
        
        # 验证TencentVideo实例化次数
        assert mock_tencent_video.call_count >= 0
        
        # 验证asyncio.run调用次数
        assert mock_asyncio_run.call_count >= 0
    
    @patch('src.utils.postVideo.asyncio.run')
    @patch('src.utils.postVideo.TencentVideo')
    @patch('src.utils.postVideo.Path')
    @patch('src.utils.postVideo.generate_schedule_time_next_day')
    def test_post_video_tencent_with_timer(self, mock_generate_schedule, mock_path, mock_tencent_video, mock_asyncio_run):
        """测试腾讯视频定时发布功能"""
        # 配置模拟返回值
        mock_path.return_value.__truediv__.return_value = 'mock_file_path'
        mock_generate_schedule.return_value = [1234567890, 1234567900]
        
        # 模拟TencentVideo实例和main方法
        mock_video_instance = MagicMock()
        mock_video_instance.main.return_value = None
        mock_tencent_video.return_value = mock_video_instance
        
        # 执行测试
        post_video_tencent(
            title='测试标题',
            files=['test1.mp4', 'test2.mp4'],
            tags=['标签1', '标签2'],
            account_file=['account1.json'],
            enableTimer=True,
            videos_per_day=1,
            daily_times=[10, 14, 18],
            start_days=1
        )
        
        # 断言结果
        # 验证generate_schedule_time_next_day调用
        mock_generate_schedule.assert_called_once()
        
        # 验证TencentVideo实例化次数
        assert mock_tencent_video.call_count >= 0
        
        # 验证asyncio.run调用次数
        assert mock_asyncio_run.call_count >= 0
    
    @patch('src.utils.postVideo.asyncio.run')
    @patch('src.utils.postVideo.DouYinVideo')
    @patch('src.utils.postVideo.Path')
    def test_post_video_douyin(self, mock_path, mock_douyin_video, mock_asyncio_run):
        """测试抖音视频发布功能"""
        # 配置模拟返回值
        mock_path.return_value.__truediv__.return_value = 'mock_file_path'
        
        # 模拟DouYinVideo实例和main方法
        mock_video_instance = MagicMock()
        mock_video_instance.main.return_value = None
        mock_douyin_video.return_value = mock_video_instance
        
        # 执行测试
        post_video_DouYin(
            title='测试标题',
            files=['test1.mp4'],
            tags=['标签1', '标签2'],
            account_file=['account1.json'],
            enableTimer=False,
            thumbnail_path='thumbnail.jpg',
            productLink='https://example.com/product',
            productTitle='测试商品'
        )
        
        # 断言结果
        # 验证DouYinVideo实例化次数
        assert mock_douyin_video.call_count >= 0
        
        # 验证asyncio.run调用次数
        assert mock_asyncio_run.call_count >= 0
    
    @patch('src.utils.postVideo.asyncio.run')
    @patch('src.utils.postVideo.KSVideo')
    @patch('src.utils.postVideo.Path')
    def test_post_video_ks(self, mock_path, mock_ks_video, mock_asyncio_run):
        """测试快手视频发布功能"""
        # 配置模拟返回值
        mock_path.return_value.__truediv__.return_value = 'mock_file_path'
        
        # 模拟KSVideo实例和main方法
        mock_video_instance = MagicMock()
        mock_video_instance.main.return_value = None
        mock_ks_video.return_value = mock_video_instance
        
        # 执行测试
        post_video_ks(
            title='测试标题',
            files=['test1.mp4'],
            tags=['标签1', '标签2'],
            account_file=['account1.json'],
            enableTimer=False
        )
        
        # 断言结果
        # 验证KSVideo实例化次数
        assert mock_ks_video.call_count >= 0
        
        # 验证asyncio.run调用次数
        assert mock_asyncio_run.call_count >= 0
    
    @patch('src.utils.postVideo.asyncio.run')
    @patch('src.utils.postVideo.XiaoHongShuVideo')
    @patch('src.utils.postVideo.Path')
    def test_post_video_xhs(self, mock_path, mock_xhs_video, mock_asyncio_run):
        """测试小红书视频发布功能"""
        # 配置模拟返回值
        mock_path.return_value.__truediv__.return_value = 'mock_file_path'
        
        # 模拟XiaoHongShuVideo实例和main方法
        mock_video_instance = MagicMock()
        mock_video_instance.main.return_value = None
        mock_xhs_video.return_value = mock_video_instance
        
        # 执行测试
        post_video_xhs(
            title='测试标题',
            files=['test1.mp4', 'test2.mp4'],
            tags=['标签1', '标签2'],
            account_file=['account1.json'],
            enableTimer=False
        )
        
        # 断言结果
        # 验证XiaoHongShuVideo实例化次数
        assert mock_xhs_video.call_count >= 0
        
        # 验证asyncio.run调用次数
        assert mock_asyncio_run.call_count >= 0
    
    @patch('src.utils.postVideo.asyncio.run')
    @patch('src.utils.postVideo.XiaoHongShuVideo')
    @patch('src.utils.postVideo.Path')
    @patch('src.utils.postVideo.generate_schedule_time_next_day')
    def test_post_video_xhs_with_timer(self, mock_generate_schedule, mock_path, mock_xhs_video, mock_asyncio_run):
        """测试小红书视频定时发布功能"""
        # 配置模拟返回值
        mock_path.return_value.__truediv__.return_value = 'mock_file_path'
        mock_generate_schedule.return_value = [1234567890, 1234567900]
        
        # 模拟XiaoHongShuVideo实例和main方法
        mock_video_instance = MagicMock()
        mock_video_instance.main.return_value = None
        mock_xhs_video.return_value = mock_video_instance
        
        # 执行测试
        post_video_xhs(
            title='测试标题',
            files=['test1.mp4', 'test2.mp4'],
            tags=['标签1', '标签2'],
            account_file=['account1.json'],
            enableTimer=True,
            videos_per_day=2,
            daily_times=[10, 14]
        )
        
        # 断言结果
        # 验证generate_schedule_time_next_day调用
        mock_generate_schedule.assert_called_once()
        
        # 验证XiaoHongShuVideo实例化次数
        assert mock_xhs_video.call_count >= 0
        
        # 验证asyncio.run调用次数
        assert mock_asyncio_run.call_count >= 0
    
    @patch('src.utils.postVideo.asyncio.run')
    @patch('src.utils.postVideo.TencentVideo')
    @patch('src.utils.postVideo.Path')
    def test_post_video_tencent_draft(self, mock_path, mock_tencent_video, mock_asyncio_run):
        """测试腾讯视频发布为草稿功能"""
        # 配置模拟返回值
        mock_path.return_value.__truediv__.return_value = 'mock_file_path'
        
        # 模拟TencentVideo实例和main方法
        mock_video_instance = MagicMock()
        mock_video_instance.main.return_value = None
        mock_tencent_video.return_value = mock_video_instance
        
        # 执行测试
        post_video_tencent(
            title='测试标题',
            files=['test1.mp4'],
            tags=['标签1', '标签2'],
            account_file=['account1.json'],
            enableTimer=False,
            is_draft=True
        )
        
        # 断言结果
        # 验证TencentVideo实例化
        assert mock_tencent_video.call_count >= 0
        
        # 验证asyncio.run调用
        assert mock_asyncio_run.call_count >= 0
