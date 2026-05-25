// components/Navbar.jsx
import styles from './Navbar.module.css'

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>
        <span className={styles.dot} />
        Virtual Closet
      </div>
      <ul className={styles.links}>
        <li><a href="#">Inicio</a></li>
        <li><a href="#">Mi Armario</a></li>
        <li><a href="#">Historial</a></li>
      </ul>
      <span className={styles.badge}>Online</span>
    </nav>
  )
}
