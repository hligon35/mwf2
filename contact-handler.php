<?php
// Enable CORS for your domain (adjust as needed)
header("Access-Control-Allow-Origin: https://yourdomain.com");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Only allow POST requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

// Configuration
$to_email = "info@melawholefoodsva.com";
$from_email = "noreply@yourdomain.com"; // Use your domain
$smtp_host = "smtp.yourmailserver.com"; // Your SMTP server
$smtp_username = "your-smtp-username"; // Your SMTP username
$smtp_password = "your-smtp-password"; // Your SMTP password
$smtp_port = 587; // Usually 587 for TLS or 465 for SSL

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

// Create email content
$subject = "New Contact Form Submission - Mela Whole Foods";
$email_body = "
New contact form submission from Mela Whole Foods website:

Name: $name
Email: $email
Topic: $topic

Message:
$message

---
Submitted: " . date('Y-m-d H:i:s') . "
IP Address: " . $_SERVER['REMOTE_ADDR'] . "
";

// Email headers
$headers = [
    'From' => $from_email,
    'Reply-To' => $email,
    'X-Mailer' => 'PHP/' . phpversion(),
    'MIME-Version' => '1.0',
    'Content-Type' => 'text/plain; charset=UTF-8'
];

try {
    // Simple mail() function (works if server has sendmail configured)
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
