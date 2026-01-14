import pytest
from unittest.mock import patch, MagicMock

class TestPublishRoutes:
    def test_get_tasks(self, client):
        with patch('src.routes.publish.task_service.get_all_tasks') as mock_get:
            mock_get.return_value = [{'id': 't1', 'title': 'test'}]
            res = client.get('/tasks')
            assert res.status_code == 200
            assert res.json['data'][0]['id'] == 't1'

    def test_delete_task(self, client):
        with patch('src.routes.publish.task_service.delete_task') as mock_del:
            mock_del.return_value = True
            res = client.delete('/tasks/t1')
            assert res.status_code == 200
            assert res.json['code'] == 200

    def test_post_video_success(self, client):
        with patch('src.routes.publish.task_service.create_task') as mock_create, \
             patch('src.routes.publish.start_publish_thread') as mock_start:

            mock_create.return_value = 'task_123'

            data = {
                'title': 'Test Video',
                'type': 3,
                'fileList': ['f1.mp4'],
                'accountList': ['acc1']
            }
            res = client.post('/postVideo', json=data)

            assert res.status_code == 200
            assert res.json['data']['taskId'] == 'task_123'

            # Verify create_task args
            args = mock_create.call_args[1]
            assert args['title'] == 'Test Video'
            assert args['platforms'] == [3]

            # Verify start_thread called
            mock_start.assert_called_once_with('task_123', data)

    def test_post_video_create_fail(self, client):
        with patch('src.routes.publish.task_service.create_task') as mock_create:
            mock_create.return_value = None
            res = client.post('/postVideo', json={'title': 'Fail'})
            assert res.status_code == 500

    def test_post_video_batch(self, client):
        with patch('src.routes.publish.task_service.create_task') as mock_create, \
             patch('src.routes.publish.start_publish_thread') as mock_start:

             mock_create.side_effect = ['t1', 't2']

             data = [{'title': 'V1', 'type': 1}, {'title': 'V2', 'type': 2}]
             res = client.post('/postVideoBatch', json=data)

             assert res.status_code == 200
             assert len(res.json['data']) == 2
             assert mock_start.call_count == 2

    def test_post_video_batch_invalid(self, client):
        res = client.post('/postVideoBatch', json={"not": "list"})
        assert res.status_code == 400
