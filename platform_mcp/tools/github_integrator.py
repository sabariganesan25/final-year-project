import os
import datetime
from github import Github

from app.services.incident_service import get_incident


def _build_fix_artifact(incident_id: str, incident: dict, file_path: str) -> tuple[str, str]:
    fix_payload = incident.get("fix_payload", {})
    explanation = fix_payload.get("explanation") or incident.get("fix_explanation") or "Approved MCP remediation."
    diff = fix_payload.get("diff") or incident.get("fix_diff") or "No diff preview was stored for this incident."
    content = "\n".join(
        [
            f"# AI Fix Artifact for Incident {incident_id}",
            "",
            f"- Service: {incident.get('service', 'unknown')}",
            f"- Severity: {incident.get('severity', 'unknown')}",
            f"- Target file: {file_path}",
            "",
            "## Explanation",
            explanation,
            "",
            "## Diff Preview",
            "```diff",
            diff,
            "```",
            "",
        ]
    )
    return f"ai-fixes/incident-{incident_id}.md", content


async def apply_fix_to_github(incident_id: str, file_path: str, approved: bool, branch_name: str = None) -> dict:
    """
    HUMAN-IN-THE-LOOP: Executes ONLY if approved=True.
    """
    if not approved:
        return {"status": "awaiting_approval", "message": "Please review the fix and call again with approved=True"}

    token = os.environ.get("GITHUB_TOKEN")
    repo_name = os.environ.get("GITHUB_REPO")
    
    if not token or not repo_name:
        return {"status": "error", "message": "GitHub credentials missing"}
        
    g = Github(token)
    try:
        repo = g.get_repo(repo_name)
        base_branch = os.environ.get("GITHUB_BRANCH", "main")
        sb = repo.get_branch(base_branch)
        incident = get_incident(incident_id)
        if not incident:
            return {"status": "error", "message": "Incident not found"}
        
        # Create new branch
        if not branch_name:
            branch_name = f"fix/incident-{incident_id}-{datetime.datetime.utcnow().strftime('%s')}"
            
        repo.create_git_ref(ref=f"refs/heads/{branch_name}", sha=sb.commit.sha)

        artifact_path, artifact_content = _build_fix_artifact(incident_id, incident, file_path)
        repo.create_file(
            artifact_path,
            f"docs: add AI remediation artifact for incident {incident_id}",
            artifact_content,
            branch=branch_name,
        )
        
        pr = repo.create_pull(
            title=f"[AUTO-FIX] Incident #{incident_id}",
            body=(
                f"Automated PR for incident #{incident_id}.\n\n"
                f"Root cause identified by Claude and approved via MCP.\n"
                f"Review the generated artifact at `{artifact_path}` and apply the suggested patch to `{file_path}`."
            ),
            head=branch_name,
            base=base_branch
        )
        
        return {
            "status": "success",
            "pr_url": pr.html_url,
            "branch_name": branch_name
        }
    except Exception as e:
        return {"status": "error", "message": f"GitHub PR Error: {str(e)}"}
