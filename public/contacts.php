<?php
require_once('sqlite.php');

$uri = trim($_SERVER['REQUEST_URI'], '/');

if (isset($uri)) {
    @list($page, $id) = explode('/', $uri);

    if ($page == "contacts") {
        $contacts = new SQLite('contacts.db');

        /* GET request */
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            try {
                $data = $contacts->getUserContacts($id);
                echo json_encode([
                    'status' => 'success',
                    'data' => $data
                ]);
            } catch (Exception $e) {
                echo json_encode([
                    'status' => 'error',
                    'message' => $e->getMessage()
                ]);
            }
        }

        /* POST request */
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $fields = $data['contacts'];

            try {
                $contacts->saveUserContacts($id, $fields);
                echo json_encode([
                    'status' => 'success'
                ]);
            } catch (Exception $e) {
                echo json_encode([
                    'status' => 'error',
                    'message' => $e->getMessage()
                ]);
            }
        }
    }
}