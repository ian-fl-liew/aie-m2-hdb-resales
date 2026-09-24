import { Link, useNavigate } from "react-router";
import AgentForm from "../components/AgentForm";
import ErrorMessage from "../components/ErrorMessage";
import { useAgents } from "../hooks/useAgents";

function NewAgentPage() {
  const navigate = useNavigate();
  const { addAgent, submitting, error } = useAgents();

  const handleSubmit = async (values) => {
    try {
      await addAgent({
        ...values,
        createdAt: new Date().toISOString().slice(0, 10),
      });
      navigate("/app/agents");
    } catch {
      // AgentContext exposes the request error to the form page.
    }
  };

  return (
    <div>
      <Link to="/app/agents" className="back-link">
        ← Back to agents
      </Link>

      <div className="page-header">
        <div>
          <h1>Add agent</h1>
          <p className="page-subtitle">
            Onboard an agent into the shared directory.
          </p>
        </div>
      </div>

      <ErrorMessage message={error} />
      <AgentForm onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}

export default NewAgentPage;