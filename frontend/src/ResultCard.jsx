// components/ResultCard.jsx
import { useEffect, useRef, useState } from 'react'
import styles from './ResultCard.module.css'

export default function ResultCard({ result, rank, delay = 0 }) {
  const [barWidth, setBarWidth] = useState(0)
  const pct = (result.probability * 100).toFixed(1)

  // Animate bar after mount
  useEffect(() => {
    const t = setTimeout(() => setBarWidth(result.probability * 100), 100 + delay)
    return () => clearTimeout(t)
  }, [result.probability, delay])

  const isTop = rank === 1

  return (
    <div
      className={`${styles.card} ${isTop ? styles.top : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={styles.row}>
        <div className={styles.left}>
          <span className={`${styles.rank} ${isTop ? styles.rankTop : ''}`}>{rank}</span>
          <span className={styles.name}>
            {result.category}
            {isTop && <span className={styles.badge}>✦ Top</span>}
          </span>
        </div>
        <span className={`${styles.pct} ${isTop ? styles.pctTop : ''}`}>{pct}%</span>
      </div>
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${barWidth}%`, transition: 'width .85s cubic-bezier(.4,0,.2,1)' }}
        />
      </div>
    </div>
  )
}
