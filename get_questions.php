<?php
// Security Check: Direct browser access ko block karne ke liye
if (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || $_SERVER['HTTP_X_REQUESTED_WITH'] !== 'XMLHttpRequest') {
    header('HTTP/1.0 403 Forbidden');
    echo "<h1>403 Forbidden - Direct access is not allowed, yawr!</h1>";
    exit;
}

include 'db_connect.php';

// Random 15 questions fetch karna
$sql = "SELECT * FROM quiz_questions ORDER BY RAND() LIMIT 15";
$result = $conn->query($sql);

$questions = [];

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $questions[] = [
            'question' => $row['question_text'],
            'a' => $row['option_a'],
            'b' => $row['option_b'],
            'c' => $row['option_c'],
            'd' => $row['option_d'],
            'correct' => $row['correct_option']
        ];
    }
}

header('Content-Type: application/json');
echo json_encode($questions);
?>
