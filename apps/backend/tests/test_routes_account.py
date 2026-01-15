import pytest
import sqlite3
from unittest.mock import patch, MagicMock, AsyncMock

class TestAccountRoutes:
    @pytest.fixture(autouse=True)
    def setup_db(self, temp_db_path):
        """Setup DB Schema for accounts matching prod schema"""
        # Patch keys patches
        self.patches = [
            patch('src.routes.account.db_manager'),
            patch('src.db.createTable.db_manager')
        ]
        self.mocks = [p.start() for p in self.patches]

        for m in self.mocks:
            m.get_db_path.return_value = temp_db_path

        # Init Schema - must match production schema including new time columns
        conn = sqlite3.connect(temp_db_path)
        c = conn.cursor()
        # Drop existing table if created by createTable.py to ensure we use correct schema
        c.execute('DROP TABLE IF EXISTS user_info')
        c.execute('''
            CREATE TABLE IF NOT EXISTS user_info (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type INTEGER NOT NULL,
                filePath TEXT NOT NULL,
                userName TEXT NOT NULL,
                status INTEGER DEFAULT 0,
                group_id INTEGER,
                created_at DATETIME,
                last_validated_at DATETIME
            )
        ''')
        # Insert seed data: id=1, type=2, filePath='path', userName='TestUser', status=1
        c.execute("INSERT INTO user_info (id, type, filePath, userName, status, created_at, last_validated_at) VALUES (1, 2, '/tmp/cookie', 'TestUser', 1, '2026-01-01 00:00:00', NULL)")
        conn.commit()
        conn.close()

        yield

        for p in self.patches:
            p.stop()

    def test_get_accounts(self, client):
        res = client.get('/getAccounts')
        assert res.status_code == 200
        data = res.json['data']
        assert len(data) == 1
        # Returns list of lists
        # Index 3 is userName
        assert data[0][3] == 'TestUser'

    def test_delete_account(self, client):
        res = client.get('/deleteAccount?id=1')
        assert res.status_code == 200
        assert res.json['code'] == 200

        # Verify empty
        res = client.get('/getAccounts')
        assert len(res.json['data']) == 0

    def test_get_valid_accounts(self, client):
        # Mocks auth check
        with patch('src.services.cookie_service.DefaultCookieService.check_cookie', new_callable=AsyncMock) as mock_check:
            mock_check.return_value = True
            res = client.get('/getValidAccounts')
            assert res.status_code == 200
            data = res.json['data']
            assert len(data) == 1
            # status is index 4
            assert data[0][4] == 1

            # Check with invalid cookie
            mock_check.return_value = False
            res = client.get('/getValidAccounts')
            data = res.json['data']
            assert data[0][4] == 0
