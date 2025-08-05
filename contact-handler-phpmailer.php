<?php
require_once 'vendor/autoload.php'; // You'll need to install PHPMailer via Composer

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Enable CORS for your domain
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

// Configuration - UPDATE THESE VALUES
$config = [
    'to_email' => 'info@melawholefoodsva.com',
    'from_email' => 'noreply@yourdomain.com',
    'from_name' => 'Mela Whole Foods Website',
    'smtp_host' => 'smtp.yourmailserver.com', // e.g., smtp.gmail.com, mail.yourdomain.com
    'smtp_username' => 'your-smtp-username',
    'smtp_password' => 'your-smtp-password',
    'smtp_port' => 587, // 587 for TLS, 465 for SSL
    'smtp_secure' => PHPMailer::ENCRYPTION_STARTTLS // or PHPMailer::ENCRYPTION_SMTPS for SSL
];

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

// Create PHPMailer instance
$mail = new PHPMailer(true);

try {
    // Server settings
    $mail->isSMTP();
    $mail->Host = $config['smtp_host'];
    $mail->SMTPAuth = true;
    $mail->Username = $config['smtp_username'];
    $mail->Password = $config['smtp_password'];
    $mail->SMTPSecure = $config['smtp_secure'];
    $mail->Port = $config['smtp_port'];

    // Recipients
    $mail->setFrom($config['from_email'], $config['from_name']);
    $mail->addAddress($config['to_email']);
    $mail->addReplyTo($email, $name);

    // Content
    $mail->isHTML(false);
    $mail->Subject = "New Contact Form Submission - Mela Whole Foods";
    $mail->Body = "
New contact form submission from Mela Whole Foods website:

Name: $name
Email: $email
Topic: $topic

Message:
$message

---
Submitted: " . date('Y-m-d H:i:s') . "
IP Address: " . $_SERVER['REMOTE_ADDR'] . "
User Agent: " . $_SERVER['HTTP_USER_AGENT'] . "
";

    $mail->send();
    echo json_encode(["success" => true, "message" => "Message sent successfully"]);

} catch (Exception $e) {
    error_log("Contact form error: " . $mail->ErrorInfo);
    http_response_code(500);
    echo json_encode(["error" => "Failed to send message. Please try again."]);
}
?>
