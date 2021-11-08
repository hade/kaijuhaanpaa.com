import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import ReactDOM from 'react-dom'

import styles from './modal.module.css'

const Modal = ({ show, onClose, title, picObj, picUrl }) => {
  const [isBrowser, setIsBrowser] = useState(false)

  useEffect(() => {
    setIsBrowser(true)
  }, [])

  const handleCloseClick = (e) => {
    e.preventDefault()
    onClose()
  }

  const modalContent = show ? (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <a href="#" onClick={handleCloseClick} className={styles.closeX}>
            &#10006;
          </a>
        </div>

        <div className={styles.modalBody}>
          <Image
            width={picObj.w}
            height={picObj.h}
            src={`${picUrl}${picObj.src}`}
            alt={picObj.alt}
            layout={'fixed'}
          />
        </div>
        {title && <div className={styles.modalTitle}>{title}</div>}
      </div>
    </div>
  ) : null

  if (isBrowser) {
    return ReactDOM.createPortal(
      modalContent,
      document.getElementById('__next')
    )
  }
  return null
}

export default Modal
