// pages/Home.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { classifyImage } from "./predict";
import logo from "./assets/logo.png";
import ImagePreview from "./ImagePreview";
import ResultCard from "./ResultCard";
import styles from './Home.module.css'

const STORAGE_KEY = 'virtual-closet-items'

export default function Home() {
  const inputRef = useRef(null)
  const [activeTab, setActiveTab] = useState('Inicio')
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [closetItems, setClosetItems] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [openMenuId, setOpenMenuId] = useState(null)
  const [editingItemId, setEditingItemId] = useState(null)
  const [editingCategory, setEditingCategory] = useState('')

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (!saved) return
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        setClosetItems(parsed)
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(closetItems))
  }, [closetItems])

  const categories = useMemo(() => {
    const unique = new Set(closetItems.map((item) => item.category))
    return ['Todas', ...Array.from(unique).sort((a, b) => a.localeCompare(b))]
  }, [closetItems])

  const filteredClosetItems = useMemo(() => {
    if (selectedCategory === 'Todas') return closetItems
    return closetItems.filter((item) => item.category === selectedCategory)
  }, [closetItems, selectedCategory])

  const recentCount = useMemo(() => {
    const threshold = Date.now() - (7 * 24 * 60 * 60 * 1000)
    return closetItems.filter((item) => new Date(item.createdAt).getTime() >= threshold).length
  }, [closetItems])

  function validateFile(nextFile) {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxMb = 10

    if (!allowed.includes(nextFile.type)) {
      return 'Formato no soportado. Usa JPG, PNG o WEBP.'
    }
    if (nextFile.size > maxMb * 1024 * 1024) {
      return `Imagen demasiado grande (máx ${maxMb} MB).`
    }
    return null
  }

  function handleFile(nextFile, validationError) {
    setFile(nextFile)
    setError(validationError)
    setResults(null)
  }

  function handleFileSelect(nextFile) {
    if (!nextFile) return
    handleFile(nextFile, validateFile(nextFile))
  }

  function handleReset() {
    setFile(null)
    setError(null)
    setResults(null)
    clearSelectedFile()
  }

  function clearSelectedFile() {
    setFile(null)
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  async function handleAnalyze() {
    if (!file) return
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const [topResult] = await classifyImage(file, 1)
      if (!topResult) {
        throw new Error('No se pudo obtener una categoría para esta imagen.')
      }

      const imageUrl = await fileToDataUrl(file)
      const closetEntry = {
        id: crypto.randomUUID(),
        filename: file.name,
        imageUrl,
        category: topResult.category,
        probability: topResult.probability,
        createdAt: new Date().toISOString(),
      }

      setResults([topResult])
      setClosetItems((current) => [closetEntry, ...current])
      setSelectedCategory(topResult.category)
      setActiveTab('Closet')
      clearSelectedFile()
    } catch (err) {
      const msg = err.message.includes('fetch')
        ? 'No se pudo conectar con el servidor. ¿Está corriendo la API en el puerto 8000?'
        : err.message
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  function handleNavClick(label) {
    if (label === 'Cámara') {
      setActiveTab('Inicio')
      setOpenMenuId(null)
      inputRef.current?.click()
      return
    }

    if (label === 'Closet') {
      setActiveTab('Closet')
      setOpenMenuId(null)
      return
    }

    setOpenMenuId(null)
    setActiveTab('Inicio')
  }

  function handleToggleMenu(itemId) {
    setOpenMenuId((current) => current === itemId ? null : itemId)
  }

  function handleStartEdit(item) {
    setEditingItemId(item.id)
    setEditingCategory(item.category)
    setOpenMenuId(null)
  }

  function handleSaveCategory(itemId) {
    const nextCategory = editingCategory.trim()
    if (!nextCategory) return

    setClosetItems((current) => current.map((item) => (
      item.id === itemId
        ? { ...item, category: nextCategory }
        : item
    )))
    setSelectedCategory(nextCategory)
    setEditingItemId(null)
    setEditingCategory('')
  }

  function handleCancelEdit() {
    setEditingItemId(null)
    setEditingCategory('')
  }

  function handleDeleteItem(itemId) {
    setClosetItems((current) => current.filter((item) => item.id !== itemId))
    setOpenMenuId(null)
    if (editingItemId === itemId) {
      handleCancelEdit()
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.phone}>
        <section className={styles.hero}>
          <div className={styles.avatarBadge}>
            <img src={logo} alt="Azimetrik" className={styles.heroLogo} />
          </div>
          <h1 className={styles.h1}>Azimetrik</h1>
          <p className={styles.sub}>Organiza tu colección con una vista simple y ordenada.</p>
        </section>

        <section className={styles.statsStrip}>
          {[
            { value: String(closetItems.length), label: 'Prendas', icon: <ShirtMiniIcon /> },
            { value: String(Math.max(categories.length - 1, 0)), label: 'Categorías', icon: <TrendIcon /> },
            { value: String(recentCount), label: 'Recientes', icon: <SparklesIcon /> },
          ].map((s) => (
            <article key={s.label} className={styles.statCard}>
              <div className={styles.statIcon}>{s.icon}</div>
              <span className={styles.statVal}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </article>
          ))}
        </section>

        {activeTab === 'Closet' ? (
          <section className={styles.closetSection}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Closet</h2>
                <p className={styles.sectionCopy}>Filtra tu colección por tipo de prenda.</p>
              </div>
              <span className={styles.sectionBadge}>{filteredClosetItems.length}</span>
            </div>

            <div className={styles.filterBar}>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`${styles.filterChip} ${selectedCategory === category ? styles.filterChipActive : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            {filteredClosetItems.length === 0 ? (
              <div className={styles.emptyCloset}>
                <span className={styles.emptyIcon}><ClosetIcon /></span>
                <h3 className={styles.emptyTitle}>Tu closet está vacío</h3>
                <p className={styles.emptyText}>Agrega una imagen para crear tu primera prenda guardada.</p>
              </div>
            ) : (
              <div className={styles.closetGrid}>
                {filteredClosetItems.map((item) => (
                  <article key={item.id} className={styles.closetCard}>
                    <div className={styles.closetCardTop}>
                      <img src={item.imageUrl} alt={item.filename} className={styles.closetImage} />
                      <div className={styles.cardActions}>
                        <button
                          type="button"
                          className={styles.menuButton}
                          onClick={() => handleToggleMenu(item.id)}
                          aria-label="Opciones de la prenda"
                        >
                          <DotsIcon />
                        </button>

                        {openMenuId === item.id && (
                          <div className={styles.menuPanel}>
                            <button
                              type="button"
                              className={styles.menuItem}
                              onClick={() => handleStartEdit(item)}
                            >
                              Editar categoría
                            </button>
                            <button
                              type="button"
                              className={`${styles.menuItem} ${styles.menuItemDanger}`}
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              Eliminar prenda
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.closetMeta}>
                      {editingItemId === item.id ? (
                        <div className={styles.editForm}>
                          <input
                            value={editingCategory}
                            onChange={(e) => setEditingCategory(e.target.value)}
                            className={styles.editInput}
                            placeholder="Nueva categoría"
                          />
                          <div className={styles.editActions}>
                            <button
                              type="button"
                              className={styles.editButton}
                              onClick={() => handleSaveCategory(item.id)}
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              className={`${styles.editButton} ${styles.editButtonGhost}`}
                              onClick={handleCancelEdit}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className={styles.closetCategory}>{item.category}</span>
                          <span className={styles.closetConfidence}>{Math.round(item.probability * 100)}% confianza</span>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            <section className={styles.captureSection}>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className={styles.fileInput}
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />

              {!file ? (
                <button
                  type="button"
                  className={styles.captureButton}
                  onClick={() => inputRef.current?.click()}
                >
                  <span className={styles.captureIcon}>
                    <CameraIcon />
                  </span>
                  <span className={styles.captureTitle}>Comienza tu colección</span>
                  <span className={styles.captureText}>
                    Captura tus primeras prendas con una imagen.
                  </span>
                </button>
              ) : (
                <div className={styles.previewBlock}>
                  <ImagePreview file={file} onReset={handleReset} />
                  <button
                    className={styles.btnAnalyze}
                    onClick={handleAnalyze}
                    disabled={!file || !!error || loading}
                  >
                    {loading
                      ? <><span className={styles.spinner} /> Guardando prenda...</>
                      : <>Guardar en closet <ArrowIcon /></>
                    }
                  </button>
                </div>
              )}

              {error && (
                <div className={styles.errorBox}>
                  {error}
                </div>
              )}
            </section>

            <section className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <SparklesIcon />
              </div>
              <div>
                <h2 className={styles.featureTitle}>Categoría definitiva</h2>
                <p className={styles.featureText}>
                  Cada imagen se guarda con la categoría de mayor porcentaje para mantener tu closet ordenado.
                </p>
              </div>
            </section>
          </>
        )}

        <nav className={styles.bottomNav} aria-label="Navegación principal">
          {[
            { label: 'Inicio', icon: <HomeIcon /> },
            { label: 'Cámara', icon: <CameraSmallIcon /> },
            { label: 'Closet', icon: <ShirtMiniIcon /> },
          ].map((item) => {
            const isActive = (item.label === 'Inicio' && activeTab === 'Inicio')
              || (item.label === 'Closet' && activeTab === 'Closet')

            return (
              <button
                key={item.label}
                type="button"
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                onClick={() => handleNavClick(item.label)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </main>
  )
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('No se pudo guardar la imagen en el closet.'))
    reader.readAsDataURL(file)
  })
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  )
}

function ShirtMiniIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 4 6 6 3.5 7.5 5 11l2-1v9h10v-9l2 1 1.5-3.5L18 6l-2-2-2 1h-4L8 4Z" />
    </svg>
  )
}

function TrendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 16 10 10l4 4 6-6" />
      <path d="M14 8h6v6" />
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z" />
      <path d="M19 14 20 16.5 22.5 17.5 20 18.5 19 21l-1-2.5-2.5-1 2.5-1L19 14Z" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h3l1.5-2h7L17 8h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9.5V20h14V9.5" />
      <path d="M9.5 20v-6h5v6" />
    </svg>
  )
}

function CameraSmallIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h3l1.5-2h7L17 8h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  )
}

function ClosetIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12v18" />
      <path d="M6 3v18" />
      <path d="M6 11h12" />
      <path d="M10 7h.01" />
      <path d="M10 15h.01" />
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  )
}
