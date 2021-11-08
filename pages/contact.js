import Image from 'next/image'
import Header from '../components/header'

export default function Contact() {
  return (
    <div className={'pageContainer'}>
      <Header />
      <main className={'main'}>
        <div className={'grid'}>
          <h1>Contact</h1>
          <div className={'textAlignCenter'}>
            <Image
              className={'textAlignCenter'}
              width={250}
              height={700}
              src={'/img/business_card.jpg'}
              alt={'Business Card'}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
