import { Link } from "react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import ErrorMessage from "../components/ErrorMessage";
import Spinner from "../components/Spinner";
import { useAgents } from "../hooks/useAgents";
import styles from "./AgentsPage.module.css";

function AgentsPage() {
  const { agents, loading, error, deleteAgent } = useAgents();

  if (loading) return <Spinner label="Loading agents…" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Agents</h1>
          <p className="page-subtitle">
            {agents.length} onboarded agent{agents.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Link to="/app/agents/new" className="btn-primary-link">
          <Plus size={16} aria-hidden="true" />
          Add agent
        </Link>
      </div>

      <ErrorMessage message={error} />

      {agents.length === 0 ? (
        <p className="empty-state">
          No agents have been onboarded yet.
          <br />
          <Link to="/app/agents/new">Add the first agent</Link>
        </p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Contact</th>
                <th scope="col">Specialty</th>
                <th scope="col">Remarks</th>
                <th scope="col">
                  <span className={styles.visuallyHidden}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id}>
                  <td data-label="Name" className={styles.name}>
                    {agent.name}
                  </td>
                  <td data-label="Contact">
                    <a href={`mailto:${agent.email}`}>{agent.email}</a>
                    <a
                      href={`tel:${agent.phone.replace(/\s/g, "")}`}
                      className={styles.phone}
                    >
                      {agent.phone}
                    </a>
                  </td>
                  <td data-label="Specialty">
                    <span className={styles.specialty}>{agent.specialty}</span>
                  </td>
                  <td data-label="Remarks" className={styles.remarks}>
                    {agent.remarks}
                  </td>
                  <td data-label="Actions">
                    <div className={styles.actions}>
                      <Link
                        to={`/app/agents/${agent.id}/edit`}
                        className="btn-secondary"
                        aria-label={`Edit ${agent.name}`}
                      >
                        <Pencil size={14} aria-hidden="true" />
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => deleteAgent(agent.id)}
                        aria-label={`Delete ${agent.name}`}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AgentsPage;