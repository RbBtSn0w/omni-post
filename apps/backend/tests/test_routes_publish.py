from unittest.mock import MagicMock, patch

import pytest


class TestPublishRoutes:
    def test_get_tasks(self, client):
        with patch("src.routes.publish.task_service.get_all_tasks") as mock_get:
            mock_get.return_value = [{"id": "t1", "title": "test"}]
            res = client.get("/tasks")
            assert res.status_code == 200
            assert res.json["data"][0]["id"] == "t1"

    def test_delete_task(self, client):
        with patch("src.routes.publish.task_service.delete_task") as mock_del:
            mock_del.return_value = True
            res = client.delete("/tasks/t1")
            assert res.status_code == 200
            assert res.json["code"] == 200

    def test_post_video_success(self, client):
        with (
            patch("src.routes.publish.task_service.create_task") as mock_create,
            patch("src.routes.publish.start_publish_thread") as mock_start,
            patch("sqlite3.connect") as mock_db,
        ):

            mock_create.return_value = "task_123"

            # Mock DB to return matching account for platform type 3
            mock_cursor = MagicMock()
            mock_cursor.fetchone.return_value = (3,)  # type matches
            mock_db.return_value.__enter__.return_value.cursor.return_value = mock_cursor

            data = {
                "title": "Test Video",
                "type": 3,
                "fileList": ["f1.mp4"],
                "accountList": ["acc1"],
            }
            res = client.post("/postVideo", json=data)

            assert res.status_code == 200
            assert res.json["data"]["taskId"] == "task_123"

            # Verify create_task args
            args = mock_create.call_args[1]
            assert args["title"] == "Test Video"
            assert args["platforms"] == [3]

            # Verify start_thread called
            mock_start.assert_called_once_with("task_123", data)

    def test_post_video_create_fail(self, client):
        with (
            patch("src.routes.publish.task_service.create_task") as mock_create,
            patch("sqlite3.connect") as mock_db,
        ):
            mock_create.return_value = None

            # Mock DB to return matching account
            mock_cursor = MagicMock()
            mock_cursor.fetchone.return_value = (3,)
            mock_db.return_value.__enter__.return_value.cursor.return_value = mock_cursor

            res = client.post(
                "/postVideo",
                json={"title": "Fail", "type": 3, "fileList": ["f1.mp4"], "accountList": ["acc1"]},
            )
            assert res.status_code == 500

    def test_post_video_batch(self, client):
        with (
            patch("src.routes.publish.task_service.create_task") as mock_create,
            patch("src.routes.publish.start_publish_thread") as mock_start,
        ):

            mock_create.side_effect = ["t1", "t2"]

            data = [{"title": "V1", "type": 1}, {"title": "V2", "type": 2}]
            res = client.post("/postVideoBatch", json=data)

            assert res.status_code == 200
            assert len(res.json["data"]) == 2
            assert mock_start.call_count == 2

    def test_post_video_batch_invalid(self, client):
        res = client.post("/postVideoBatch", json={"not": "list"})
        assert res.status_code == 400

    def test_update_task_success(self, client):
        """Test PATCH /tasks/<id> with valid status."""
        with patch("src.routes.publish.task_service.update_task_status") as mock_update:
            res = client.patch("/tasks/t1", json={"status": "completed", "progress": 100})
            assert res.status_code == 200
            assert res.json["code"] == 200
            assert res.json["msg"] == "Updated"
            mock_update.assert_called_once_with("t1", "completed", 100)

    def test_update_task_no_status(self, client):
        """Test PATCH /tasks/<id> without status returns 400."""
        res = client.patch("/tasks/t1", json={"progress": 50})
        assert res.status_code == 400
        assert res.json["code"] == 400
        assert "Status required" in res.json["msg"]

    def test_update_task_partial(self, client):
        """Test PATCH /tasks/<id> with status but no progress."""
        with patch("src.routes.publish.task_service.update_task_status") as mock_update:
            res = client.patch("/tasks/t1", json={"status": "failed"})
            assert res.status_code == 200
            mock_update.assert_called_once_with("t1", "failed", None)
