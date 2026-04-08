import os

from github import Github

from app.services.incident_service import build_fallback_fix, get_incident


async def get_fix_suggestion(incident_id: str, file_path: str) -> dict:
    incident = get_incident(incident_id)
    if not incident:
        return {"status": "error", "message": "Incident not found"}

    token = os.environ.get("GITHUB_TOKEN")
    repo_name = os.environ.get("GITHUB_REPO")
    api_key = os.environ.get("GEMINI_API_KEY", "")

    if token and repo_name and api_key:
        try:
            repo = Github(token).get_repo(repo_name)
            file_content = repo.get_contents(file_path, ref=os.environ.get("GITHUB_BRANCH", "main")).decoded_content.decode()
            import google.generativeai as genai

            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-pro-latest")
            prompt = f"""
Use the incident and graph-native context below to generate a JSON response with:
original_code, suggested_code, explanation, diff_preview, changes

INCIDENT:
{incident}

FILE PATH:
{file_path}

FILE CONTENT:
{file_content}
"""
            response = model.generate_content(prompt)
            return {"status": "success", "fix": response.text}
        except Exception as exc:
            return {"status": "error", "message": str(exc), "fallback": build_fallback_fix(incident, file_path=file_path)}

    return build_fallback_fix(incident, file_path=file_path)
