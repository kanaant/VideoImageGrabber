import VideoPlayer from "./components/VideoPlayer";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Frame Extractor</h1>
        <p className={styles.subtitle}>Professional Video Analysis & Capture</p>
      </header>
      <main className={styles.main}>
        <VideoPlayer />
      </main>
    </div>
  );
}
