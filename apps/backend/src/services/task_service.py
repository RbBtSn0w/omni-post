import json
import sqlite3
import uuid
from datetime import datetime

from src.db.db_manager import db_manager


class TaskService:
    def _get_conn(self):
        return sqlite3.connect(db_manager.get_db_path())

    def create_task(
        self,
        title,
        platforms,
        file_list,
        account_list,
        schedule_data,
        publish_data=None,
        priority=1,
    ):
        task_id = f"task_{int(datetime.now().timestamp())}_{str(uuid.uuid4())[:8]}"
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute(
                """
                INSERT INTO tasks (id, title, status, progress, priority, platforms, file_list, account_list, schedule_data, publish_data)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
                (
                    task_id,
                    title,
                    "waiting",  # Initial status
                    0,
                    priority,
                    json.dumps(platforms),
                    json.dumps(file_list),
                    json.dumps(account_list),
                    json.dumps(schedule_data),
                    json.dumps(publish_data) if publish_data else None,
                ),
            )
            conn.commit()
            return task_id
        except Exception as e:
            print(f"创建任务失败: {e}")
            conn.rollback()
            return None
        finally:
            conn.close()

    def update_task_status(self, task_id, status, progress=None, error_msg=None):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            updates = ["status = ?", "updated_at = CURRENT_TIMESTAMP"]
            params = [status]

            if progress is not None:
                updates.append("progress = ?")
                params.append(progress)

            if error_msg is not None:
                updates.append("error_msg = ?")
                params.append(error_msg)

            params.append(task_id)

            sql = f"UPDATE tasks SET {', '.join(updates)} WHERE id = ?"
            cursor.execute(sql, params)
            conn.commit()
        except Exception as e:
            print(f"更新任务状态失败: {e}")
        finally:
            conn.close()

    def get_all_tasks(self):
        conn = self._get_conn()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT * FROM tasks ORDER BY created_at DESC")
            rows = cursor.fetchall()
            tasks = []
            for row in rows:
                task = dict(row)
                # Parse JSON fields
                try:
                    task["platforms"] = json.loads(task["platforms"]) if task["platforms"] else []
                except:
                    pass
                try:
                    task["file_list"] = json.loads(task["file_list"]) if task["file_list"] else []
                except:
                    pass
                try:
                    task["account_list"] = (
                        json.loads(task["account_list"]) if task["account_list"] else []
                    )
                except:
                    pass
                # Parse schedule_data
                try:
                    task["schedule_data"] = (
                        json.loads(task["schedule_data"]) if task["schedule_data"] else {}
                    )
                except:
                    task["schedule_data"] = {}
                try:
                    task["publish_data"] = (
                        json.loads(task["publish_data"]) if task["publish_data"] else {}
                    )
                except:
                    task["publish_data"] = {}
                # Clean up schedule_data if needed
                tasks.append(task)
            return tasks
        finally:
            conn.close()

    def delete_task(self, task_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
            conn.commit()
            return True
        except Exception as e:
            print(f"删除任务失败: {e}")
            return False
        finally:
            conn.close()


task_service = TaskService()
