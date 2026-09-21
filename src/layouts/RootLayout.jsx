import { Outlet } from "react-router";
import Sidebar from "../components/Sidebar";
import styles from "./RootLayout.module.css";

/**
 * The shell every signed-in page renders inside. <Outlet /> is where React
 * Router swaps in whichever child route matched.
 */
function RootLayout() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}

export default RootLayout;
