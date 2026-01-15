import pytest
from unittest.mock import patch, MagicMock
from src.utils.publish_executor import run_publish_task

class TestPublishExecutor:
    @patch('src.services.publish_executor.Path')
    @patch('src.services.publish_executor.task_service')
    @patch('src.services.publish_executor.post_video_DouYin')
    def test_run_publish_task_douyin_success(self, mock_douyin, mock_task_service, mock_path):
        # Mock Path to make file validation pass
        mock_path_instance = MagicMock()
        mock_path_instance.exists.return_value = True
        mock_path.return_value.__truediv__.return_value = mock_path_instance

        publish_data = {
            'type': 3,
            'title': 'Test',
            'fileList': ['f1'],
            'accountList': ['a1'],
            'thumbnail': 'thumb.jpg'
        }

        run_publish_task('task_1', publish_data)

        # Check start status
        mock_task_service.update_task_status.assert_any_call('task_1', 'uploading', 0)

        # Check uploader call
        mock_douyin.assert_called_once()
        args = mock_douyin.call_args[0]
        assert args[0] == 'Test' # title
        assert args[9] == 'thumb.jpg' # thumbnail_path (pos 9 in function def)

        # Check end status
        mock_task_service.update_task_status.assert_called_with('task_1', 'completed', 100)

    @patch('src.services.publish_executor.task_service')
    @patch('src.services.publish_executor.post_video_xhs')
    def test_run_publish_task_xhs_failure(self, mock_xhs, mock_task_service):
        mock_xhs.side_effect = Exception("Upload Failed")

        publish_data = {'type': 1, 'title': 'Test'}

        run_publish_task('task_2', publish_data)

        # Check failure status
        # Last call should be failed
        args = mock_task_service.update_task_status.call_args_list[-1]
        assert args[0][0] == 'task_2'
        assert args[0][1] == 'failed'
        assert "Upload Failed" in args[1]['error_msg']

    def test_run_publish_task_unknown_type(self):
        with patch('src.services.publish_executor.task_service') as mock_ts:
            run_publish_task('t3', {'type': 99})
            args = mock_ts.update_task_status.call_args_list[-1]
            assert args[0][1] == 'failed'
            assert "Unknown platform type" in args[1]['error_msg']
