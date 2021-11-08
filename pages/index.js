import uuid from 'react-uuid'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Header from '../components/header'
import Modal from '../components/modal'
import {
  galleryPics,
  picUrl,
  landscapeWidth,
  portraitWidth,
} from '../components/galleryPics'

// import Link from "next/link"
import styles from '../styles/home.module.css'

export default function Home() {
  const [displayModal, setDisplayModal] = useState(false)
  const [activePic, setActivePic] = useState(null)
  const [title, setTitle] = useState('No title')

  const imageClicked = (picObj) => {
    console.log(`image clicked: ${picObj.alt}`)
    setTitle(picObj.alt)
    setActivePic(picObj)
    setDisplayModal(true)
  }

  const onClickOutside = (e) => {
    if (e.key === 'Escape') {
      setDisplayModal(false)
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', onClickOutside)
    return () => window.removeEventListener('click', onClickOutside)
  }, [])

  const printGallery = () => {
    const ret = Object.keys(galleryPics)
      .sort((a, b) => b - a)
      .reduce((acc, year) => {
        // acc.push(<h2>{year}</h2>)
        acc.push(
          galleryPics[year].map((picObj) => (
            <div
              className={styles.imageContainer}
              style={{
                maxWidth: picObj.w > picObj.h ? landscapeWidth : portraitWidth,
              }}
              key={uuid()}
            >
              <Image
                width={picObj.w}
                height={picObj.h}
                src={`${picUrl}${picObj.src}`}
                alt={picObj.alt}
                onClick={() => imageClicked(picObj)}
              />
              <div className={styles.caption}>{picObj.alt}</div>
            </div>
          ))
        )
        return acc
      }, [])
    return ret
  }

  return (
    <div className={'pageContainer'}>
      <Header />
      <Modal
        onClose={() => setDisplayModal(false)}
        show={displayModal}
        title={title}
        picObj={activePic}
        picUrl={picUrl}
      />
      {/* <button onClick={() => setDisplayModal(true)}>open modal</button> */}
      <main className={'main'}>{printGallery()}</main>
      <footer className={styles.footer}>Footer</footer>
    </div>
  )
}
