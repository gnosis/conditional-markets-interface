import React from 'react'
import Decimal from 'decimal.js'

const ONE_ETH = new Decimal(10).pow(18)
const MIN_VAL_DIGITS = 4
const MIN_VAL = new Decimal(10).pow(-MIN_VAL_DIGITS)

export const formatFromWei = (inWei) => {
  const dInWei = new Decimal(inWei)
  const dInEthTruncated = dInWei.dividedBy(ONE_ETH).toSignificantDigits(MIN_VAL_DIGITS)
  const inEth = dInEthTruncated.lte(MIN_VAL) ? `<${MIN_VAL.toFixed(MIN_VAL_DIGITS)}` : `${dInEthTruncated.toSD(MIN_VAL_DIGITS).toString()}`

  return <>{inEth} &Xi;</>
}

const REPLACEMENT_RULES = [
  [/_(.*)_/g, "<em>$1</em>"]
]

export const pseudoMarkdown = (string) => {
  let parsedString = REPLACEMENT_RULES.reduce((prevString, [matcher, replacer]) => (string.replace(matcher, replacer)), string)

  return <span dangerouslySetInnerHTML={{ __html: parsedString }} />
}