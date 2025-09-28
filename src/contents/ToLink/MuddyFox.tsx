import styles from "../Bike.module.css";

const MuddyFox = () => {
  return (
    <div className={styles.bikeArticle}>
      <div className={styles.target}>
        <div className={styles.filter}></div>
        <img src="bike/md/thumbNail/MUDDY_FOX.jpg" alt="マディフォックス編" />
        <h2>MuddyFox編</h2>
      </div>
    </div>
  );
};

export default MuddyFox;