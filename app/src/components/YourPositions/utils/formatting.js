import React from 'react'
import Decimal from 'decimal.js'

const ONE_ETH = new Decimal(10).pow(18)
const MIN_VAL_DIGITS = 8
const MIN_VAL = new Decimal(10).pow(-MIN_VAL_DIGITS)

export const formatFromWei = (inWei) => {
  const dInWei = new Decimal(inWei)
  const dInEthTruncated = dInWei.dividedBy(ONE_ETH).toSignificantDigits(MIN_VAL_DIGITS)

  const inEth = dInEthTruncated.lte(new Decimal(0)) ? `<${MIN_VAL.toFixed(MIN_VAL_DIGITS)}` : `${dInEthTruncated.toPrecision(MIN_VAL_DIGITS)}`

  return <>{inEth} &Xi;</>
}

const REPLACEMENT_RULES = [
  [/_(.*)_/g, "<em>$1</em>"]
]

export const pseudoMarkdown = (string) => {
  let parsedString = REPLACEMENT_RULES.reduce((prevString, [matcher, replacer]) => (string.replace(matcher, replacer)), string)

  return <span dangerouslySetInnerHTML={{ __html: parsedString }} />
}