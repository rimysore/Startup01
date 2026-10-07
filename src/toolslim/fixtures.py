"""A synthetic catalog of 40 tools across 8 services, with a natural-language
query per tool for retrieval evaluation.

Schemas deliberately look like what MCP servers generated from pydantic /
zod models really emit: a `title` on everything, `additionalProperties:
false`, redundant `default`s, wordy descriptions. Replace with a real
`tools/list` dump (`--catalog`) for numbers you can trust.

Param spec: "name[*]:type:description" (`*` = required). Enum: "type=a|b|c".
"""

from __future__ import annotations

from .catalog import Tool

# (tool name, description, [params], query a user might ask)
_SPEC: list[tuple[str, str, list[str], str]] = [
    # --- github ---
    ("github_create_issue", "Create a new issue in a GitHub repository. Supports labels, assignees and milestones. Returns the created issue including its number and URL.",
     ["owner*:string:Repository owner (user or organization)", "repo*:string:Repository name", "title*:string:Issue title", "body:string:Issue body in markdown", "labels:array:Labels to apply to the issue", "assignees:array:GitHub usernames to assign"],
     "file a bug report in our repo about the login crash"),
    ("github_list_pull_requests", "List pull requests in a repository, optionally filtered by state, author or base branch. Results are paginated and sorted by last update.",
     ["owner*:string:Repository owner", "repo*:string:Repository name", "state:string=open|closed|all:Filter by pull request state", "author:string:Only PRs opened by this user", "page:integer:Page number for pagination"],
     "show me which PRs are still waiting for review"),
    ("github_merge_pull_request", "Merge a pull request into its base branch. The pull request must be mergeable and all required checks must have passed.",
     ["owner*:string:Repository owner", "repo*:string:Repository name", "pull_number*:integer:Number of the pull request", "merge_method:string=merge|squash|rebase:How to merge the commits"],
     "squash and land the approved change into main"),
    ("github_search_code", "Search for code across GitHub repositories using GitHub's code search syntax. Returns file paths and matching snippets.",
     ["query*:string:Search query using GitHub code search syntax", "per_page:integer:Results per page, max 100"],
     "find every place that calls the deprecated parse_config function"),
    ("github_create_branch", "Create a new branch in a repository from an existing ref. Fails if the branch name already exists.",
     ["owner*:string:Repository owner", "repo*:string:Repository name", "branch*:string:Name of the new branch", "from_ref:string:Source branch or commit SHA, defaults to the default branch"],
     "start a feature branch off main for the payments work"),
    # --- slack ---
    ("slack_post_message", "Post a message to a Slack channel or direct message. Supports markdown-style formatting and replying in a thread.",
     ["channel*:string:Channel ID or name", "text*:string:Message text", "thread_ts:string:Timestamp of the parent message to reply in a thread"],
     "tell the #releases channel that the deploy finished"),
    ("slack_list_channels", "List the public channels in the workspace, with member counts and topics. Archived channels are excluded by default.",
     ["limit:integer:Maximum number of channels to return", "include_archived:boolean:Also return archived channels"],
     "what channels exist in the workspace"),
    ("slack_search_messages", "Search message history across channels the user can access. Supports Slack search modifiers such as from: and in:.",
     ["query*:string:Search query with optional modifiers", "count:integer:Number of results"],
     "dig up what Maria said about the outage last week"),
    ("slack_add_reaction", "Add an emoji reaction to a message.",
     ["channel*:string:Channel containing the message", "timestamp*:string:Timestamp of the message", "name*:string:Emoji name without colons"],
     "put a thumbs up emoji on that announcement"),
    ("slack_get_thread_replies", "Fetch all replies in a message thread, oldest first.",
     ["channel*:string:Channel containing the thread", "thread_ts*:string:Timestamp of the parent message"],
     "read the whole conversation under the incident post"),
    # --- jira ---
    ("jira_create_ticket", "Create a Jira ticket in a project with a summary, description and issue type. Returns the new ticket key.",
     ["project*:string:Project key, e.g. PLAT", "summary*:string:One-line summary", "description:string:Detailed description", "issue_type:string=Bug|Task|Story|Epic:Type of issue", "priority:string=Low|Medium|High|Critical:Ticket priority"],
     "open a high priority task for rotating the database credentials"),
    ("jira_transition_ticket", "Move a Jira ticket to a new workflow status such as In Progress or Done. The transition must be allowed by the project workflow.",
     ["ticket*:string:Ticket key, e.g. PLAT-123", "status*:string:Target workflow status name"],
     "mark PLAT-481 as done"),
    ("jira_search_tickets", "Search Jira tickets using a JQL query. Returns keys, summaries, assignees and statuses.",
     ["jql*:string:JQL query string", "max_results:integer:Maximum number of results"],
     "list everything assigned to me that is still open"),
    ("jira_add_comment", "Add a comment to an existing Jira ticket. Comments support Jira wiki markup.",
     ["ticket*:string:Ticket key", "body*:string:Comment text"],
     "leave a note on PLAT-90 saying the fix is in staging"),
    ("jira_assign_ticket", "Assign a Jira ticket to a user, or unassign it by passing null.",
     ["ticket*:string:Ticket key", "assignee:string:Account ID or email of the new assignee"],
     "hand PLAT-77 over to Dana"),
    # --- gmail ---
    ("gmail_send_email", "Send an email from the authenticated account. Supports plain text and HTML bodies, CC and BCC recipients.",
     ["to*:array:Recipient email addresses", "subject*:string:Email subject", "body*:string:Email body", "cc:array:CC recipients", "bcc:array:BCC recipients"],
     "email the vendor to confirm Thursday's meeting"),
    ("gmail_search_emails", "Search the mailbox using Gmail search operators and return matching message summaries.",
     ["query*:string:Gmail search query, e.g. from:alice has:attachment", "max_results:integer:Maximum number of messages"],
     "look through my inbox for invoices from last month"),
    ("gmail_read_email", "Read the full content of one email message, including headers, body and attachment names.",
     ["message_id*:string:ID of the message"],
     "open the message from the recruiter and show me its contents"),
    ("gmail_create_draft", "Create a draft email without sending it. Returns the draft ID so it can be reviewed or sent later.",
     ["to*:array:Recipient email addresses", "subject*:string:Subject line", "body*:string:Draft body"],
     "prepare a reply for me to review before it goes out"),
    ("gmail_apply_label", "Apply a label to a message or thread, creating nothing if the label does not exist.",
     ["message_id*:string:ID of the message", "label*:string:Label name to apply"],
     "tag this message as important"),
    # --- calendar ---
    ("calendar_create_event", "Create a calendar event with a title, start and end time, attendees and optional location or video link.",
     ["title*:string:Event title", "start*:string:Start time in ISO 8601", "end*:string:End time in ISO 8601", "attendees:array:Attendee email addresses", "location:string:Event location"],
     "schedule a design review with the team tomorrow at 3pm"),
    ("calendar_list_events", "List calendar events in a time range, ordered by start time.",
     ["start*:string:Range start in ISO 8601", "end*:string:Range end in ISO 8601", "calendar_id:string:Calendar to read, defaults to primary"],
     "what is on my agenda next week"),
    ("calendar_find_free_slots", "Find time slots when all listed people are free, within a date range and minimum duration.",
     ["attendees*:array:Email addresses to check", "duration_minutes*:integer:Required slot length in minutes", "range_start*:string:Search window start", "range_end*:string:Search window end"],
     "when can the four of us all meet for an hour"),
    ("calendar_delete_event", "Delete a calendar event and notify attendees of the cancellation.",
     ["event_id*:string:ID of the event", "notify:boolean:Send cancellation notices to attendees"],
     "cancel the Friday sync"),
    ("calendar_update_event", "Update fields of an existing calendar event such as time, title or attendees.",
     ["event_id*:string:ID of the event", "title:string:New title", "start:string:New start time", "end:string:New end time"],
     "push the standup back by thirty minutes"),
    # --- drive ---
    ("drive_upload_file", "Upload a local file to cloud storage, optionally into a folder. Returns the file ID and sharing link.",
     ["path*:string:Local file path", "folder_id:string:Destination folder ID", "name:string:Name to store the file under"],
     "put the quarterly report PDF into the shared storage"),
    ("drive_search_files", "Search files and folders by name, content or type. Returns IDs, names, owners and modification times.",
     ["query*:string:Search text", "mime_type:string:Restrict to a file type"],
     "where did I save the budget spreadsheet"),
    ("drive_share_file", "Share a file with specific people or generate a link, with viewer, commenter or editor access.",
     ["file_id*:string:ID of the file", "email:string:Person to share with", "role:string=viewer|commenter|editor:Access level"],
     "give Priya edit access to the roadmap doc"),
    ("drive_download_file", "Download a file's content to a local path. Google-native documents are exported as PDF or Office formats.",
     ["file_id*:string:ID of the file", "dest*:string:Local destination path"],
     "grab a local copy of the contract"),
    ("drive_create_folder", "Create a folder, optionally inside a parent folder.",
     ["name*:string:Folder name", "parent_id:string:Parent folder ID"],
     "make a new directory for the Q4 materials"),
    # --- postgres ---
    ("postgres_run_query", "Run a read-only SQL query against the database and return rows as JSON. Queries that modify data are rejected.",
     ["sql*:string:SQL SELECT statement", "limit:integer:Maximum rows to return"],
     "how many users signed up in the last 7 days"),
    ("postgres_list_tables", "List all tables in a schema along with approximate row counts.",
     ["schema:string:Schema name, defaults to public"],
     "what tables does the database have"),
    ("postgres_describe_table", "Describe a table's columns, types, nullability, defaults, indexes and foreign keys.",
     ["table*:string:Table name", "schema:string:Schema name"],
     "what columns and indexes are on the orders table"),
    ("postgres_explain_query", "Show the execution plan for a SQL query, optionally running it with ANALYZE to get real timings.",
     ["sql*:string:SQL statement to explain", "analyze:boolean:Execute the query and report actual timings"],
     "why is this query so slow"),
    ("postgres_insert_rows", "Insert one or more rows into a table. Returns the number of rows inserted and any generated IDs.",
     ["table*:string:Target table", "rows*:array:Row objects keyed by column name"],
     "add these three records to the products table"),
    # --- stripe ---
    ("stripe_create_invoice", "Create an invoice for a customer with one or more line items. The invoice can be finalized and sent immediately.",
     ["customer_id*:string:Stripe customer ID", "items*:array:Line items with description and amount", "auto_send:boolean:Finalize and email the invoice"],
     "bill Acme Corp for the consulting hours"),
    ("stripe_refund_payment", "Refund a payment fully or partially. Refunds cannot be reversed.",
     ["payment_id*:string:ID of the payment", "amount:integer:Amount in cents for a partial refund", "reason:string=duplicate|fraudulent|requested_by_customer:Reason for the refund"],
     "give the customer their money back for the double charge"),
    ("stripe_list_customers", "List customers, optionally filtered by email. Returns IDs, names, emails and creation dates.",
     ["email:string:Filter by exact email", "limit:integer:Maximum number of customers"],
     "look up the account belonging to jane@example.com"),
    ("stripe_create_subscription", "Subscribe a customer to a recurring price. Starts billing at the next cycle unless a trial is set.",
     ["customer_id*:string:Stripe customer ID", "price_id*:string:ID of the recurring price", "trial_days:integer:Length of free trial in days"],
     "sign her up for the monthly pro plan"),
    ("stripe_get_balance", "Retrieve the current account balance, split into available and pending funds per currency.",
     [],
     "how much money do we have available right now"),
]

