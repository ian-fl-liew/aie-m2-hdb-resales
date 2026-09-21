import { PulseLoader } from "react-spinners";
import styles from "./Spinner.module.css";

function Spinner({ size = 10, label = "Loading…" }) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <PulseLoader color="var(--primary-500)" size={size} />
      <span className={styles.label}>{label}</span>
    </div>
  );
}

export default Spinner;
