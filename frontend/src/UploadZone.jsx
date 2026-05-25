// components/UploadZone.jsx
import { useRef, useState } from 'react'
import styles from './UploadZone.module.css'

const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_MB   = 10

export default function UploadZone({ onFile }) {
  const inputRef  = useRef(null)
  const [dragging, setDragging] = useState(false)

  function validate(file) {
    if (!ALLOWED.includes(file.type)) return 'Formato no soportado. Usa JPG, PNG o WEBP.'
    if (file.size > MAX_MB * 1024 * 1024) return `Imagen demasiado grande (máx ${MAX_MB} MB).`
    return null
  }

  function handleFile(file) {
    const err = validate(file)
    onFile(file, err)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div
      className={`${styles.zone} ${dragging ? styles.over : ''}`}
      onClick={() => inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current.click()}
    >
      <div className={styles.icon}>
        {/* upload icon */}
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="var(--accent)">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>
      <p className={styles.title}>Arrastra tu imagen aquí</p>
      <p className={styles.sub}>o haz clic para seleccionar desde tu dispositivo</p>
      <div className={styles.formats}>
        {['JPG','PNG','WEBP'].map(f => <span key={f} className={styles.tag}>{f}</span>)}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display:'none' }}
        onChange={(e) => { if (e.target.files[0]) handleFile(e.target.files[0]) }}
      />
    </div>
  )
}
