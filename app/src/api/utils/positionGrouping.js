export const resolvePositionGrouping = (groups) => {
  const sets = {}

  groups.forEach(([id]) => {
    let ids = id.split(/&/g)

    while (ids.length > 0) {
      const matches = groups.reduce((arr, group) => {
        const [ otherId ] = group
        const otherIds = otherId.split(/&/g)
        if (ids.every((id) => otherIds.includes(id))) {
          arr.push(group)
        }
        return arr
      }, [])
  
      const groupName = ids.join('&')
      
      if (!sets[groupName]) {
        sets[groupName] = []
      }
  
      matches.forEach((match) => {
        sets[groupName].push(match[1])
      })

      ids.pop()
    }
  })

  const guaranteedWin = Math.min(...(Object.values(sets)).flat())
  const minSets = [["*", guaranteedWin]]

  Object.keys(sets).forEach((setId) => {
    const values = sets[setId]
    minSets.push([setId, Math.min(...values)])
  })

  return minSets
}