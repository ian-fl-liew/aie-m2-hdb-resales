import { Link, useNavigate, useParams } from "react-router";
import AgentForm from "../components/AgentForm";
import ErrorMessage from "../components/ErrorMessage";
import Spinner from "../components/Spinner";
import { useAgents } from "../hooks/useAgents";

function EditAgentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAgent, updateAgent, submitting, error, loading } = useAgents();

  if (loading) return <Spinner label="Loading agent…" />;

  const agent = getAgent(id);

  if (!agent) {
    return (
      <div>
        <Link to="/app/agents" className="back-link">
          ← Back to agents
        </Link>
        <p className="status-message error">That agent no longer exists.</p>
      </div>
    );
  }

  const handleSubmit = async (values) => {
    try {
      await updateAgent(id, values);
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
        <h1>Edit agent</h1>
      </div>

      <ErrorMessage message={error} />
      <AgentForm
        initialValues={{
          name: agent.name ?? "",
          email: agent.email ?? "",
          phone: agent.phone ?? "",
          specialty: agent.specialty ?? "",
          remarks: agent.remarks ?? "",
        }}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Save changes"
      />
    </div>
  );
}

export default EditAgentPage;