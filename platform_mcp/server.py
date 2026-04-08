import os
import sys

from fastmcp import FastMCP

# Add project root after FastMCP imports its own protocol dependencies.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from platform_mcp.tools import claude_devops
from platform_mcp.tools import fix_generator
from platform_mcp.tools import github_integrator
from platform_mcp.tools import health_checker
from platform_mcp.tools import incident_intelligence
from platform_mcp.tools import incident_search
from platform_mcp.tools import root_cause_analyzer

mcp = FastMCP("ecommerce-knowledge-platform")

# Register Tools
mcp.add_tool(incident_search.search_incidents)
mcp.add_tool(incident_search.get_service_dependencies)
mcp.add_tool(incident_search.get_blast_radius_for_service)
mcp.add_tool(incident_search.get_incident_stats)
mcp.add_tool(claude_devops.analyze_dependencies)
mcp.add_tool(claude_devops.get_metadata)
mcp.add_tool(claude_devops.get_blast_radius)
mcp.add_tool(claude_devops.generate_rca)
mcp.add_tool(claude_devops.suggest_fix)
mcp.add_tool(claude_devops.approve_fix)
mcp.add_tool(root_cause_analyzer.analyze_root_cause)
mcp.add_tool(fix_generator.get_fix_suggestion)
mcp.add_tool(github_integrator.apply_fix_to_github)
mcp.add_tool(health_checker.check_service_health)
mcp.add_tool(incident_intelligence.predict_incident_severity)
mcp.add_tool(incident_intelligence.cluster_similar_incidents)
mcp.add_tool(incident_intelligence.detect_incident_anomalies)

if __name__ == "__main__":
    mcp.run()
