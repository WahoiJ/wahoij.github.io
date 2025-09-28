import styles from "../Bike.module.css";

const paratrooper = () => {
  return (
    <div className={styles.bikeArticle}>
      <div className={styles.target}>
        <div className={styles.filter}></div>
        <img src="bike/md/thumbNail/PARATROOPER.JPG" alt="Montague Paratrooper編" />
        <h2>Montague Paratrooper編</h2>
      </div>
    </div>
  );
};

export default paratrooper;