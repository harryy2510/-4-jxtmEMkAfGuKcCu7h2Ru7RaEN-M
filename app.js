const CNR_VALUES = ['PBFZC00004392020', 'PBFZE10028092019']

const puppeteer = require('puppeteer')
const tesseract = require('node-tesseract-ocr')

const solveCaptcha = async (filePath) => {
  const config = {
    lang: 'eng',
    oem: 1,
    psm: 7,
  }
  return tesseract
    .recognize(filePath, config)
    .then((text) => text.replace(/\D/g, ''))
}

const captchaImagePath = 'assets/captcha'
const resultImagePath = 'assets/result'
const captchaImageSelector = '#captcha_image'
const captchaInputSelector = '#captcha'
const cnrInputSelector = '#cino'
const submitSelector = '#searchbtn'

;(async () => {
  // boot
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  for (let i = 0; i < CNR_VALUES.length; i++) {
    const CNR_VALUE = CNR_VALUES[i]

    console.log('\nLoading page for CNR: ', CNR_VALUE)

    // open ecourts page
    await page.goto('https://services.ecourts.gov.in', {
      waitUntil: 'networkidle2',
    })

    console.log('Saving captcha, Path:', `${captchaImagePath}/captcha-${i}.png`)

    // save captcha image locally for solving
    const captchaImage = await page.$(captchaImageSelector)
    await captchaImage.screenshot({
      path: `${captchaImagePath}/captcha-${i}.png`,
    })

    console.log(
      'Reading captcha, Path: ',
      `${captchaImagePath}/captcha-${i}.png`
    )

    // recognize captcha value
    const captchaValue = await solveCaptcha(
      `${captchaImagePath}/captcha-${i}.png`
    )

    console.log('Captcha value: ', captchaValue)

    console.log(
      'Input form value, Selector: ',
      cnrInputSelector,
      ', Value: ',
      CNR_VALUE
    )

    // input cnr value in form
    await page.focus(cnrInputSelector)
    await page.type(cnrInputSelector, CNR_VALUE)

    console.log(
      'Input form value, Selector: ',
      captchaInputSelector,
      ', Value: ',
      captchaValue
    )

    // input captcha value in form
    await page.focus(captchaInputSelector)
    await page.type(captchaInputSelector, captchaValue)

    console.log('Submitting form, Selector: ', submitSelector)

    // submit form
    await page.click(submitSelector)

    // wait for result
    await page.waitForTimeout(3000)

    console.log(
      'Taking page screenshot, Path: ',
      `${resultImagePath}/page-${i}.png`
    )

    // take screenshot of result page
    await page.screenshot({ path: `${resultImagePath}/page-${i}.png` })

    console.log('Task finished\n')
  }

  // cleanup
  await browser.close()
})()
