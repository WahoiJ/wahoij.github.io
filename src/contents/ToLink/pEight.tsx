import styles from "../Bike.module.css";

const pEight = () => {
  return (
    <div className={styles.bikeArticle}>
      <div className={styles.target}>
        <div className={styles.filter}></div>
        <img src="bike/md/thumbNail/SPEED_P8.jpg" alt="Dahon Speed P8" />
        <h2>Dahon Speed P8編</h2>
      </div>
    </div>
  );
};

export default pEight;