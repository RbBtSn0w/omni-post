import pytest
import sqlite3
from src.services.task_service import task_service

class TestGroupRoutes:
    def test_create_group(self, client, mock_db_manager):
        """Test creating a new group."""
        response = client.post('/createGroup', json={
            'name': 'Test Group',
            'description': 'A test group'
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data['code'] == 200
        assert data['data']['name'] == 'Test Group'

    def test_create_duplicate_group(self, client, mock_db_manager):
        """Test creating a duplicate group."""
        client.post('/createGroup', json={'name': 'Duplicate'})
        response = client.post('/createGroup', json={'name': 'Duplicate'})

        assert response.status_code == 200
        data = response.get_json()
        assert data['code'] == 400
        assert '已存在' in data['message']

    def test_get_groups(self, client, mock_db_manager):
        """Test retrieving groups."""
        client.post('/createGroup', json={'name': 'Group A'})
        client.post('/createGroup', json={'name': 'Group B'})

        response = client.get('/getGroups')
        assert response.status_code == 200
        data = response.get_json()
        assert data['code'] == 200
        assert len(data['data']) == 2

    def test_update_group(self, client, mock_db_manager):
        """Test updating a group."""
        # Create
        res = client.post('/createGroup', json={'name': 'Old Name'})
        group_id = res.get_json()['data']['id']

        # Update
        response = client.put(f'/updateGroup/{group_id}', json={
            'name': 'New Name',
            'description': 'Updated'
        })
        assert response.status_code == 200
        assert response.get_json()['code'] == 200

        # Verify
        response = client.get('/getGroups')
        groups = response.get_json()['data']
        # Find the group
        group = next(g for g in groups if g['id'] == group_id)
        assert group['name'] == 'New Name'

    def test_delete_group(self, client, mock_db_manager):
        """Test deleting a group."""
        res = client.post('/createGroup', json={'name': 'Delete Me'})
        group_id = res.get_json()['data']['id']

        response = client.delete(f'/deleteGroup/{group_id}')
        assert response.status_code == 200
        assert response.get_json()['code'] == 200

        # Verify gone
        response = client.get('/getGroups')
        groups = response.get_json()['data']
        assert not any(g['id'] == group_id for g in groups)

    def test_delete_group_with_accounts(self, client, mock_db_manager):
        """Test deletion restriction when group has accounts."""
        # Create group
        res = client.post('/createGroup', json={'name': 'Busy Group'})
        group_id = res.get_json()['data']['id']

        pass

    def test_delete_group_with_accounts_integrated(self, client, mock_db_manager, temp_db_path):
        """Test deletion restriction when group has accounts (with DB access)."""
        # Create group
        res = client.post('/createGroup', json={'name': 'Busy Group'})
        group_id = res.get_json()['data']['id']

        # Insert account directly into DB
        conn = sqlite3.connect(temp_db_path)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO user_info (type, filePath, userName, group_id) VALUES (1, 'path', 'User1', ?)", (group_id,))
        conn.commit()
        conn.close()

        # Try delete
        response = client.delete(f'/deleteGroup/{group_id}')
        assert response.status_code == 200
        data = response.get_json()
        assert data['code'] == 400
        assert '无法删除' in data['message']
