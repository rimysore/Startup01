"""Held-out retrieval queries for the synthetic catalog.

Written BEFORE any retrieval changes were made, and not used for tuning:
retrieval decisions are made on the dev queries in `fixtures.py`; this set
is only scored to check that gains generalize. Same author as the tools,
so it is still not independent evidence about real catalogs.

Two styles per tool:
  user   - a person's paraphrase of what they want (hard: little word overlap)
  agent  - the short intent a model typically writes into `search_tools`
"""

from __future__ import annotations

# tool name -> (user-style query, agent-style query)
_HELDOUT: dict[str, tuple[str, str]] = {
    "github_create_issue": ("log a defect in the repo so the developers pick it up", "open an issue on a github repository"),
    "github_list_pull_requests": ("what code changes are people asking to have reviewed on the backend repo", "list open pull requests for a repo"),
    "github_merge_pull_request": ("the change got two approvals, go ahead and bring it into the main branch", "merge a pull request"),
    "github_search_code": ("which files in our repositories reference this config key", "search code across repositories"),
    "github_create_branch": ("I need a separate line of work for the checkout redesign", "create a new git branch"),
    "slack_post_message": ("let everyone in the engineering room know we are rolling back", "send a message to a slack channel"),
    "slack_list_channels": ("which rooms can I join in our chat workspace", "list slack channels"),
    "slack_search_messages": ("I remember someone mentioning the migration deadline in chat a while ago", "search slack message history"),
    "slack_add_reaction": ("react with a party emoji to Sam's post", "add emoji reaction to slack message"),
    "slack_get_thread_replies": ("I want to see every response people gave to that question", "get replies in a slack thread"),
    "jira_create_ticket": ("we need a tracked work item for upgrading the load balancer", "create a jira ticket"),
    "jira_transition_ticket": ("the work on PLAT-12 is finished, update its progress state", "change jira ticket status"),
    "jira_search_tickets": ("show me all the unresolved bugs in the PLAT project", "search jira tickets with JQL"),
    "jira_add_comment": ("write a remark on the ticket explaining what I tried", "comment on a jira ticket"),
    "jira_assign_ticket": ("PLAT-5 should be Lena's responsibility now", "assign jira ticket to a user"),
    "gmail_send_email": ("write to the landlord that the rent will be a day late", "send an email"),
    "gmail_search_emails": ("find that message where the hotel confirmed our booking", "search gmail messages"),
    "gmail_read_email": ("what exactly did the customer write in the message with ID 18c3", "read an email by message id"),
    "gmail_create_draft": ("write up a response to the client but don't send it yet", "create an email draft"),
    "gmail_apply_label": ("file this message under the Receipts category", "label an email"),
    "calendar_create_event": ("block off Wednesday morning for the planning session with Tom and Aisha", "create a calendar event"),
    "calendar_list_events": ("what meetings do I have this afternoon", "list calendar events in a date range"),
    "calendar_find_free_slots": ("figure out a time that works for everyone on the team call", "find free time slots for attendees"),
    "calendar_delete_event": ("I can't make the offsite anymore, remove it from my schedule", "delete a calendar event"),
    "calendar_update_event": ("move the review to Thursday instead", "reschedule a calendar event"),
    "drive_upload_file": ("save this spreadsheet from my laptop to the cloud", "upload a file to drive"),
    "drive_search_files": ("locate the slide deck from the all-hands", "search files in drive"),
    "drive_share_file": ("let the auditors read the policy document", "share a file with a user"),
    "drive_download_file": ("pull the signed agreement down onto this machine", "download a file from drive"),
    "drive_create_folder": ("set up a place to keep all the onboarding paperwork", "create a folder in drive"),
    "postgres_run_query": ("count the orders placed yesterday by region", "run a SQL query"),
    "postgres_list_tables": ("what data sets are stored in the database", "list database tables"),
    "postgres_describe_table": ("show me the structure of the customers table", "describe table schema columns"),
    "postgres_explain_query": ("check how the database would execute this statement", "explain query execution plan"),
    "postgres_insert_rows": ("load these new records into the inventory table", "insert rows into a table"),
    "stripe_create_invoice": ("send a bill for the March retainer to the client", "create a stripe invoice"),
    "stripe_refund_payment": ("reverse the charge from yesterday for this order", "refund a payment"),
    "stripe_list_customers": ("pull up everyone who is a paying client of ours", "list stripe customers"),
    "stripe_create_subscription": ("enroll the customer in the annual plan with a two week free period", "create a subscription for a customer"),
    "stripe_get_balance": ("how much cash is sitting in our payment account", "get stripe account balance"),
}


def heldout_queries(style: str) -> list[tuple[str, str]]:
    """(query, expected tool name) pairs for style 'user' or 'agent'."""
    idx = {"user": 0, "agent": 1}[style]
    return [(qs[idx], name) for name, qs in _HELDOUT.items()]
