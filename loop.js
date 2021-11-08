const printValue = (obj) => {
  const ret = Object.keys(obj).reduce((acc, item) => {
    acc.push(`<li>${item}</li>`)
    return acc
  }, [])

  return ret
}

const studies = {
  1987: [
    'Helsinki University of Applied Arts (currently Aalto University School of Arts, Design and Architecture), Helsinki 1987 (M.A.)',
  ],
  1976: ['Helsinki University of Applied Arts (Art Teacher)'],
}

console.log(printValue(studies))
