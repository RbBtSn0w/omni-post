#!/usr/bin/env python3
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta

from src.utils.files_times import (
    get_absolute_path,
    get_title_and_hashtags,
    generate_schedule_time_next_day
)

class TestFilesTimes:
    """测试文件和时间相关功能"""
    
    def test_get_absolute_path(self):
        """测试获取绝对路径功能"""
        with patch('src.utils.files_times.BASE_DIR', '/test/base'):
            # 执行测试
            result = get_absolute_path('relative/path', 'subdir')

            # 断言结果
            assert result == '/test/base/subdir/relative/path'
    
    @patch('builtins.open', new_callable=MagicMock)
    def test_get_title_and_hashtags(self, mock_open):
        """测试获取标题和标签功能"""
        # 配置模拟文件内容
        mock_file = MagicMock()
        mock_file.read.return_value = '测试标题\n#标签1 #标签2 #标签3'
        mock_open.return_value.__enter__.return_value = mock_file
        
        # 执行测试
        title, hashtags = get_title_and_hashtags('test_video.mp4')
        
        # 断言结果
        assert title == '测试标题'
        assert hashtags == ['标签1', '标签2', '标签3']
        mock_open.assert_called_once_with('test_video.txt', 'r', encoding='utf-8')
    
    def test_generate_schedule_time_next_day_basic(self):
        """测试生成基本的上传时间表"""
        # 执行测试
        result = generate_schedule_time_next_day(3, 1, [10], timestamps=False)
        
        # 断言结果
        assert len(result) == 3
        assert all(isinstance(item, datetime) for item in result)
        
        # 检查日期是否连续
        for i in range(1, 3):
            day_diff = (result[i] - result[i-1]).days
            assert day_diff == 1
    
    def test_generate_schedule_time_next_day_with_timestamps(self):
        """测试生成带时间戳的上传时间表"""
        # 执行测试
        result = generate_schedule_time_next_day(3, 1, [10], timestamps=True)
        
        # 断言结果
        assert len(result) == 3
        assert all(isinstance(item, int) for item in result)
        
        # 检查时间戳是否按顺序递增
        assert result[0] < result[1] < result[2]
    
    def test_generate_schedule_time_next_day_with_daily_times(self):
        """测试使用自定义每日时间的上传时间表"""
        # 执行测试
        daily_times = [9, 14, 18]
        result = generate_schedule_time_next_day(5, 2, daily_times, timestamps=False)
        
        # 断言结果
        assert len(result) == 5
        
        # 检查前两个视频是否在同一天不同时间
        day1 = result[0].date()
        day2 = result[1].date()
        day3 = result[2].date()
        
        assert day1 == day2  # 第一天上传两个视频
        assert day3 > day2   # 第二天上传第三个视频
        
        # 检查时间是否符合指定的每日时间
        assert result[0].hour == daily_times[0]
        assert result[1].hour == daily_times[1]
        assert result[2].hour == daily_times[0]
    
    def test_generate_schedule_time_next_day_with_start_days(self):
        """测试从指定天数后开始的上传时间表"""
        # 执行测试
        start_days = 2
        result = generate_schedule_time_next_day(2, 1, [10], timestamps=False, start_days=start_days)
        
        # 断言结果
        assert len(result) == 2
        
        # 检查日期是否从指定天数后开始
        expected_start_date = datetime.now().date() + timedelta(days=start_days + 1)
        assert result[0].date() == expected_start_date
    
    def test_generate_schedule_time_next_day_invalid_videos_per_day(self):
        """测试无效的每日视频数量"""
        # 测试视频数量为0
        with pytest.raises(ValueError, match="videos_per_day should be a positive integer"):
            generate_schedule_time_next_day(3, 0, [10])
        
        # 测试视频数量为负数
        with pytest.raises(ValueError, match="videos_per_day should be a positive integer"):
            generate_schedule_time_next_day(3, -1, [10])
    
    def test_generate_schedule_time_next_day_exceed_daily_times(self):
        """测试每日视频数量超过每日时间数量"""
        # 每日时间只有2个，但要上传3个视频
        with pytest.raises(ValueError, match="videos_per_day should not exceed the length of daily_times"):
            generate_schedule_time_next_day(3, 3, [10, 14])
    
    def test_generate_schedule_time_next_day_zero_videos(self):
        """测试生成0个视频的时间表"""
        # 执行测试
        result = generate_schedule_time_next_day(0, 1, [10])
        
        # 断言结果
        assert len(result) == 0