_TYPE_ITEMS = {"array": {"type": "string"}}


def _title(name: str) -> str:
    return name.replace("_", " ").title()


def _build_schema(tool_name: str, params: list[str]) -> dict:
    properties: dict = {}
    required: list[str] = []
    for spec in params:
        head, ptype, desc = spec.split(":", 2)
        name = head.rstrip("*")
        if head.endswith("*"):
            required.append(name)
        schema: dict = {"title": _title(name), "description": desc}
        if "=" in ptype:
            ptype, enum = ptype.split("=")
            schema["enum"] = enum.split("|")
        schema["type"] = ptype
        if ptype in _TYPE_ITEMS:
            schema["items"] = _TYPE_ITEMS[ptype]
        if not head.endswith("*"):
            schema["default"] = None
        properties[name] = schema
    out = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": f"{_title(tool_name).replace(' ', '')}Arguments",
        "type": "object",
        "properties": properties,
        "additionalProperties": False,
    }
    if required:
        out["required"] = required
    return out


def synthetic_catalog() -> list[Tool]:
    return [Tool(n, d, _build_schema(n, p), server=n.split("_")[0]) for n, d, p, _ in _SPEC]


def synthetic_queries() -> list[tuple[str, str]]:
    """(query, expected tool name) pairs."""
    return [(q, n) for n, _, _, q in _SPEC]
