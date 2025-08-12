<?php
// Unified contact form handler for Mela Whole Foods
// Features: CORS, validation, honeypot, SMTP (PHPMailer) with fallback, JSON response, logging, rate limiting
// Place this file on your PHP server (not GitHub Pages)

// --- CONFIGURATION ---
$CONFIG = [
    'to_email'       => 'info@melawholefoodsva.com',
    'from_email'     => 'noreply@melawholefoodsva.com',
    'from_name'      => 'Mela Whole Foods Message',
    'allowed_origins'=> [
        'https://melawholefoodsva.com',
        'https://www.melawholefoodsva.com'
    ],
    'smtp' => [
        'enabled'    => true, // set false to disable SMTP
        'host'       => getenv('SMTP_HOST') ?: 'smtp.gmail.com',
        'username'   => getenv('SMTP_USERNAME') ?: 'info@melawholefoodsva.com',
        'password'   => getenv('SMTP_PASSWORD') ?: 'CHANGE_ME',
        'port'       => (int)(getenv('SMTP_PORT') ?: 587),
        'encryption' => strtolower(getenv('SMTP_ENCRYPTION') ?: 'tls') // tls|ssl
    ],
    'rate_limit' => [
        'enabled'    => true,
        'requests'   => 5,      // max submissions per window
        'per_seconds' => 300    // window size (seconds)
    ],
    'log_file' => __DIR__ . '/contact-handler.log'
];

// --- UTILITY FUNCTIONS ---
function respond(int $code, array $payload): void {
    http_response_code($code);
    echo json_encode($payload);
    exit;
}
function log_event(string $msg, array $CONFIG): void {
    $line = sprintf('[%s] %s IP=%s UA=%s'."\n", date('Y-m-d H:i:s'), $msg, $_SERVER['REMOTE_ADDR'] ?? '-', $_SERVER['HTTP_USER_AGENT'] ?? '-');
    @file_put_contents($CONFIG['log_file'], $line, FILE_APPEND | LOCK_EX);
}
function rate_limit(array $CONFIG): void {
    if (!$CONFIG['rate_limit']['enabled']) return;
    $storeFile = sys_get_temp_dir() . '/contact-handler-rate.json';
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $now = time();
    $data = [];
    $fp = @fopen($storeFile, 'c+');
    if ($fp) {
        flock($fp, LOCK_EX);
        $raw = stream_get_contents($fp);
        if ($raw) $data = json_decode($raw, true) ?: [];
        foreach ($data as $k => $timestamps) {
            $data[$k] = array_values(array_filter($timestamps, fn($t) => ($now - (int)$t) <= $CONFIG['rate_limit']['per_seconds']));
            if (!$data[$k]) unset($data[$k]);
        }
        $data[$ip] = $data[$ip] ?? [];
        if (count($data[$ip]) >= $CONFIG['rate_limit']['requests']) {
            flock($fp, LOCK_UN); fclose($fp);
            respond(429, ['error' => 'Too many requests. Please wait before trying again.']);
        }
        $data[$ip][] = $now;
        ftruncate($fp, 0); rewind($fp); fwrite($fp, json_encode($data));
        flock($fp, LOCK_UN); fclose($fp);
    }
}

// --- CORS HEADERS ---
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, $CONFIG['allowed_origins'], true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') respond(204, ['ok' => true]);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(405, ['error' => 'Method not allowed']);

// --- HONEYPOT SPAM PROTECTION ---
if (!empty($_POST['website'])) {
    log_event('Spam honeypot triggered', $CONFIG);
    respond(400, ['error' => 'Invalid submission']);
}

// --- INPUT VALIDATION ---
$fields = [
    'name'    => FILTER_SANITIZE_STRING,
    'email'   => FILTER_VALIDATE_EMAIL,
    'topic'   => FILTER_SANITIZE_STRING,
    'message' => FILTER_SANITIZE_STRING
];
$input = [];
foreach ($fields as $f => $filter) {
    $input[$f] = filter_input(INPUT_POST, $f, $filter);
}
foreach (['name','topic','message'] as $k) {
    if (is_string($input[$k])) $input[$k] = trim(preg_replace('/\s+/', ' ', $input[$k]));
}
$errors = [];
if (!$input['name']) $errors[] = 'Name is required';
if (!$input['email']) $errors[] = 'Valid email is required';
if (!$input['topic']) $errors[] = 'Topic is required';
if (!$input['message']) $errors[] = 'Message is required';
if ($input['message'] && strlen($input['message']) > 5000) $errors[] = 'Message too long';
if ($errors) {
    log_event('Validation failed: '.implode('; ', $errors), $CONFIG);
    respond(400, ['error' => 'Validation failed', 'details' => $errors]);
}

rate_limit($CONFIG);

$subject = 'New Contact Form Submission - Mela Whole Foods';
$email_body = implode("\n", [
    'New contact form submission from Mela Whole Foods website:',
    '',
    'Name: '.$input['name'],
    'Email: '.$input['email'],
    'Topic: '.$input['topic'],
    '',
    'Message:',
    $input['message'],
    '',
    '---',
    'Submitted: '.date('Y-m-d H:i:s'),
    'IP Address: '.($_SERVER['REMOTE_ADDR'] ?? 'unknown'),
    'User Agent: '.($_SERVER['HTTP_USER_AGENT'] ?? 'unknown')
]);

// --- EMAIL SENDING ---
$sent = false; $method = 'none';
if ($CONFIG['smtp']['enabled']) {
    $autoload = __DIR__ . '/vendor/autoload.php';
    if (is_file($autoload)) {
        require_once $autoload;
        if (class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
            $method = 'phpmailer';
            try {
                $mail = new PHPMailer\PHPMailer\PHPMailer(true);
                $mail->isSMTP();
                $mail->Host = $CONFIG['smtp']['host'];
                $mail->SMTPAuth = true;
                $mail->Username = $CONFIG['smtp']['username'];
                $mail->Password = $CONFIG['smtp']['password'];
                $mail->SMTPSecure = ($CONFIG['smtp']['encryption'] === 'ssl') ? PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS : PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
                $mail->Port = $CONFIG['smtp']['port'];
                $mail->setFrom($CONFIG['from_email'], $CONFIG['from_name']);
                $mail->addAddress($CONFIG['to_email']);
                $mail->addReplyTo($input['email'], $input['name']);
                $mail->isHTML(false);
                $mail->Subject = $subject;
                $mail->Body = $email_body;
                $mail->send();
                $sent = true;
            } catch (Throwable $e) {
                log_event('PHPMailer failed: '.$e->getMessage(), $CONFIG);
            }
        }
    }
}
if (!$sent) {
    $method = 'mail() fallback';
    $headers = [
        'From: '.$CONFIG['from_name'].' <'.$CONFIG['from_email'].'>',
        'Reply-To: '.$input['email'],
        'X-Mailer: PHP/'.phpversion(),
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8'
    ];
    $sent = @mail($CONFIG['to_email'], $subject, $email_body, implode("\r\n", $headers));
}
if ($sent) {
    log_event('Email sent via '.$method, $CONFIG);
    respond(200, ['success' => true, 'message' => 'Message sent successfully']);
}
log_event('Email send failure (both methods)', $CONFIG);
respond(500, ['error' => 'Failed to send message. Please try again.']);
?>
