<?php
// Security Check
if (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || $_SERVER['HTTP_X_REQUESTED_WITH'] !== 'XMLHttpRequest') {
    header('HTTP/1.0 403 Forbidden');
    echo "<h1>403 Forbidden - Direct access is not allowed!</h1>";
    exit;
}

include 'db_connect.php';

// JS se receive kiya hua data parhna
$data = json_decode(file_get_contents('php://input'), true);

if (isset($data['username']) && isset($data['score'])) {
    $username = trim($data['username']);
    if ($username === '') {
        $username = 'Anonymous';
    }
    $username = substr($username, 0, 20); // limit length
    $username = $conn->real_escape_string($username);
    $score = intval($data['score']);

    // Score insert karna
    $insert_sql = "INSERT INTO leaderboard (username, score) VALUES ('$username', $score)";
    $conn->query($insert_sql);
}

// Top 5 High Scorers nikalna
$leaderboard_sql = "SELECT username, score FROM leaderboard ORDER BY score DESC, date_played ASC LIMIT 5";
$result = $conn->query($leaderboard_sql);

$leaderboard = [];
if ($result) {
    while($row = $result->fetch_assoc()) {
        $leaderboard[] = $row;
    }
}

header('Content-Type: application/json');
echo json_encode($leaderboard);
?>
