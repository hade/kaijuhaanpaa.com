// import Head from "next/head"
// import Image from "next/image"
import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from './navbar.module.css'

export default function Navbar() {
  const router = useRouter()

  return (
    <nav className={styles.nav}>
      <Link href="/">
        <a className={router.pathname === '/' ? styles.active : ''}>Gallery</a>
      </Link>
      <Link href="/cv">
        <a className={router.pathname === '/cv' ? styles.active : ''}>CV</a>
      </Link>
      <Link href="/contact">
        <a className={router.pathname === '/contact' ? styles.active : ''}>
          Contact
        </a>
      </Link>
    </nav>
  )
}
