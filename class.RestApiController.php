<?php
/*
 * REST API Controller for osTicket
 * Routes: GET/POST/DELETE /api/http.php/rest/...
 */

require_once INCLUDE_DIR . 'class.api.php';
require_once INCLUDE_DIR . 'class.ticket.php';
require_once INCLUDE_DIR . 'class.dept.php';
require_once INCLUDE_DIR . 'class.staff.php';
require_once INCLUDE_DIR . 'class.user.php';
require_once INCLUDE_DIR . 'class.thread.php';
require_once INCLUDE_DIR . 'class.task.php';
require_once INCLUDE_DIR . 'class.organization.php';
require_once INCLUDE_DIR . 'class.file.php';
require_once INCLUDE_DIR . 'class.filter.php';

class RestApiController extends ApiController {

    // ==================== AUTH ====================
    private function auth() {
        if (!RestApiPlugin::cfg("enabled")) {
            $this->json(array("error" => "Plugin disabled"), 503);
            return false;
        }
        $expected = RestApiPlugin::cfg("api_key");
        $provided = @$_SERVER["HTTP_X_API_KEY"] ?: "";
        if (!$expected || $provided !== $expected) {
            $this->json(array("error" => "Invalid API key"), 401);
            return false;
        }
        return true;
    }

    private function json($data, $code = 200) {
        $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE | JSON_PARTIAL_OUTPUT_ON_ERROR);
        if ($json === false) {
            $json = json_encode(array("error" => "JSON encoding error: " . json_last_error_msg()));
        }
        Http::response($code, $json, "application/json; charset=utf-8");
    }

    private function input() {
        $json = file_get_contents("php://input");
        return json_decode($json, true) ?: array();
    }

    /**
     * Build $vars['attachments'] from a JSON `attachments` array of
     * `{name, type, data}` objects (data = base64). osTicket's ThreadEntry::add
     * picks up $vars['attachments'] and creates AttachmentFile + links them
     * to the new entry automatically (see class.thread.php / class.file.php).
     * Returns an array suitable for $vars['attachments'] (possibly empty).
     */
    private function buildAttachmentVars($input) {
        $out = array();
        if (empty($input) || !is_array($input)) return $out;
        foreach ($input as $a) {
            if (!is_array($a)) continue;
            $name = isset($a["name"]) ? (string) $a["name"] : "";
            $data = isset($a["data"]) ? (string) $a["data"] : "";
            if ($name === "" || $data === "") continue;
            $out[] = array(
                "name" => $name,
                "type" => isset($a["type"]) && $a["type"] ? (string) $a["type"] : "application/octet-stream",
                "data" => $data,
                "encoding" => "base64",
            );
        }
        return $out;
    }

    private function getStaff() {
        $staffId = (int) RestApiPlugin::cfg("staff_id") ?: 1;
        return Staff::lookup($staffId);
    }

    // ==================== ROUTING ====================
    function dispatch($path = "") {
        $method = $_SERVER["REQUEST_METHOD"];
        switch ($method) {
            case "GET": return $this->handleGet($path);
            case "POST": return $this->handlePost($path);
            case "DELETE": return $this->handleDelete($path);
            default: $this->json(array("error" => "Method not allowed"), 405);
        }
    }

    function handleGet($path = "") {
        $path = trim($path, "/");
        $parts = $path ? explode("/", $path) : array();

        // GET /rest/files/:id (public - no auth needed for img tags)
        if ($parts[0] === "files" && count($parts) === 2 && is_numeric($parts[1]))
            return $this->serveFile((int) $parts[1]);

        if (!$this->auth()) return;

        // GET /rest/tickets
        if (!$parts || $parts[0] === "tickets" && count($parts) === 1)
            return $this->listTickets();
        // GET /rest/tickets/:id
        if ($parts[0] === "tickets" && count($parts) === 2 && is_numeric($parts[1]))
            return $this->getTicket((int) $parts[1]);
        // GET /rest/agents
        if ($parts[0] === "agents")
            return $this->listAgents();
        // GET /rest/departments
        if ($parts[0] === "departments")
            return $this->listDepartments();
        // GET /rest/topics
        if ($parts[0] === "topics")
            return $this->listTopics();
        // GET /rest/filters
        if ($parts[0] === "filters" && count($parts) === 1)
            return $this->listFilters();
        // GET /rest/filters/:id
        if ($parts[0] === "filters" && count($parts) === 2 && is_numeric($parts[1]))
            return $this->getFilter((int) $parts[1]);
        // GET /rest/users?q=...
        if ($parts[0] === "users" && count($parts) === 1)
            return $this->searchUsers();
        // GET /rest/users/:id
        if ($parts[0] === "users" && count($parts) === 2 && is_numeric($parts[1]))
            return $this->getUser((int) $parts[1]);
        // GET /rest/stats
        if ($parts[0] === "stats")
            return $this->getStats();
        // GET /rest/queue-counts
        if ($parts[0] === "queue-counts")
            return $this->getQueueCounts();
        // GET /rest/tasks
        if ($parts[0] === "tasks" && count($parts) === 1)
            return $this->listTasks();
        // GET /rest/tasks/:id
        if ($parts[0] === "tasks" && count($parts) === 2 && is_numeric($parts[1]))
            return $this->getTask((int) $parts[1]);
        // GET /rest/organizations
        if ($parts[0] === "organizations" && count($parts) === 1)
            return $this->listOrganizations();
        // GET /rest/organizations/:id
        if ($parts[0] === "organizations" && count($parts) === 2 && is_numeric($parts[1]))
            return $this->getOrganization((int) $parts[1]);
        // GET /rest/tickets/:id/attachments
        if ($parts[0] === "tickets" && count($parts) === 3 && is_numeric($parts[1]) && $parts[2] === "attachments")
            return $this->listAttachments((int) $parts[1]);
        // GET /rest/tickets/:id/collaborators
        if ($parts[0] === "tickets" && count($parts) === 3 && is_numeric($parts[1]) && $parts[2] === "collaborators")
            return $this->listCollaborators((int) $parts[1]);
        // GET /rest/tickets/:id/events
        if ($parts[0] === "tickets" && count($parts) === 3 && is_numeric($parts[1]) && $parts[2] === "events")
            return $this->listTicketEvents((int) $parts[1]);
        // GET /rest/file/:fileId
        if ($parts[0] === "file" && count($parts) === 2 && is_numeric($parts[1]))
            return $this->getFile((int) $parts[1]);
        // GET /rest/canned
        if ($parts[0] === "canned" && count($parts) === 1)
            return $this->listCannedResponses();
        // GET /rest/slas
        if ($parts[0] === "slas" && count($parts) === 1)
            return $this->listSLAs();
        // GET /rest/ping
        if ($parts[0] === "ping")
            return $this->json(array("pong" => true, "version" => "1.0.0"));

        $this->json(array("error" => "Not found: GET /rest/{$path}"), 404);
    }

    function handlePost($path = "") {
        $path = trim($path, "/");
        $parts = $path ? explode("/", $path) : array();
        $data = $this->input();

        // POST /rest/login (no auth required)
        if ($parts[0] === "login" && count($parts) === 1)
            return $this->login($data);

        if (!$this->auth()) return;

        // POST /rest/tickets (create)
        if ($parts[0] === "tickets" && count($parts) === 1)
            return $this->createTicket($data);
        // POST /rest/tickets/search
        if ($parts[0] === "tickets" && count($parts) === 2 && $parts[1] === "search")
            return $this->searchTickets($data);

        // POST /rest/tickets/bulk/status
        if ($parts[0] === "tickets" && count($parts) === 3 && $parts[1] === "bulk" && $parts[2] === "status")
            return $this->bulkStatus($data);
        // POST /rest/tickets/bulk/assign
        if ($parts[0] === "tickets" && count($parts) === 3 && $parts[1] === "bulk" && $parts[2] === "assign")
            return $this->bulkAssign($data);
        // POST /rest/tickets/bulk/delete
        if ($parts[0] === "tickets" && count($parts) === 3 && $parts[1] === "bulk" && $parts[2] === "delete")
            return $this->bulkDelete($data);
        // POST /rest/tickets/:id/reply
        if ($parts[0] === "tickets" && count($parts) === 3 && is_numeric($parts[1]) && $parts[2] === "reply")
            return $this->replyTicket((int) $parts[1], $data);
        // POST /rest/tickets/:id/note
        if ($parts[0] === "tickets" && count($parts) === 3 && is_numeric($parts[1]) && $parts[2] === "note")
            return $this->addNote((int) $parts[1], $data);
        // POST /rest/tickets/:id/assign
        if ($parts[0] === "tickets" && count($parts) === 3 && is_numeric($parts[1]) && $parts[2] === "assign")
            return $this->assignTicket((int) $parts[1], $data);
        // POST /rest/tickets/:id/transfer
        if ($parts[0] === "tickets" && count($parts) === 3 && is_numeric($parts[1]) && $parts[2] === "transfer")
            return $this->transferTicket((int) $parts[1], $data);
        // POST /rest/tickets/:id/status
        if ($parts[0] === "tickets" && count($parts) === 3 && is_numeric($parts[1]) && $parts[2] === "status")
            return $this->changeStatus((int) $parts[1], $data);
        // POST /rest/tickets/:id/claim
        if ($parts[0] === "tickets" && count($parts) === 3 && is_numeric($parts[1]) && $parts[2] === "claim")
            return $this->claimTicket((int) $parts[1]);
        // POST /rest/tickets/:id/mark
        if ($parts[0] === "tickets" && count($parts) === 3 && is_numeric($parts[1]) && $parts[2] === "mark")
            return $this->markTicket((int) $parts[1], $data);
        // POST /rest/tickets/:id/merge
        if ($parts[0] === "tickets" && count($parts) === 3 && is_numeric($parts[1]) && $parts[2] === "merge")
            return $this->mergeTickets((int) $parts[1], $data);
        // POST /rest/tickets/:id/edit
        if ($parts[0] === "tickets" && count($parts) === 3 && is_numeric($parts[1]) && $parts[2] === "edit")
            return $this->editTicket((int) $parts[1], $data);
        // POST /rest/users (create)
        if ($parts[0] === "users" && count($parts) === 1)
            return $this->createUser($data);
        // POST /rest/users/:id (update)
        if ($parts[0] === "users" && count($parts) === 2 && is_numeric($parts[1]))
            return $this->updateUser((int) $parts[1], $data);
        // POST /rest/tasks (create)
        if ($parts[0] === "tasks" && count($parts) === 1)
            return $this->createTask($data);
        // POST /rest/tasks/:id/note
        if ($parts[0] === "tasks" && count($parts) === 3 && is_numeric($parts[1]) && $parts[2] === "note")
            return $this->addTaskNote((int) $parts[1], $data);
        // POST /rest/tasks/:id/assign
        if ($parts[0] === "tasks" && count($parts) === 3 && is_numeric($parts[1]) && $parts[2] === "assign")
            return $this->assignTask((int) $parts[1], $data);
        // POST /rest/tasks/:id/transfer
        if ($parts[0] === "tasks" && count($parts) === 3 && is_numeric($parts[1]) && $parts[2] === "transfer")
            return $this->transferTask((int) $parts[1], $data);
        // POST /rest/tasks/:id/close
        if ($parts[0] === "tasks" && count($parts) === 3 && is_numeric($parts[1]) && $parts[2] === "close")
            return $this->closeTask((int) $parts[1]);
        // POST /rest/tasks/:id/reopen
        if ($parts[0] === "tasks" && count($parts) === 3 && is_numeric($parts[1]) && $parts[2] === "reopen")
            return $this->reopenTask((int) $parts[1]);
        // POST /rest/organizations (create)
        if ($parts[0] === "organizations" && count($parts) === 1)
            return $this->createOrganization($data);
        // POST /rest/tickets/:id/collaborators
        if ($parts[0] === "tickets" && count($parts) === 3 && is_numeric($parts[1]) && $parts[2] === "collaborators")
            return $this->addCollaborator((int) $parts[1], $data);
        // POST /rest/topics (create)
        if ($parts[0] === "topics" && count($parts) === 1)
            return $this->createTopic($data);
        // POST /rest/topics/:id (edit)
        if ($parts[0] === "topics" && count($parts) === 2 && is_numeric($parts[1]))
            return $this->editTopic((int) $parts[1], $data);
        // POST /rest/filters (create)
        if ($parts[0] === "filters" && count($parts) === 1)
            return $this->createFilter($data);
        // POST /rest/filters/:id (edit)
        if ($parts[0] === "filters" && count($parts) === 2 && is_numeric($parts[1]))
            return $this->editFilter((int) $parts[1], $data);

        $this->json(array("error" => "Not found: POST /rest/{$path}"), 404);
    }

    function handleDelete($path = "") {
        if (!$this->auth()) return;
        $path = trim($path, "/");
        $parts = $path ? explode("/", $path) : array();

        // DELETE /rest/tickets/:id
        if ($parts[0] === "tickets" && count($parts) === 2 && is_numeric($parts[1]))
            return $this->deleteTicket((int) $parts[1]);
        // DELETE /rest/users/:id
        if ($parts[0] === "users" && count($parts) === 2 && is_numeric($parts[1]))
            return $this->deleteUser((int) $parts[1]);
        // DELETE /rest/organizations/:id
        if ($parts[0] === "organizations" && count($parts) === 2 && is_numeric($parts[1]))
            return $this->deleteOrganization((int) $parts[1]);
        // DELETE /rest/tickets/:id/collaborators/:userId
        if ($parts[0] === "tickets" && count($parts) === 4 && is_numeric($parts[1]) && $parts[2] === "collaborators" && is_numeric($parts[3]))
            return $this->removeCollaborator((int) $parts[1], (int) $parts[3]);
        // DELETE /rest/topics/:id
        if ($parts[0] === "topics" && count($parts) === 2 && is_numeric($parts[1]))
            return $this->deleteTopic((int) $parts[1]);
        // DELETE /rest/filters/:id
        if ($parts[0] === "filters" && count($parts) === 2 && is_numeric($parts[1]))
            return $this->deleteFilter((int) $parts[1]);

        $this->json(array("error" => "Not found: DELETE /rest/{$path}"), 404);
    }

    // ==================== TICKETS ====================

    private function login($data) {
        $username = @$data["username"] ?: "";
        $password = @$data["password"] ?: "";

        if (!$username || !$password) {
            return $this->json(array("error" => "Usuario y contraseña requeridos"), 400);
        }

        $u = db_real_escape($username);
        $sql = "SELECT staff_id, firstname, lastname, email, username, passwd FROM " . TABLE_PREFIX . "staff WHERE username='" . $u . "' OR email='" . $u . "'";
        $res = db_query($sql);
        $row = db_fetch_array($res);

        if (!$row) {
            return $this->json(array("error" => "Credenciales inválidas"), 401);
        }

        require_once INCLUDE_DIR . "class.passwd.php";
        if (!Passwd::cmp($password, $row["passwd"])) {
            return $this->json(array("error" => "Credenciales inválidas"), 401);
        }

        return $this->json(array(
            "data" => array(
                "staff_id" => (int) $row["staff_id"],
                "name" => trim($row["firstname"] . " " . $row["lastname"]),
                "firstname" => $row["firstname"],
                "lastname" => $row["lastname"],
                "email" => $row["email"],
                "username" => $row["username"],
                "api_key" => RestApiPlugin::cfg("api_key"),
                "message" => "Login exitoso",
            )
        ));
    }

    private function serveFile($fileId) {
        $sql = "SELECT type, bk, `key`, name, size FROM " . FILE_TABLE . " WHERE id = " . (int) $fileId;
        $res = db_query($sql);
        $row = db_fetch_array($res);
        if (!$row) {
            return $this->json(array("error" => "Archivo no encontrado"), 404);
        }
        $content = "";
        if ($row["bk"] === "D") {
            $chunks = db_query("SELECT filedata FROM " . TABLE_PREFIX . "file_chunk WHERE file_id = " . (int) $fileId . " ORDER BY chunk_id");
            while ($chunk = db_fetch_array($chunks)) {
                $content .= $chunk["filedata"];
            }
        } else {
            $path = rtrim(ATTACHMENT_DIR, "/") . "/" . $row["key"] . "_" . $row["signature"];
            if (file_exists($path)) $content = file_get_contents($path);
        }
        if (empty($content)) return $this->json(array("error" => "Contenido no disponible"), 404);
        header("Content-Type: " . $row["type"]);
        header("Content-Length: " . strlen($content));
        header("Cache-Control: public, max-age=86400");
        echo $content;
        exit;
    }

    private function listTickets() {
        $queue = @$_GET["queue"] ?: "open";
        $status = @$_GET["status"] ?: "open";
        $page = max(1, (int) (@$_GET["page"] ?: 1));
        $limit = min(100, max(1, (int) (@$_GET["limit"] ?: 25)));
        $offset = ($page - 1) * $limit;

        $statusMap = array("open" => 1, "resolved" => 2, "closed" => 3, "archived" => 4, "deleted" => 5);
        $statusId = isset($statusMap[$status]) ? $statusMap[$status] : 1;

        $where = "t.status_id = " . (int) $statusId;
        if ($status === "all") $where = "1=1";

        // Filter by logged-in agent for "my" queue
        if ($queue === "my") {
            $staffId = (int) RestApiPlugin::cfg("staff_id");
            if ($staffId) $where .= " AND t.staff_id = " . $staffId;
        }

        // Advanced filtering
        if (@$_GET["dept_id"]) $where .= " AND t.dept_id = " . (int) $_GET["dept_id"];
        if (@$_GET["staff_id"]) $where .= " AND t.staff_id = " . (int) $_GET["staff_id"];
        if (@$_GET["from_date"]) $where .= " AND t.created >= '" . db_real_escape($_GET["from_date"]) . "'";
        if (@$_GET["to_date"]) $where .= " AND t.created <= '" . db_real_escape($_GET["to_date"]) . " 23:59:59'";
        if (@$_GET["priority"]) $where .= " AND c.priority = '" . db_real_escape($_GET["priority"]) . "'";
        if (isset($_GET["overdue"]) && $_GET["overdue"] !== "") $where .= " AND t.isoverdue = " . ($_GET["overdue"] ? 1 : 0);
        if (@$_GET["topic_name"]) $where .= " AND ht.topic = '" . db_real_escape($_GET["topic_name"]) . "'";

        $countSql = "SELECT COUNT(*) as cnt FROM " . TICKET_TABLE . " t WHERE {$where}";
        $r = db_fetch_array(db_query($countSql));
        $total = (int) $r["cnt"];

        $sql = "SELECT t.ticket_id, t.number, t.dept_id, t.staff_id, t.team_id,
                    t.user_id, t.status_id, t.source, t.isoverdue, t.isanswered,
                    t.created, t.updated, t.closed, t.lastupdate,
                    c.subject, c.priority, te_preview.body as body_preview,
                    u.name as user_name,
                    s.firstname as staff_first, s.lastname as staff_last,
                    d.name as dept_name,
                    st.name as status_name,
                    ht.topic as topic_name
                FROM " . TICKET_TABLE . " t
                LEFT JOIN " . TABLE_PREFIX . "ticket__cdata c ON c.ticket_id = t.ticket_id
                LEFT JOIN " . TABLE_PREFIX . "user u ON u.id = t.user_id
                LEFT JOIN " . TABLE_PREFIX . "staff s ON s.staff_id = t.staff_id
                LEFT JOIN " . TABLE_PREFIX . "department d ON d.id = t.dept_id
                LEFT JOIN " . TABLE_PREFIX . "ticket_status st ON st.id = t.status_id
                LEFT JOIN " . TABLE_PREFIX . "thread th_pv ON th_pv.object_type = 'T' AND th_pv.object_id = t.ticket_id
                LEFT JOIN " . TABLE_PREFIX . "thread_entry te_preview ON te_preview.thread_id = th_pv.id
                    AND te_preview.id = (SELECT MIN(te2.id) FROM " . TABLE_PREFIX . "thread_entry te2 WHERE te2.thread_id = th_pv.id)
                LEFT JOIN " . TABLE_PREFIX . "help_topic ht ON ht.topic_id = t.topic_id
                WHERE {$where}
                ORDER BY t.lastupdate DESC
                LIMIT {$limit} OFFSET {$offset}";

        $tickets = array();
        $res = db_query($sql);
        while ($row = db_fetch_array($res)) {
            $tickets[] = array(
                "id" => (int) $row["ticket_id"],
                "number" => $row["number"],
                "subject" => $row["subject"],
                "user" => $row["user_name"],
                "status" => $row["status_name"],
                "priority" => $row["priority"],
                "department" => $row["dept_name"],
                "assignee" => $row["staff_first"] ? trim($row["staff_first"] . " " . $row["staff_last"]) : null,
                "source" => $row["source"],
                "topic" => $row["topic_name"],
                "overdue" => (bool) $row["isoverdue"],
                "body_preview" => $row["body_preview"] 
                        ? trim(preg_replace("/[\\x00-\\x09\\x0B\\x0C\\x0E-\\x1F\\x7F]/", "", preg_replace("/\\s+/", " ", strip_tags(html_entity_decode(mb_substr($row["body_preview"], 0, 300, "UTF-8"), ENT_QUOTES, "UTF-8"))))) 
                        : null,
                    "answered" => (bool) $row["isanswered"],
                "created" => $row["created"],
                "updated" => $row["updated"],
                "closed" => $row["closed"],
            );
        }

        $this->json(array(
            "data" => $tickets,
            "total" => $total,
            "page" => $page,
            "pages" => ceil($total / $limit),
            "limit" => $limit,
        ));
    }

    private function getTicket($id) {
        $ticket = Ticket::lookup($id);
        if (!$ticket) return $this->json(array("error" => "Ticket not found"), 404);

        $thread = array();
        $entries = $ticket->getThread()->getEntries();
        if ($entries) {
            foreach ($entries as $e) {
                $entry = array(
                    "id" => $e->getId(),
                    "type" => $e->getType(),
                    "poster" => $e->getPoster(),
                    "body" => preg_replace_callback(
                    "/cid:([a-zA-Z0-9_-]+)/",
                    function($m) {
                        $key = db_real_escape($m[1]);
                        $res = db_query("SELECT id FROM " . FILE_TABLE . " WHERE `key` = '" . $key . "' LIMIT 1");
                        if ($row = db_fetch_array($res)) {
                            return "/api/http.php/rest/files/" . $row["id"];
                        }
                        return $m[0];
                    },
                    $e->getBody()->getClean()
                ),
                    "created" => $e->getCreateDate(),
                    "source" => $e->getSource(),
                );
                // Attachments
                $atts = array();
                if ($e->getAttachments()) {
                    foreach ($e->getAttachments() as $a) {
                        $f = $a->getFile();
                        if ($f) {
                            $atts[] = array(
                                "id" => $f->getId(),
                                "name" => $f->getName(),
                                "type" => $f->getType(),
                                "size" => $f->getSize(),
                            );
                        }
                    }
                }
                if ($atts) $entry["attachments"] = $atts;
                $thread[] = $entry;
            }
        }

        $user = $ticket->getOwner();
        $staff = $ticket->getStaff();
        $dept = $ticket->getDept();
        $topic = $ticket->getTopic();

        $data = array(
            "id" => $ticket->getId(),
            "number" => $ticket->getNumber(),
            "subject" => $ticket->getSubject(),
            "status" => $ticket->getStatus()->getName(),
            "status_id" => $ticket->getStatusId(),
            "priority" => $ticket->getPriority(),
            "department" => $dept ? $dept->getName() : null,
            "department_id" => $dept ? $dept->getId() : null,
            "user" => $user ? array(
                "id" => $user->getId(),
                "name" => $user->getName()->getOriginal(),
                "email" => (string) $user->getEmail(),
            ) : null,
            "assignee" => $staff ? array(
                "id" => $staff->getId(),
                "name" => $staff->getName()->getOriginal(),
            ) : null,
            "source" => $ticket->getSource(),
            "topic" => $topic ? $topic->getName() : null,
            "overdue" => $ticket->isOverdue(),
            "answered" => $ticket->isAnswered(),
            "created" => $ticket->getCreateDate(),
            "updated" => $ticket->getUpdateDate(),
            "closed" => $ticket->getCloseDate(),
            "thread" => $thread,
        );

        $this->json(array("data" => $data));
    }

    private function createTicket($data) {
        $name = @$data["name"] ?: "";
        $email = @$data["email"] ?: "";
        $subject = @$data["subject"] ?: "";
        $message = @$data["message"] ?: "";
        $topicId = @$data["topic_id"] ?: 1;
        $source = @$data["source"] ?: "API";
        $deptId = @$data["dept_id"] ?: 0;

        if (!$name || !$email || !$subject || !$message)
            return $this->json(array("error" => "Missing required fields: name, email, subject, message"), 400);

        $user = User::lookupByEmail($email);
        if (!$user) $user = User::fromVars(array("name" => $name, "email" => $email));
        if (!$user) return $this->json(array("error" => "Cannot create user"), 400);

        $vars = array(
            "uid" => $user->getId(),
            "subject" => $subject,
            "message" => new HtmlThreadEntryBody("<p>" . htmlspecialchars($message, ENT_QUOTES, "UTF-8") . "</p>"),
            "source" => $source,
            "topicId" => (int) $topicId,
            "autorespond" => false,
        );
        if ($deptId) $vars["deptId"] = (int) $deptId;
        if ($atts = $this->buildAttachmentVars(@$data["attachments"]))
            $vars["attachments"] = $atts;

        $errors = array();
        $ticket = Ticket::create($vars, $errors, "api");
        if (!$ticket)
            return $this->json(array("error" => "Ticket creation failed", "details" => $errors), 400);

        $this->json(array(
            "success" => true,
            "id" => $ticket->getId(),
            "number" => $ticket->getNumber(),
        ), 201);
    }

    private function searchTickets($data) {
        $query = @$data["query"] ?: @$_GET["q"] ?: "";
        $limit = min(50, max(1, (int) (@$data["limit"] ?: 25)));

        if (strlen($query) < 2)
            return $this->json(array("error" => "Query must be at least 2 characters"), 400);

        $q = db_real_escape($query);
        $sql = "SELECT t.ticket_id, t.number, c.subject, u.name as user_name,
                    st.name as status_name, t.created
                FROM " . TICKET_TABLE . " t
                LEFT JOIN " . TABLE_PREFIX . "ticket__cdata c ON c.ticket_id = t.ticket_id
                LEFT JOIN " . TABLE_PREFIX . "user u ON u.id = t.user_id
                LEFT JOIN " . TABLE_PREFIX . "ticket_status st ON st.id = t.status_id
                LEFT JOIN " . TABLE_PREFIX . "thread th_pv ON th_pv.object_type = 'T' AND th_pv.object_id = t.ticket_id
                LEFT JOIN " . TABLE_PREFIX . "thread_entry te_preview ON te_preview.thread_id = th_pv.id
                    AND te_preview.id = (SELECT MIN(te2.id) FROM " . TABLE_PREFIX . "thread_entry te2 WHERE te2.thread_id = th_pv.id)
                WHERE t.number LIKE '%{$q}%'
                    OR c.subject LIKE '%{$q}%'
                    OR u.name LIKE '%{$q}%'
                ORDER BY t.created DESC LIMIT {$limit}";

        $results = array();
        $res = db_query($sql);
        while ($row = db_fetch_array($res)) {
            $results[] = array(
                "id" => (int) $row["ticket_id"],
                "number" => $row["number"],
                "subject" => $row["subject"],
                "user" => $row["user_name"],
                "status" => $row["status_name"],
                "created" => $row["created"],
            );
        }
        $this->json(array("data" => $results));
    }

    private function replyTicket($id, $data) {
        global $thisstaff;
        $ticket = Ticket::lookup($id);
        if (!$ticket) return $this->json(array("error" => "Ticket not found"), 404);

        $message = @$data["message"] ?: "";
        if (!$message) return $this->json(array("error" => "Message is required"), 400);

        $thisstaff = $this->getStaff();
        if (!$thisstaff) return $this->json(array("error" => "Staff not found"), 500);

        $vars = array(
            "msgId" => $ticket->getLastMsgId(),
            "response" => $message,
            "reply-to" => @$data["reply_to"] ?: "all",
            "staffId" => $thisstaff->getId(),
            "poster" => $thisstaff,
            "ip_address" => $_SERVER["REMOTE_ADDR"],
        );
        if (@$data["status"]) $vars["reply_status_id"] = (int) $data["status"];
        if ($atts = $this->buildAttachmentVars(@$data["attachments"]))
            $vars["attachments"] = $atts;

        $errors = array();
        $alert = (@$data["reply_to"] !== "none");

        // Suppress email alerts for WhatsApp tickets (wa-*/wag-* fake emails)
        if ($alert) {
            $user = $ticket->getUser();
            if ($user) {
                $email = $user->getDefaultEmailAddress();
                if ($email && preg_match('/^wa[g]?-[^@]+@/', $email)) {
                    $alert = false;
                }
            }
        }

        $response = $ticket->postReply($vars, $errors, $alert);
        if (!$response)
            return $this->json(array("error" => "Reply failed", "details" => $errors), 400);

        $this->json(array("success" => true, "entry_id" => $response->getId()), 201);
    }

    private function addNote($id, $data) {
        $ticket = Ticket::lookup($id);
        if (!$ticket) return $this->json(array("error" => "Ticket not found"), 404);

        $note = @$data["note"] ?: @$data["message"] ?: "";
        $title = @$data["title"] ?: "";
        if (!$note) return $this->json(array("error" => "Note is required"), 400);

        $staff = $this->getStaff();
        $vars = array(
            "title" => $title,
            "note" => $note,
            "staffId" => $staff ? $staff->getId() : 0,
            "poster" => $staff ?: "API",
        );
        if ($atts = $this->buildAttachmentVars(@$data["attachments"]))
            $vars["attachments"] = $atts;
        $errors = array();
        $entry = $ticket->getThread()->addNote($vars, $errors);
        if (!$entry)
            return $this->json(array("error" => "Note failed", "details" => $errors), 400);

        $this->json(array("success" => true, "entry_id" => $entry->getId()), 201);
    }

    private function assignTicket($id, $data) {
        $ticket = Ticket::lookup($id);
        if (!$ticket) return $this->json(array("error" => "Ticket not found"), 404);

        $assignee = @$data["assignee"] ?: ""; // "s1" for staff, "t1" for team
        $comments = @$data["comments"] ?: "";
        if (!$assignee) return $this->json(array("error" => "Assignee is required (e.g. 's1' for staff, 't1' for team)"), 400);

        if (strpos($assignee, "s") === 0) {
            $staffId = (int) substr($assignee, 1);
            $ticket->setStaffId($staffId);
        } elseif (strpos($assignee, "t") === 0) {
            $teamId = (int) substr($assignee, 1);
            $ticket->setTeamId($teamId);
        }
        $ticket->save(true);

        if ($comments) {
            $staff = $this->getStaff();
            $target = $assignee;
            if (strpos($assignee, "s") === 0) {
                $s = Staff::lookup((int) substr($assignee, 1));
                if ($s) $target = $s->getName();
            }
            $vars = array("title" => "Ticket asignado a {$target}", "note" => $comments,
                "staffId" => $staff ? $staff->getId() : 0, "poster" => $staff ?: "API");
            $errors = array();
            $ticket->getThread()->addNote($vars, $errors);
        }

        $this->json(array("success" => true));
    }

    private function transferTicket($id, $data) {
        $ticket = Ticket::lookup($id);
        if (!$ticket) return $this->json(array("error" => "Ticket not found"), 404);

        $deptId = (int) (@$data["department_id"] ?: 0);
        $comments = @$data["comments"] ?: "";
        if (!$deptId) return $this->json(array("error" => "department_id is required"), 400);

        $oldDept = $ticket->getDept() ? $ticket->getDept()->getName() : "?";
        $ticket->setDeptId($deptId);
        $ticket->save(true);

        $newDept = Dept::lookup($deptId);
        $newDeptName = $newDept ? $newDept->getName() : "?";

        $staff = $this->getStaff();
        $vars = array("title" => "Ticket transferida de {$oldDept} a {$newDeptName}",
            "note" => $comments ?: "Transferido vía API",
            "staffId" => $staff ? $staff->getId() : 0, "poster" => $staff ?: "API");
        $errors = array();
        $ticket->getThread()->addNote($vars, $errors);

        $this->json(array("success" => true));
    }


    // ==================== BULK OPERATIONS ====================

    private function bulkStatus($data) {
        $ids = @$data["ticket_ids"] ?: array();
        if (!is_array($ids) || empty($ids))
            return $this->json(array("error" => "ticket_ids array requerido"), 400);

        $status = @$data["status"] ?: "";
        $statusMap = array("open" => 1, "resolved" => 2, "closed" => 3);
        $statusId = @$data["status_id"] ?: (isset($statusMap[$status]) ? $statusMap[$status] : 0);
        if (!$statusId)
            return $this->json(array("error" => "status or status_id required"), 400);

        $st = TicketStatus::lookup($statusId);
        if (!$st)
            return $this->json(array("error" => "Invalid status"), 400);

        $results = array();
        $succeeded = 0;
        $failed = 0;

        foreach ($ids as $id) {
            $id = (int) $id;
            try {
                $ticket = Ticket::lookup($id);
                if (!$ticket) {
                    $results[] = array("id" => $id, "success" => false, "error" => "Ticket not found");
                    $failed++;
                    continue;
                }
                $ticket->setStatus($st);
                $results[] = array("id" => $id, "success" => true);
                $succeeded++;
            } catch (Exception $e) {
                $results[] = array("id" => $id, "success" => false, "error" => $e->getMessage());
                $failed++;
            }
        }

        $this->json(array(
            "success" => true,
            "results" => $results,
            "total" => count($ids),
            "succeeded" => $succeeded,
            "failed" => $failed
        ));
    }

    private function bulkAssign($data) {
        $ids = @$data["ticket_ids"] ?: array();
        if (!is_array($ids) || empty($ids))
            return $this->json(array("error" => "ticket_ids array requerido"), 400);

        $assignee = @$data["assignee"] ?: "";
        if (!$assignee)
            return $this->json(array("error" => "assignee is required (e.g. s1 for staff, t1 for team)"), 400);

        $isStaff = strpos($assignee, "s") === 0;
        $isTeam = strpos($assignee, "t") === 0;
        $entityId = (int) substr($assignee, 1);

        $results = array();
        $succeeded = 0;
        $failed = 0;

        foreach ($ids as $id) {
            $id = (int) $id;
            try {
                $ticket = Ticket::lookup($id);
                if (!$ticket) {
                    $results[] = array("id" => $id, "success" => false, "error" => "Ticket not found");
                    $failed++;
                    continue;
                }
                if ($isStaff) {
                    $ticket->setStaffId($entityId);
                } elseif ($isTeam) {
                    $ticket->setTeamId($entityId);
                }
                $ticket->save(true);
                $results[] = array("id" => $id, "success" => true);
                $succeeded++;
            } catch (Exception $e) {
                $results[] = array("id" => $id, "success" => false, "error" => $e->getMessage());
                $failed++;
            }
        }

        $this->json(array(
            "success" => true,
            "results" => $results,
            "total" => count($ids),
            "succeeded" => $succeeded,
            "failed" => $failed
        ));
    }

    private function bulkDelete($data) {
        if (!RestApiPlugin::cfg("allow_delete"))
            return $this->json(array("error" => "Delete is disabled in plugin settings"), 403);

        $ids = @$data["ticket_ids"] ?: array();
        if (!is_array($ids) || empty($ids))
            return $this->json(array("error" => "ticket_ids array requerido"), 400);

        $results = array();
        $succeeded = 0;
        $failed = 0;

        foreach ($ids as $id) {
            $id = (int) $id;
            try {
                $ticket = Ticket::lookup($id);
                if (!$ticket) {
                    $results[] = array("id" => $id, "success" => false, "error" => "Ticket not found");
                    $failed++;
                    continue;
                }
                $ticket->delete();
                $results[] = array("id" => $id, "success" => true);
                $succeeded++;
            } catch (Exception $e) {
                $results[] = array("id" => $id, "success" => false, "error" => $e->getMessage());
                $failed++;
            }
        }

        $this->json(array(
            "success" => true,
            "results" => $results,
            "total" => count($ids),
            "succeeded" => $succeeded,
            "failed" => $failed
        ));
    }

    private function changeStatus($id, $data) {
        $ticket = Ticket::lookup($id);
        if (!$ticket) return $this->json(array("error" => "Ticket not found"), 404);

        $status = @$data["status"] ?: "";
        $statusMap = array("open" => 1, "resolved" => 2, "closed" => 3);
        $statusId = @$data["status_id"] ?: (isset($statusMap[$status]) ? $statusMap[$status] : 0);
        if (!$statusId) return $this->json(array("error" => "status or status_id required"), 400);

        $st = TicketStatus::lookup($statusId);
        if (!$st) return $this->json(array("error" => "Invalid status"), 400);

        $ticket->setStatus($st);

        $this->json(array("success" => true));
    }

    private function claimTicket($id) {
        $ticket = Ticket::lookup($id);
        if (!$ticket) return $this->json(array("error" => "Ticket not found"), 404);

        $staff = $this->getStaff();
        if (!$staff) return $this->json(array("error" => "Staff not found"), 500);

        $ticket->setStaffId($staff->getId());
        $ticket->save(true);

        $vars = array("title" => "Ticket reclamado por " . $staff->getName(),
            "note" => "", "staffId" => $staff->getId(), "poster" => $staff);
        $errors = array();
        $ticket->getThread()->addNote($vars, $errors);

        $this->json(array("success" => true));
    }

    private function markTicket($id, $data) {
        $ticket = Ticket::lookup($id);
        if (!$ticket) return $this->json(array("error" => "Ticket not found"), 404);

        $action = @$data["action"] ?: "";
        if ($action === "answered") {
            db_query("UPDATE " . TICKET_TABLE . " SET isanswered=1 WHERE ticket_id=" . (int) $id);
        } elseif ($action === "unanswered") {
            db_query("UPDATE " . TICKET_TABLE . " SET isanswered=0 WHERE ticket_id=" . (int) $id);
        } else {
            return $this->json(array("error" => "action must be 'answered' or 'unanswered'"), 400);
        }

        $this->json(array("success" => true));
    }

    private function mergeTickets($id, $data) {
        $ticket = Ticket::lookup($id);
        if (!$ticket) return $this->json(array("error" => "Target ticket not found"), 404);

        $sourceIds = @$data["source_ids"] ?: array();
        if (!$sourceIds) return $this->json(array("error" => "source_ids array required"), 400);

        $merged = 0;
        foreach ($sourceIds as $srcId) {
            $src = Ticket::lookup((int) $srcId);
            if (!$src) continue;
            // Copy thread entries
            $entries = $src->getThread()->getEntries();
            if ($entries) {
                foreach ($entries as $e) {
                    $vars = array(
                        "title" => "Merge de ticket #" . $src->getNumber(),
                        "note" => "<strong>" . htmlspecialchars($e->getPoster()) . ":</strong><br>" . $e->getBody()->getClean(),
                        "poster" => "Sistema",
                    );
                    $errors = array();
                    $ticket->getThread()->addNote($vars, $errors);
                }
            }
            // Close source
            $st = TicketStatus::lookup(3);
            if ($st) $src->setStatus($st);
            $merged++;
        }

        $this->json(array("success" => true, "merged" => $merged));
    }

    private function editTicket($id, $data) {
        $ticket = Ticket::lookup($id);
        if (!$ticket) return $this->json(array("error" => "Ticket not found"), 404);

        $fields = @$data["fields"] ?: array();
        if (isset($fields["subject"])) {
            db_query(sprintf("UPDATE %s SET subject='%s' WHERE ticket_id=%d",
                TABLE_PREFIX . "ticket__cdata", db_real_escape($fields["subject"]), $id));
            // Update form entry value for ORM reads
            db_query(sprintf(
                "UPDATE %s a JOIN %s e ON a.entry_id=e.id AND e.object_id=%d AND e.object_type='T' "
                . "JOIN %s f ON a.field_id=f.id AND f.name='subject' SET a.value='%s'",
                TABLE_PREFIX . "form_entry_values",
                TABLE_PREFIX . "form_entry",
                $id,
                TABLE_PREFIX . "form_field",
                db_real_escape($fields["subject"])));
        }
        if (isset($fields["duedate"])) {
            db_query(sprintf("UPDATE %s SET duedate='%s' WHERE ticket_id=%d",
                TICKET_TABLE, db_real_escape($fields["duedate"]), $id));
        }

        $this->json(array("success" => true));
    }

    private function deleteTicket($id) {
        if (!RestApiPlugin::cfg("allow_delete"))
            return $this->json(array("error" => "Delete is disabled in plugin settings"), 403);

        $ticket = Ticket::lookup($id);
        if (!$ticket) return $this->json(array("error" => "Ticket not found"), 404);

        $ticket->delete();
        $this->json(array("success" => true));
    }

    // ==================== AGENTS ====================

    private function listAgents() {
        $sql = "SELECT staff_id, firstname, lastname, username, email, isactive, isadmin, dept_id,
                    d.name as dept_name
                FROM " . TABLE_PREFIX . "staff s
                LEFT JOIN " . TABLE_PREFIX . "department d ON d.id = s.dept_id
                WHERE s.isactive = 1
                ORDER BY s.firstname, s.lastname";

        $agents = array();
        $res = db_query($sql);
        while ($row = db_fetch_array($res)) {
            $agents[] = array(
                "id" => (int) $row["staff_id"],
                "value" => "s" . $row["staff_id"],
                "name" => trim($row["firstname"] . " " . $row["lastname"]),
                "username" => $row["username"],
                "email" => $row["email"],
                "department" => $row["dept_name"],
                "admin" => (bool) $row["isadmin"],
            );
        }
        $this->json(array("data" => $agents));
    }

    // ==================== DEPARTMENTS ====================

    private function listDepartments() {
        $sql = "SELECT id, name, flags FROM " . TABLE_PREFIX . "department ORDER BY name";
        $depts = array();
        $res = db_query($sql);
        while ($row = db_fetch_array($res)) {
            $depts[] = array(
                "id" => (int) $row["id"],
                "value" => "d" . $row["id"],
                "name" => $row["name"],
            );
        }
        $this->json(array("data" => $depts));
    }

    // ==================== TOPICS ====================

    private function listTopics() {
        $includeInactive = @$_GET["include_inactive"] == "1";
        $topics = array();
        foreach (Topic::objects() as $t) {
            if (!$includeInactive && !$t->isActive()) continue;
            $topics[] = array(
                "id" => $t->getId(),
                "name" => $t->getName(),
                "full_name" => $t->getFullName(),
                "topic_pid" => (int) $t->topic_pid,
                "dept_id" => (int) $t->dept_id,
                "ispublic" => (int) $t->ispublic,
                "isactive" => $t->isActive() ? 1 : 0,
            );
        }
        $this->json(array("data" => $topics));
    }

    private function createTopic($data) {
        $status = @$data["status"] ?: (isset($data["isactive"]) && !$data["isactive"] ? "disabled" : "active");
        $vars = array(
            "id" => null,
            "topic" => trim((string) @$data["topic"]),
            "topic_pid" => (int) @$data["topic_pid"],
            "dept_id" => isset($data["dept_id"]) ? (int) $data["dept_id"] : 1,
            "priority_id" => (int) @$data["priority_id"],
            "status_id" => (int) @$data["status_id"],
            "sla_id" => (int) @$data["sla_id"],
            "page_id" => (int) @$data["page_id"],
            "ispublic" => (int) @$data["ispublic"],
            "number_format" => (string) @$data["number_format"],
            "notes" => (string) @$data["notes"],
            "status" => $status,
        );
        $errors = array();
        $topic = Topic::create();
        if (!$topic->update($vars, $errors) || !$topic->getId()) {
            $this->json(array("error" => "Validation failed", "details" => $errors), 400);
            return;
        }
        $this->json(array(
            "id" => $topic->getId(),
            "name" => $topic->getName(),
            "full_name" => $topic->getFullName(),
            "topic_pid" => (int) $topic->topic_pid,
        ), 201);
    }

    private function editTopic($id, $data) {
        $topic = Topic::lookup($id);
        if (!$topic) {
            $this->json(array("error" => "Topic not found"), 404);
            return;
        }
        $vars = array(
            "id" => $topic->getId(),
            "topic" => isset($data["topic"]) ? trim((string) $data["topic"]) : $topic->getName(),
            "topic_pid" => isset($data["topic_pid"]) ? (int) $data["topic_pid"] : (int) $topic->topic_pid,
            "dept_id" => isset($data["dept_id"]) ? (int) $data["dept_id"] : (int) $topic->dept_id,
            "priority_id" => isset($data["priority_id"]) ? (int) $data["priority_id"] : (int) $topic->priority_id,
            "status_id" => isset($data["status_id"]) ? (int) $data["status_id"] : (int) $topic->status_id,
            "sla_id" => isset($data["sla_id"]) ? (int) $data["sla_id"] : (int) $topic->sla_id,
            "page_id" => isset($data["page_id"]) ? (int) $data["page_id"] : (int) $topic->page_id,
            "ispublic" => isset($data["ispublic"]) ? (int) $data["ispublic"] : (int) $topic->ispublic,
            "isactive" => isset($data["isactive"]) ? (int) $data["isactive"] : (int) $topic->isactive,
            "number_format" => isset($data["number_format"]) ? (string) $data["number_format"] : (string) $topic->number_format,
            "notes" => isset($data["notes"]) ? (string) $data["notes"] : (string) $topic->notes,
            "status" => @$data["status"] ?: ($topic->isActive() ? "active" : "disabled"),
        );
        unset($vars["isactive"]);
        $errors = array();
        if (!$topic->update($vars, $errors)) {
            $this->json(array("error" => "Update failed", "details" => $errors), 400);
            return;
        }
        $this->json(array("id" => $topic->getId(), "name" => $topic->getName()));
    }

    private function deleteTopic($id) {
        if (!RestApiPlugin::cfg("allow_delete")) {
            $this->json(array("error" => "Delete disabled"), 403);
            return;
        }
        $topic = Topic::lookup($id);
        if (!$topic) {
            $this->json(array("error" => "Topic not found"), 404);
            return;
        }
        if (!$topic->delete()) {
            $this->json(array("error" => "Delete failed"), 500);
            return;
        }
        $this->json(array("ok" => true));
    }

    // ==================== FILTERS ====================

    private function serializeFilter($f) {
        $rules = array();
        foreach ($f->rules as $r) {
            $rules[] = array(
                "id" => (int) $r->id,
                "what" => $r->what,
                "how" => $r->how,
                "val" => $r->val,
                "isactive" => (int) $r->isactive,
            );
        }
        $actions = array();
        foreach ($f->actions as $a) {
            $config = json_decode($a->configuration, true) ?: array();
            $actions[] = array(
                "id" => (int) $a->id,
                "type" => $a->type,
                "sort" => (int) $a->sort,
                "config" => $config,
            );
        }
        return array(
            "id" => (int) $f->getId(),
            "name" => $f->name,
            "execorder" => (int) $f->execorder,
            "target" => $f->target,
            "email_id" => (int) $f->email_id,
            "match_all_rules" => (int) $f->match_all_rules,
            "stop_onmatch" => (int) $f->stop_onmatch,
            "isactive" => (int) $f->isactive,
            "flags" => (int) $f->flags,
            "notes" => (string) $f->notes,
            "rules" => $rules,
            "actions" => $actions,
        );
    }

    private function listFilters() {
        $out = array();
        foreach (Filter::objects()->order_by("execorder") as $f) {
            $out[] = $this->serializeFilter($f);
        }
        $this->json(array("data" => $out));
    }

    private function getFilter($id) {
        $f = Filter::lookup($id);
        if (!$f) {
            $this->json(array("error" => "Filter not found"), 404);
            return;
        }
        $this->json($this->serializeFilter($f));
    }

    // Translate clean JSON payload into the $vars shape osTicket's Filter::update expects
    private function filterVarsFromPayload($data, $existing = null) {
        $vars = array(
            "name" => isset($data["name"]) ? (string) $data["name"] : ($existing ? $existing->name : ""),
            "execorder" => isset($data["execorder"]) ? (int) $data["execorder"] : ($existing ? (int) $existing->execorder : 99),
            "target" => isset($data["target"]) ? (string) $data["target"] : ($existing ? $existing->target : "Any"),
            "email_id" => isset($data["email_id"]) ? (int) $data["email_id"] : ($existing ? (int) $existing->email_id : 0),
            "match_all_rules" => isset($data["match_all_rules"]) ? (int) $data["match_all_rules"] : ($existing ? (int) $existing->match_all_rules : 0),
            "stop_onmatch" => isset($data["stop_onmatch"]) ? (int) $data["stop_onmatch"] : ($existing ? (int) $existing->stop_onmatch : 0),
            "isactive" => isset($data["isactive"]) ? (int) $data["isactive"] : ($existing ? (int) $existing->isactive : 1),
            "notes" => isset($data["notes"]) ? (string) $data["notes"] : ($existing ? (string) $existing->notes : ""),
        );

        // Rules: accept [{what,how,val}, ...] or preserve existing when not provided
        $rules = array();
        if (isset($data["rules"]) && is_array($data["rules"])) {
            foreach ($data["rules"] as $i => $r) {
                $rules[$i] = array(
                    "w" => @$r["what"],
                    "h" => @$r["how"],
                    "v" => @$r["val"],
                );
            }
        } elseif ($existing) {
            $i = 0;
            foreach ($existing->rules as $r) {
                $rules[$i++] = array("w" => $r->what, "h" => $r->how, "v" => $r->val);
            }
        }
        $vars["rules"] = $rules;

        // Actions: accept [{type: "topic", topic_id: 14}, ...]
        // osTicket expects $vars['actions'][sort] = 'N<type>' AND $vars[<config_field>] set at top level
        $actions = array();
        if (isset($data["actions"]) && is_array($data["actions"])) {
            foreach ($data["actions"] as $sort => $a) {
                $type = @$a["type"];
                if (!$type) continue;
                $actions[$sort] = "N" . $type;
                foreach ($a as $k => $v) {
                    if ($k === "type" || $k === "sort") continue;
                    $vars[$k] = $v;
                }
            }
        }
        $vars["actions"] = $actions;

        return $vars;
    }

    private function createFilter($data) {
        $vars = $this->filterVarsFromPayload($data);
        $filter = new Filter();
        $errors = array();
        if (!$filter->update($vars, $errors) || !$filter->getId()) {
            $this->json(array("error" => "Validation failed", "details" => $errors), 400);
            return;
        }
        $this->json($this->serializeFilter($filter), 201);
    }

    private function editFilter($id, $data) {
        $filter = Filter::lookup($id);
        if (!$filter) {
            $this->json(array("error" => "Filter not found"), 404);
            return;
        }
        $vars = $this->filterVarsFromPayload($data, $filter);
        $errors = array();
        if (!$filter->update($vars, $errors)) {
            $this->json(array("error" => "Update failed", "details" => $errors), 400);
            return;
        }
        $filter = Filter::lookup($id);
        $this->json($this->serializeFilter($filter));
    }

    private function deleteFilter($id) {
        if (!RestApiPlugin::cfg("allow_delete")) {
            $this->json(array("error" => "Delete disabled"), 403);
            return;
        }
        $filter = Filter::lookup($id);
        if (!$filter) {
            $this->json(array("error" => "Filter not found"), 404);
            return;
        }
        if (!$filter->delete()) {
            $this->json(array("error" => "Delete failed"), 500);
            return;
        }
        $this->json(array("ok" => true));
    }

    // ==================== USERS ====================

    private function searchUsers() {
        $q = db_real_escape(@$_GET["q"] ?: "");
        $limit = min(50, max(1, (int) (@$_GET["limit"] ?: 25)));
        if (!$q) return $this->json(array("data" => array()));

        $sql = "SELECT u.id, u.name, e.address as email, u.created
                FROM " . TABLE_PREFIX . "user u
                LEFT JOIN " . TABLE_PREFIX . "user_email e ON e.id = u.default_email_id
                WHERE u.name LIKE '%{$q}%' OR e.address LIKE '%{$q}%'
                ORDER BY u.name LIMIT {$limit}";

        $users = array();
        $res = db_query($sql);
        while ($row = db_fetch_array($res)) {
            $users[] = array(
                "id" => (int) $row["id"],
                "name" => $row["name"],
                "email" => $row["email"],
                "created" => $row["created"],
            );
        }
        $this->json(array("data" => $users));
    }

    private function getUser($id) {
        $user = User::lookup($id);
        if (!$user) return $this->json(array("error" => "User not found"), 404);

        $this->json(array("data" => array(
            "id" => $user->getId(),
            "name" => $user->getName()->getOriginal(),
            "email" => (string) $user->getEmail(),
            "created" => $user->getCreateDate(),
        )));
    }

    private function createUser($data) {
        $name = @$data["name"] ?: "";
        $email = @$data["email"] ?: "";
        if (!$name || !$email)
            return $this->json(array("error" => "name and email required"), 400);

        $existing = User::lookupByEmail($email);
        if ($existing)
            return $this->json(array("error" => "User already exists", "id" => $existing->getId()), 409);

        $user = User::fromVars(array("name" => $name, "email" => $email));
        if (!$user) return $this->json(array("error" => "Cannot create user"), 400);

        $this->json(array("success" => true, "id" => $user->getId()), 201);
    }

    private function updateUser($id, $data) {
        $user = User::lookup($id);
        if (!$user) return $this->json(array("error" => "User not found"), 404);

        if (isset($data["name"])) {
            db_query(sprintf("UPDATE %s SET name='%s', updated=NOW() WHERE id=%d",
                TABLE_PREFIX . "user", db_real_escape($data["name"]), $id));
        }
        $this->json(array("success" => true));
    }

    private function deleteUser($id) {
        $user = User::lookup($id);
        if (!$user) return $this->json(array("error" => "User not found"), 404);
        $user->delete();
        $this->json(array("success" => true));
    }

    // ==================== STATS ====================

    private function getStats() {
        $period = @$_GET['period'] ?: 'today';
        $periodFilter = "";
        $closedFilter = "";
        $trendDays = 7;
        
        switch ($period) {
            case 'today':
                $periodFilter = "DATE(created) = CURDATE()";
                $closedFilter = "DATE(closed) = CURDATE()";
                $trendDays = 7;
                break;
            case 'week':
                $periodFilter = "created >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
                $closedFilter = "closed >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
                $trendDays = 7;
                break;
            case 'month':
                $periodFilter = "created >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
                $closedFilter = "closed >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
                $trendDays = 30;
                break;
            case 'all':
            default:
                $periodFilter = "1=1";
                $closedFilter = "1=1";
                $trendDays = 30;
                break;
        }

        $stats = array();
        $queries = array(
            "open" => "SELECT COUNT(*) FROM " . TICKET_TABLE . " WHERE status_id=1",
            "closed" => "SELECT COUNT(*) FROM " . TICKET_TABLE . " WHERE status_id=3",
            "overdue" => "SELECT COUNT(*) FROM " . TICKET_TABLE . " WHERE isoverdue=1 AND status_id=1",
            "assigned" => "SELECT COUNT(*) FROM " . TICKET_TABLE . " WHERE staff_id > 0 AND status_id=1",
            "unassigned" => "SELECT COUNT(*) FROM " . TICKET_TABLE . " WHERE (staff_id=0 OR staff_id IS NULL) AND status_id=1",
            "today_created" => "SELECT COUNT(*) FROM " . TICKET_TABLE . " WHERE DATE(created)=CURDATE()",
            "today_closed" => "SELECT COUNT(*) FROM " . TICKET_TABLE . " WHERE DATE(closed)=CURDATE()",
        );
        foreach ($queries as $key => $sql) {
            $r = db_fetch_row(db_query($sql));
            $stats[$key] = (int) $r[0];
        }

        // first_response_avg_min
        $sql_first_resp = "SELECT AVG(TIMESTAMPDIFF(MINUTE, m.created, r.created)) as avg_min 
            FROM " . TICKET_TABLE . " t 
            JOIN " . TABLE_PREFIX . "thread th ON th.object_id = t.ticket_id AND th.object_type = 'T' 
            JOIN (SELECT thread_id, MIN(created) as created FROM " . TABLE_PREFIX . "thread_entry WHERE type = 'M' GROUP BY thread_id) m ON m.thread_id = th.id 
            JOIN (SELECT thread_id, MIN(created) as created FROM " . TABLE_PREFIX . "thread_entry WHERE type = 'R' GROUP BY thread_id) r ON r.thread_id = th.id 
            WHERE m.created < r.created AND t.{$periodFilter}";
        $r_first_resp = db_fetch_row(db_query($sql_first_resp));
        $stats['first_response_avg_min'] = $r_first_resp[0] ? round((float)$r_first_resp[0], 2) : 0;

        // resolution_avg_hours
        $sql_res_avg = "SELECT AVG(TIMESTAMPDIFF(HOUR, created, closed)) as avg_hours 
            FROM " . TICKET_TABLE . " 
            WHERE status_id = 3 AND {$closedFilter}";
        $r_res_avg = db_fetch_row(db_query($sql_res_avg));
        $stats['resolution_avg_hours'] = $r_res_avg[0] ? round((float)$r_res_avg[0], 2) : 0;

        // trend
        $trend = array();
        
        $sql_trend_created = "SELECT DATE(created) as date, COUNT(*) as count 
            FROM " . TICKET_TABLE . " 
            WHERE created >= DATE_SUB(CURDATE(), INTERVAL {$trendDays} DAY) 
            GROUP BY DATE(created)";
        $res_created = db_query($sql_trend_created);
        while ($row = db_fetch_array($res_created)) {
            $trend[$row['date']]['created'] = (int)$row['count'];
        }

        $sql_trend_closed = "SELECT DATE(closed) as date, COUNT(*) as count 
            FROM " . TICKET_TABLE . " 
            WHERE status_id = 3 AND closed >= DATE_SUB(CURDATE(), INTERVAL {$trendDays} DAY) 
            GROUP BY DATE(closed)";
        $res_closed = db_query($sql_trend_closed);
        while ($row = db_fetch_array($res_closed)) {
            $trend[$row['date']]['closed'] = (int)$row['count'];
        }

        // Fill missing dates
        $trend_final = array();
        for ($i = $trendDays - 1; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-{$i} days"));
            $trend_final[] = array(
                'date' => $date,
                'created' => isset($trend[$date]['created']) ? $trend[$date]['created'] : 0,
                'closed' => isset($trend[$date]['closed']) ? $trend[$date]['closed'] : 0
            );
        }
        $stats['trend'] = $trend_final;

        $this->json(array("data" => $stats));
    }

    private function getQueueCounts() {
        $counts = array();
        $sql = "SELECT status_id, COUNT(*) as cnt FROM " . TICKET_TABLE . " GROUP BY status_id";
        $res = db_query($sql);
        while ($row = db_fetch_array($res)) {
            $st = TicketStatus::lookup($row["status_id"]);
            $name = $st ? strtolower($st->getName()) : "status_" . $row["status_id"];
            $counts[$name] = (int) $row["cnt"];
        }
        // Overdue
        $r = db_fetch_row(db_query("SELECT COUNT(*) FROM " . TICKET_TABLE . " WHERE isoverdue=1 AND status_id=1"));
        $counts["overdue"] = (int) $r[0];
        $this->json(array("data" => $counts));
    }

    // ==================== TASKS ====================

    private function listTasks() {
        $status = @$_GET["status"] ?: "open";
        $limit = min(100, max(1, (int) (@$_GET["limit"] ?: 25)));

        $where = $status === "closed" ? "t.flags & 1" : "NOT (t.flags & 1)";
        if ($status === "all") $where = "1=1";

        $sql = "SELECT t.id, t.number, t.dept_id, t.staff_id, t.flags, t.created, t.updated,
                    c.title as subject,
                    d.name as dept_name,
                    s.firstname as staff_first, s.lastname as staff_last
                FROM " . TABLE_PREFIX . "task t
                LEFT JOIN " . TABLE_PREFIX . "task__cdata c ON c.task_id = t.id
                LEFT JOIN " . TABLE_PREFIX . "department d ON d.id = t.dept_id
                LEFT JOIN " . TABLE_PREFIX . "staff s ON s.staff_id = t.staff_id
                WHERE {$where}
                ORDER BY t.updated DESC LIMIT {$limit}";

        $tasks = array();
        $res = db_query($sql);
        while ($row = db_fetch_array($res)) {
            $tasks[] = array(
                "id" => (int) $row["id"],
                "number" => $row["number"],
                "subject" => $row["subject"],
                "department" => $row["dept_name"],
                "assignee" => $row["staff_first"] ? trim($row["staff_first"] . " " . $row["staff_last"]) : null,
                "closed" => (bool) ($row["flags"] & 1),
                "created" => $row["created"],
                "updated" => $row["updated"],
            );
        }
        $this->json(array("data" => $tasks));
    }

    private function getTask($id) {
        $task = Task::lookup($id);
        if (!$task) return $this->json(array("error" => "Task not found"), 404);

        $thread = array();
        $entries = $task->getThread()->getEntries();
        if ($entries) {
            foreach ($entries as $e) {
                $thread[] = array(
                    "id" => $e->getId(),
                    "type" => $e->getType(),
                    "poster" => $e->getPoster(),
                    "body" => preg_replace_callback(
                    "/cid:([a-zA-Z0-9_-]+)/",
                    function($m) {
                        $key = db_real_escape($m[1]);
                        $res = db_query("SELECT id FROM " . FILE_TABLE . " WHERE `key` = '" . $key . "' LIMIT 1");
                        if ($row = db_fetch_array($res)) {
                            return "/api/http.php/rest/files/" . $row["id"];
                        }
                        return $m[0];
                    },
                    $e->getBody()->getClean()
                ),
                    "created" => $e->getCreateDate(),
                );
            }
        }

        // Get title from cdata table
        $title = "";
        $r = db_fetch_array(db_query(sprintf("SELECT title FROM %s WHERE task_id=%d",
            TABLE_PREFIX . "task__cdata", $task->getId())));
        if ($r) $title = $r["title"];

        $this->json(array("data" => array(
            "id" => $task->getId(),
            "number" => $task->getNumber(),
            "subject" => $title,
            "department" => $task->getDept() ? $task->getDept()->getName() : null,
            "assignee" => $task->getStaff() ? $task->getStaff()->getName()->getOriginal() : null,
            "closed" => $task->isClosed(),
            "created" => $task->getCreateDate(),
            "thread" => $thread,
        )));
    }

    private function createTask($data) {
        global $thisstaff;
        $title = @$data["title"] ?: "";
        $description = @$data["description"] ?: "";
        $deptId = (int) (@$data["dept_id"] ?: 0);
        if (!$title) return $this->json(array("error" => "title required"), 400);

        $thisstaff = $this->getStaff();
        if (!$thisstaff) return $this->json(array("error" => "Staff not found"), 500);

        if (!$deptId) $deptId = $thisstaff->getDeptId();

        $vars = array(
            "internal_formdata" => array("dept_id" => $deptId),
            "default_formdata" => array("title" => $title),
            "description" => $description,
            "message" => $description,
        );
        $task = Task::create($vars);
        if (!$task) return $this->json(array("error" => "Task creation failed"), 400);

        $this->json(array("success" => true, "id" => $task->getId()), 201);
    }

    private function addTaskNote($id, $data) {
        $task = Task::lookup($id);
        if (!$task) return $this->json(array("error" => "Task not found"), 404);

        $vars = array("title" => @$data["title"] ?: "", "note" => @$data["note"] ?: "");
        $errors = array();
        $entry = $task->getThread()->addNote($vars, $errors);
        if (!$entry) return $this->json(array("error" => "Note failed"), 400);

        $this->json(array("success" => true, "entry_id" => $entry->getId()), 201);
    }

    private function assignTask($id, $data) {
        $task = Task::lookup($id);
        if (!$task) return $this->json(array("error" => "Task not found"), 404);
        $staffId = (int) (@$data["staff_id"] ?: 0);
        if (!$staffId) return $this->json(array("error" => "staff_id required"), 400);
        db_query(sprintf("UPDATE %s SET staff_id=%d, updated=NOW() WHERE id=%d", TABLE_PREFIX . "task", $staffId, $id));
        $this->json(array("success" => true));
    }

    private function transferTask($id, $data) {
        $task = Task::lookup($id);
        if (!$task) return $this->json(array("error" => "Task not found"), 404);
        $deptId = (int) (@$data["dept_id"] ?: 0);
        if (!$deptId) return $this->json(array("error" => "dept_id required"), 400);
        db_query(sprintf("UPDATE %s SET dept_id=%d, updated=NOW() WHERE id=%d", TABLE_PREFIX . "task", $deptId, $id));
        $this->json(array("success" => true));
    }

    private function closeTask($id) {
        $task = Task::lookup($id);
        if (!$task) return $this->json(array("error" => "Task not found"), 404);
        db_query(sprintf("UPDATE %s SET flags=flags|1, updated=NOW() WHERE id=%d", TABLE_PREFIX . "task", $id));
        $this->json(array("success" => true));
    }

    private function reopenTask($id) {
        $task = Task::lookup($id);
        if (!$task) return $this->json(array("error" => "Task not found"), 404);
        db_query(sprintf("UPDATE %s SET flags=flags&~1, updated=NOW() WHERE id=%d", TABLE_PREFIX . "task", $id));
        $this->json(array("success" => true));
    }

    // ==================== ORGANIZATIONS ====================

    private function listOrganizations() {
        $q = @$_GET["q"] ?: "";
        $limit = min(100, max(1, (int) (@$_GET["limit"] ?: 50)));
        $where = $q ? "WHERE name LIKE '%" . db_real_escape($q) . "%'" : "";

        $sql = "SELECT id, name, created, updated FROM " . TABLE_PREFIX . "organization {$where} ORDER BY name LIMIT {$limit}";
        $orgs = array();
        $res = db_query($sql);
        while ($row = db_fetch_array($res)) {
            $orgs[] = array("id" => (int) $row["id"], "name" => $row["name"], "created" => $row["created"]);
        }
        $this->json(array("data" => $orgs));
    }

    private function getOrganization($id) {
        $org = Organization::lookup($id);
        if (!$org) return $this->json(array("error" => "Organization not found"), 404);
        $this->json(array("data" => array(
            "id" => $org->getId(),
            "name" => $org->getName(),
            "created" => $org->getCreateDate(),
        )));
    }

    private function createOrganization($data) {
        $name = @$data["name"] ?: "";
        if (!$name) return $this->json(array("error" => "name required"), 400);
        $vars = array("name" => $name);
        $errors = array();
        $org = Organization::fromVars($vars);
        if (!$org) return $this->json(array("error" => "Creation failed"), 400);
        $this->json(array("success" => true, "id" => $org->getId()), 201);
    }

    private function deleteOrganization($id) {
        $org = Organization::lookup($id);
        if (!$org) return $this->json(array("error" => "Organization not found"), 404);
        $org->delete();
        $this->json(array("success" => true));
    }

    // ==================== ATTACHMENTS ====================

    private function listAttachments($ticketId) {
        $ticket = Ticket::lookup($ticketId);
        if (!$ticket) return $this->json(array("error" => "Ticket not found"), 404);

        $attachments = array();
        $entries = $ticket->getThread()->getEntries();
        if ($entries) {
            foreach ($entries as $e) {
                if ($e->getAttachments()) {
                    foreach ($e->getAttachments() as $a) {
                        $f = $a->getFile();
                        if ($f) {
                            $attachments[] = array(
                                "file_id" => (int) $f->getId(),
                                "name" => $f->getName(),
                                "type" => $f->getType(),
                                "size" => (int) $f->getSize(),
                                "entry_id" => (int) $e->getId(),
                                "entry_type" => $e->getType(),
                                "created" => $e->getCreateDate(),
                            );
                        }
                    }
                }
            }
        }
        $this->json(array("data" => $attachments, "total" => count($attachments)));
    }

    private function getFile($fileId) {
        $file = AttachmentFile::lookup($fileId);
        if (!$file) return $this->json(array("error" => "File not found"), 404);

        $data = $file->getData();
        $this->json(array(
            "data" => array(
                "id" => (int) $file->getId(),
                "name" => $file->getName(),
                "type" => $file->getType(),
                "size" => (int) $file->getSize(),
                "content" => base64_encode($data),
            ),
        ));
    }

    // ==================== CANNED RESPONSES ====================

    private function listCannedResponses() {
        $sql = "SELECT canned_id, title, response, isenabled
                FROM " . TABLE_PREFIX . "canned_response
                WHERE isenabled = 1
                ORDER BY title";
        $canned = array();
        $res = db_query($sql);
        while ($row = db_fetch_array($res)) {
            $canned[] = array(
                "id" => (int) $row["canned_id"],
                "title" => $row["title"],
                "response" => $row["response"],
                "enabled" => (bool) $row["isenabled"],
            );
        }
        $this->json(array("data" => $canned, "total" => count($canned)));
    }

    // ==================== SLA PLANS ====================

    private function listSLAs() {
        $sql = "SELECT id, name, grace_period, isactive, flags
                FROM " . TABLE_PREFIX . "sla
                WHERE isactive = 1
                ORDER BY name";
        $slas = array();
        $res = db_query($sql);
        while ($row = db_fetch_array($res)) {
            $slas[] = array(
                "id" => (int) $row["id"],
                "name" => $row["name"],
                "grace_period" => (int) $row["grace_period"],
                "active" => (bool) $row["isactive"],
                "flags" => (int) $row["flags"],
            );
        }
        $this->json(array("data" => $slas, "total" => count($slas)));
    }

    // ==================== COLLABORATORS ====================

    private function listCollaborators($ticketId) {
        $ticket = Ticket::lookup($ticketId);
        if (!$ticket) return $this->json(array("error" => "Ticket not found"), 404);

        $collaborators = array();
        $sql = sprintf(
            "SELECT c.id, c.user_id, c.role, c.created, c.updated,
                    u.name, e.address as email
             FROM %s c
             LEFT JOIN %s u ON u.id = c.user_id
             LEFT JOIN %s e ON e.id = u.default_email_id
             WHERE c.thread_id = %d
             ORDER BY c.created",
            TABLE_PREFIX . "thread_collaborator",
            TABLE_PREFIX . "user",
            TABLE_PREFIX . "user_email",
            $ticket->getThread()->getId()
        );
        $res = db_query($sql);
        while ($row = db_fetch_array($res)) {
            $collaborators[] = array(
                "id" => (int) $row["id"],
                "user_id" => (int) $row["user_id"],
                "name" => $row["name"],
                "email" => $row["email"],
                "role" => $row["role"] ?: "M",
                "created" => $row["created"],
            );
        }
        $this->json(array("data" => $collaborators, "total" => count($collaborators)));
    }

    private function addCollaborator($ticketId, $data) {
        $ticket = Ticket::lookup($ticketId);
        if (!$ticket) return $this->json(array("error" => "Ticket not found"), 404);

        $userId = (int) (@$data["user_id"] ?: 0);
        if (!$userId) return $this->json(array("error" => "user_id required"), 400);

        $user = User::lookup($userId);
        if (!$user) return $this->json(array("error" => "User not found"), 404);

        $vars = array("userId" => $userId);
        $errors = array();
        $collab = $ticket->getThread()->addCollaborator($user, $vars, $errors);
        if (!$collab)
            return $this->json(array("error" => "Failed to add collaborator", "details" => $errors), 400);

        $this->json(array("success" => true, "id" => $collab->getId()), 201);
    }

    private function removeCollaborator($ticketId, $userId) {
        $ticket = Ticket::lookup($ticketId);
        if (!$ticket) return $this->json(array("error" => "Ticket not found"), 404);

        $threadId = $ticket->getThread()->getId();
        $sql = sprintf("SELECT id FROM %s WHERE thread_id = %d AND user_id = %d",
            TABLE_PREFIX . "thread_collaborator", $threadId, $userId);
        $row = db_fetch_array(db_query($sql));
        if (!$row) return $this->json(array("error" => "Collaborator not found"), 404);

        db_query(sprintf("DELETE FROM %s WHERE id = %d",
            TABLE_PREFIX . "thread_collaborator", (int) $row["id"]));
        $this->json(array("success" => true));
    }

    // ==================== ACTIVITY LOGS ====================

    private function listTicketEvents($ticketId) {
        $ticket = Ticket::lookup($ticketId);
        if (!$ticket) return $this->json(array("error" => "Ticket not found"), 404);

        $sql = sprintf(
            "SELECT e.id, e.ticket_id, e.staff_id, e.team_id, e.dept_id,
                    e.topic_id, e.state, e.data, e.username, e.timestamp,
                    s.firstname as staff_first, s.lastname as staff_last
             FROM %s e
             LEFT JOIN %s s ON s.staff_id = e.staff_id
             WHERE e.ticket_id = %d
             ORDER BY e.timestamp DESC",
            TABLE_PREFIX . "ticket_event",
            TABLE_PREFIX . "staff",
            $ticketId
        );
        $events = array();
        $res = db_query($sql);
        while ($row = db_fetch_array($res)) {
            $events[] = array(
                "id" => (int) $row["id"],
                "state" => $row["state"],
                "staff" => $row["staff_first"] ? trim($row["staff_first"] . " " . $row["staff_last"]) : $row["username"],
                "staff_id" => (int) $row["staff_id"],
                "dept_id" => (int) $row["dept_id"],
                "data" => $row["data"],
                "timestamp" => $row["timestamp"],
            );
        }
        $this->json(array("data" => $events, "total" => count($events)));
    }
}
