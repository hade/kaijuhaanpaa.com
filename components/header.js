// import Head from "next/head"
// import Image from "next/image"
// import Link from "next/link"
// import { useRouter } from "next/router"
import Head from 'next/head'
import Navbar from './navbar'
// import styles from "../styles/Home.module.css"
import styles from './header.module.css'

export default function Header() {
  return (
    <>
      <Head>
        <title>Kaiju Haanpää</title>
        <meta name="description" content="Kaiju Haanpää Gallery" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.headerContainer}>
        <div className={styles.nameWithDetail}>
          <div className={styles.name}>KAIJU HAANPÄÄ</div>
          <div className={styles.nameDetail}>Textile Collages</div>
        </div>
        <Navbar />
      </div>
    </>
  )
}
