const R = /\\([^$])/gm

function unescape(value) {
  const origLength = value.length
  let escaped = value
  let escapedLength = escaped.length

  const matches = value.matchAll(R)

  for (let m of matches) {
    let [whole, replacement] = m

    if (replacement == "n") {
       replacement = "\n"
    } else if (value == "r") {
      replacement = "\r"
    }

    const diff = origLength - escapedLength;
    const i = m.index - diff

    escaped = escaped.substring(0, i)
      + replacement
      + escaped.substring(i + whole.length)

    escapedLength = escaped.length
  }

  return escaped
}

module.exports = unescape
