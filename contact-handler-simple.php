<?php
// Simple contact handler that works with most hosting providers
header("Access-Control-Allow-Origin: https://melawholefoodsva.com");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Only allow POST requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

// Honeypot spam protection
if (!empty($_POST['website'])) {
    http_response_code(400);
    echo json_encode(["error" => "Spam detected"]);
    exit;
}

// Validate and sanitize input
$name = filter_input(INPUT_POST, 'name', FILTER_SANITIZE_STRING);
$email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
$topic = filter_input(INPUT_POST, 'topic', FILTER_SANITIZE_STRING);
$message = filter_input(INPUT_POST, 'message', FILTER_SANITIZE_STRING);

// Validation
$errors = [];
if (empty($name)) $errors[] = "Name is required";
if (empty($email)) $errors[] = "Valid email is required";
if (empty($topic)) $errors[] = "Topic is required";
if (empty($message)) $errors[] = "Message is required";

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(["error" => "Validation failed", "details" => $errors]);
    exit;
}

// Email configuration
$to_email = "info@melawholefoodsva.com";
$subject = "New Contact Form Submission - Mela Whole Foods";

// Create email content
$email_body = "New contact form submission from Mela Whole Foods website:\n\n";
$email_body .= "Name: " . $name . "\n";
$email_body .= "Email: " . $email . "\n";
$email_body .= "Topic: " . $topic . "\n\n";
$email_body .= "Message:\n" . $message . "\n\n";
$email_body .= "---\n";
$email_body .= "Submitted: " . date('Y-m-d H:i:s') . "\n";
$email_body .= "IP Address: " . $_SERVER['REMOTE_ADDR'] . "\n";

// Email headers for better delivery
$headers = "From: Mela Website <noreply@melawholefoodsva.com>\r\n";
$headers .= "Reply-To: " . $email . "\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

try {
    // Use PHP's built-in mail function
    $success = mail($to_email, $subject, $email_body, $headers);
    
    if ($success) {
        echo json_encode(["success" => true, "message" => "Message sent successfully"]);
    } else {
        throw new Exception("Failed to send email");
    }
    
} catch (Exception $e) {
    error_log("Contact form error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Failed to send message. Please try again."]);
}
?>
