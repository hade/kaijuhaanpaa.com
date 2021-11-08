// import Head from "next/head"
// import Image from "next/image"
// import Link from "next/link"
import uuid from 'react-uuid'
import styles from '../styles/cv.module.css'
import Header from '../components/header'

export default function Cv() {
  const studies = {
    1987: [
      'Helsinki University of Applied Arts (currently Aalto University School of Arts, Design and Architecture), Helsinki 1987 (M.A.)',
    ],
    1976: ['Helsinki University of Applied Arts (Art Teacher)'],
    1971: [
      'Turku School of Fine Arts (currently Arts Academy at Turku University of Applied Sciences) (Painting)',
    ],
  }

  const soloExhibitions = {
    2021: ['Minkart, Vihti'],
    2020: ['Pinxinmäki, Sysmä'],
    2019: ['Gallery Luts, Lohja', 'Heinola Art Museum, Heinola'],
    2018: ['Gallery Pictor, Nummela', 'Pinxinmäki, Sysmä'],
    2016: ['Gallery 5, Oulu'],
    2015: ['Gallery Pictor, Nummela'],
    2014: ['Gallery Aino, Järvenpää (Invited)'],
    2012: ['Kokki Gallery, Ikkala'],
    2011: ['Gallery Pictor, Nummela'],
    2005: ['Rauma Hall, Rauma (Invited)'],
    2001: ['Gallery Pictor, Nummela', 'Heinola Art Museum, Heinola'],
    2000: ['Lapua Cultural Center, Patruuna Gallery, Lapua'],
    1999: [
      'Gallery Becker, Jyväskylä',
      'Studio Hill, Fiskars (Invited)',
      'Gallery Uusikuva, Kotka',
      'Hämeenlinna Cultural Center, Hämeenlinna',
    ],
    1998: [
      'Gallery Art&Weise, Wien, Austria (Invited)',
      'IIASA, Laxenburg, Austria (Invited)',
      'Gallery Bronda, Helsinki',
      'Matinpalo Museum, Nastola',
    ],
    1997: ['Gallery Joella, Turku'],
    1996: ['Espoo Cultural Center, Espoo'],
    1995: [
      'Gallery Kapriisi, Kuopio',
      'Piha Gallery, Lahti',
      'Seitsenkulma Gallery, Nummela',
    ],
    1994: [
      'Del Oro Gallery, Santa Fe, New Mexico, USA (Invited)',
      'Eckerö Summer Art, Ahvenanmaa (Invited)',
      'Gallery Bremer, Karkkila',
    ],
    1993: [
      'Gallery of City Library, Toijala (Invited)',
      'Gallery Tähdenlento, Lohja (Invited)',
      'Kässä Gallery, Virkkala (Invited)',
      'Seitsenkulma Gallery, Nummela',
    ],
    1992: ['St Gregory Hall, Athens, Ga, USA'],
    1971: ['Turku Student Theatre, Turku'],
    1970: ['Pinella, Turku'],
  }

  const groupExhibitions = {
    2021: ['A Home for Art, Lohja, Housing Fair, Lohja'],
    2018: [
      'Tuli, vesi, maa – Zakowski, Räsänen, Haanpää, Gumbostrand Konst & Form, Söderkulla',
    ],
    2017: ['Art Collection of Hiidenheimo Foundation, Gallery Pictor, Nummela'],
    2016: [
      `’Animals’, (Länsi-Uusimaa Artists’ Association), Kässä Gallery, Lohja`,
    ],
    2015: [`’Artists for an Art School’, Kässä Gallery, Lohja`],
    2014: [
      `‘Tatsi 2014’, Old Library, Savonlinna (Invited)`,
      `‘Swim and Look’(Länsi-Uusimaa Artists’ Association), Swimming Centre, Lohja`,
    ],
    2013: [
      `‘Light Wins Darkness’, Lohjantähti Mall, Lohja (Invited)`,
      `‘ Artists in Vihti’, Gallery Pictor, Nummela (Invited)`,
      `‘Got there!’, Gallery Bremer, Karkkila (Invited)`,
      `‘Ars Tytyri’, Tytyri Mine Museum, Lohja`,
      `’Ornamo Exhibition in Kaapelitehdas’, Helsinki`,
    ],
    2012: [
      `‘Länsi-Uusimaa Artists Association’s Take Away’, Gallery Vikholm, Lohja`,
      `‘Contemporary Art in Vihti’, Gallery Pictor, Nummela (Invited)`,
      `‘Länsi-Uusimaa Artists Association 30 Years’, Studio of the Main Library, Lohja`,
    ],
    2011: [`‘Contemporary Art in Vihti’, Gallery Pictor, Nummela (Invited)`],
    2010: [
      `‘Kaiju Haanpää & Marketta Urpo’, Tila Gallery, Helsinki`,
      `’Art Purchases by Hiidenheimo Foundation’, Niuhala Show Room, Vihti`,
      `’Christmas Exhibition’, Tila Gallery, Helsinki`,
    ],
    2007: [`‘Vihti Artists’, Gallery Pictor, Nummela (Invited)`],
    2002: [
      `’Länsi-Uusimaa Artists Association 20 Years’, Laurentius Hall, Lohja`,
      `‘Acme – Life of Women’, Kässä Gallery, Lohja Summer, Lohja (Invited)`,
      `‘Kaiju Haanpää & Pirkko Ruokolainen’, Olkkala Manor Exhibition Space, Vihti`,
    ],
    2000: [
      `‘Got you!’, Espoo Cultural Center, Espoo`,
      `‘International Zonta Exhibition’, Pegge Hopper Gallery, Honolulu, Hawai, USA (Invited)`,
      `’Kaiju Haanpää & Kerttu Horila’, Seinäjoki Art Hall, Seinäjoki`,
      `‘Kaiju Haanpää & Kerttu Horila’, Varkaus Art Museum`,
      `‘Sechs Himmelsrichtungen’, Station 3, Wien, Austria (Invited)`,
    ],
    1999: [
      `Contemporary Art in Vihti’, Gallery Pictor, Nummela (Invited)`,
      `‘Kitchen Sisters’, Seniwati Gallery, Ubud, Bali, Indonesia`,
      `Kitchen Sisters’, Gallery Pictor, Nummela`,
    ],
    1998: [
      `‘Christmas Exhibition’, Gallery Art &Weise, Wien, Austria (Invited)`,
    ],
    1997: [
      `‘Kaiju Haanpää & Pirkko Kuusela’, Museum Warehouse, Jokioinen`,
      `‘Together II’, Päivölä Recreation Home, Vihti`,
    ],
    1996: [
      `‘Pictorial Moment’, Gallery Pictor, Nummela`,
      `‘Länsi-Uusimaa Artists Association’, Studio of the Main Library, Lohja (LUTS)`,
      `‘TEXO Today’, Museum of Central Finland, Jyväskylä`,
      `‘Kitchen Sisters’, Promenadi Gallery, Hyvinkää`,
    ],
    1995: [
      `‘Kitchen Sisters’, Studio of the Lohja Art School, Lohja`,
      `‘Kitchen Sisters’, Mältinranta Art Center, Tampere`,
      `‘Women’s Laugh’, Turku Cultural Center, Turku`,
    ],
    1994: [
      `’Christmas Exhibition’, Del Oro Gallery, Santa Fe, New Mexico, USA (Invited)`,
      `‘Länsi-Uusimaa Artists Association’, Kässä Gallery, Virkkala`,
      `‘Laurinkatu -Art Street’, Lohja Summer, Lohja (Invited)`,
      `‘Together I’, Gallery Pictor, Nummela(Invited)`,
    ],
    1992: [`’Museum Without Walls’, Bemus Point, N.Y., USA`],
    1972: [`’Young Artists’, Helsinki Art Hall, Helsinki`],
    1971: [
      `’Hämeenlinna Artists Association’, Hämeenlinna Art Museum, Hämeenlinna`,
    ],
    1970: [
      `’Graduating Students of Turku School of Fine Arts’, Wäinö Aaltonen Art Museum, Turku`,
      `‘Students of Turku Art School’, Tammisaari`,
    ],
  }

  const books = {
    2019: [`‘Unen tuoja’, novel`],
    2015: [`‘Kosketuksia’, poems`],
  }

  const collections = [
    `Hiidenheimo Foundation, Vihti; Vihti Community; Savings Bank of Länsi-Uusimaa; Aalto University School of Business, Helsinki; Museum of Modern Art in Tampere, Tampere City; SYLVA/Parents Association for Cancer Children, Helsinki; Länsi-Uusimaa Center for Adult Education.`,
    `Private Collectors in Finland and Abroad.`,
  ]

  const memberships = [
    `Painters’ Union in Finland; Ornamo /The Finnish Association of Designers (TEXO and Artists-O), Länsi-Uusimaa Artists’ Association (LUTS).`,
  ]

  const grants = [
    `Hiidenheimo Foundation 2014; ORNAMO/ The Finnish Association of Designers 1998; Magistrat der Stadt Wien – Kultur 1998 ; Nokia Mobile Phones Austria 1998; CIMO / Centre for International Mobility 1995; Vihti Community Cultural Award; 1989 Turku Saskiat 1971`,
  ]

  const printValues = (obj) => {
    const ret = Object.keys(obj)
      .sort((a, b) => b - a)
      .reduce((acc, year) => {
        acc.push(
          <div key={year}>
            <strong>{year}</strong>
          </div>
        )
        acc.push(
          obj[year].map((line) => (
            // console.log('line: ', line)
            <div key={uuid()}>{line}</div>
          ))
        )
        return acc
      }, [])
    return ret
  }

  const printNoYear = (arr) => arr.map((item) => <div key={uuid()}>{item}</div>)

  const other = {
    2017: [`Participating in Konstrundan`],
    2014: [
      `‘Länsi-Uuusimaa Artists’ Association’s Annual Exhibition 2014’, Curator`,
    ],
    2013: [
      `Victoria Martelin: ‘Kaiju Haanpään tuotannon keskeiset aiheet ja niiden merkitys’(’Central Motives and their Meaning to Kaiju Haanpää’s Art’), Master Thesis, University of Lappland`,
    ],
    2001: [
      `‘Lesken lehti’, Gallery Pictor, Nummela (textile collages, poems)`,
      `Works in Chydenia Building’s Opening, Helsinki School of Economics, and in Lohja Medieval Church`,
    ],
    1998: [
      `‘Black Madonna’, Ruprechtskirche, Wien, Austria (textile collages, dresses, staging)`,
    ],
    1997: [`Unicef Gift Box Europe, cover picture`],
  }

  return (
    <div className={'pageContainer'}>
      <Header />
      <main className={'main'}>
        <div className={'grid'}>
          <h1>CV</h1>
          <section key="description" className={styles.description}>
            <strong>KAIJU HAANPÄÄ</strong>
            <br />
            ARTIST, M.A. <br />
            BORN 1948 IN HELSINKI <br />
            WORKS IN HUHMARI, FINLAND
          </section>
          <section key="studies">
            <h2>Studies</h2>
            {printValues(studies)}
          </section>
          <section key="solo">
            <h2>Solo Exhibitions</h2>
            {printValues(soloExhibitions)}
          </section>
          <section key="group">
            <h2>Group Exhibitions</h2>
            {printValues(groupExhibitions)}
          </section>
          <section key="books">
            <h2>Books</h2>
            {printValues(books)}
          </section>
          <section key="other">
            <h2>Other</h2>
            {printValues(other)}
          </section>
          <section key="collections">
            <h2>Collections</h2>
            {printNoYear(collections)}
          </section>
          <section key="memberships">
            <h2>Memberships</h2>
            {printNoYear(memberships)}
          </section>
          <section key="grants">
            <h2>Grants</h2>
            {printNoYear(grants)}
          </section>
        </div>
      </main>
    </div>
  )
}
