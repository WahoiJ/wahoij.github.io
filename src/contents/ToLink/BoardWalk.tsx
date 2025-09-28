import styles from "../Bike.module.css";

const BoardWalk = () => {
  return (
    <div className={styles.bikeArticle}>
      <div className={styles.target}>
        <div className={styles.filter}></div>
        <img src="bike/md/thumbNail/BoardWalk.jpg" alt="ボードウォーク編" />
        <h2>ボードウォーク編</h2>
      </div>
    </div>
  );
};

export default BoardWalk;