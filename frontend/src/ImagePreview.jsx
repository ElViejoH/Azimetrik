// components/ImagePreview.jsx
import { useEffect, useState } from 'react'
import styles from './ImagePreview.module.css'

export default function ImagePreview({ file, onReset }) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    const nextUrl = URL.createObjectURL(file)
    setUrl(nextUrl)

    return () => URL.revokeObjectURL(nextUrl)
  }, [file])

  return (
    <div className={styles.wrap}>
      <div className={styles.imgBox}>
        <img src={url} alt="Imagen seleccionada" className={styles.img} />
        <div className={styles.overlay} />
        <div className={styles.info}>
          <span className={styles.name}>{file.name}</span>
          <button className={styles.btnChange} onClick={onReset}>
            Cambiar imagen
          </button>
        </div>
      </div>
    </div>
  )
}
