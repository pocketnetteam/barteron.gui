<?php
class SQLite {
    private $pdo;

    public function __construct($dbFile) {
        $this->pdo = new PDO("sqlite:" . $dbFile);
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    public function migrate() {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uid TEXT NOT NULL UNIQUE
            );

            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                value TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_unique ON contacts (user_id, type, value);
        ");
    }

    function getUserIdByUid($uid) {
        $request = $this->pdo->prepare("SELECT id FROM users WHERE uid = :uid");
        $request->execute(['uid' => $uid]);

        return $request->fetchColumn();
    }

    function getUserContacts($uid) {
        $userId = $this->getUserIdByUid($uid);

        if (!$userId) {
            return [];
        }
    
        $request = $this->pdo->prepare("SELECT type, value FROM contacts WHERE user_id = :user_id");
        $request->execute(['user_id' => $userId]);

        return $request->fetchAll(PDO::FETCH_ASSOC);
    }

    function saveUserContacts($uid, $contacts) {
        $userId = $this->getUserIdByUid($uid);
    
        if (!$userId) {
            throw new Exception("User with UID $uid not found.");
        }
    
        $this->pdo->beginTransaction();

        try {
            $request = $this->pdo->prepare("DELETE FROM contacts WHERE user_id = :user_id");
            $request->execute(['user_id' => $userId]);
    
            $request = $this->pdo->prepare("INSERT INTO contacts (user_id, type, value) VALUES (:user_id, :type, :value)");
            foreach ($contacts as $contact) {
                $request->execute([
                    'user_id' => $userId,
                    'type' => $contact['type'],
                    'value' => $contact['value']
                ]);
            }
    
            $this->pdo->commit();
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
}