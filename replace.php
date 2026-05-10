<?php
$file = '/var/www/html/include/plugins/rest-api/class.RestApiController.php';
$content = file_get_contents($file);

$old = <<<EOT
                "body_preview" => \$row["body_preview"] 
                        ? trim(preg_replace("/[\\\\x00-\\\\x09\\\\x0B\\\\x0C\\\\x0E-\\\\x1F\\\\x7F]/", "", preg_replace("/\\\\s+/", " ", strip_tags(html_entity_decode(mb_substr(\$row["body_preview"], 0, 300, "UTF-8"), ENT_QUOTES, "UTF-8"))))) 
                        : null,
EOT;

$new = <<<EOT
                "body_preview" => \$row["body_preview"]
                    ? mb_substr(trim(preg_replace('/[\\\\x00-\\\\x1F\\\\x7F]/', '', preg_replace('/\\\\s+/', ' ', html_entity_decode(strip_tags(\$row["body_preview"]), ENT_QUOTES | ENT_HTML5, 'UTF-8')))), 0, 300, 'UTF-8')
                    : null,
EOT;

$content = str_replace($old, $new, $content);
file_put_contents($file, $content);
echo "Done\n";
