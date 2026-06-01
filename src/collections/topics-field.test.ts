import { describe, it, expect } from 'vitest'
import { Exams } from './Exams'
import { Posts } from './Posts'

function topicsField(coll: any) {
  return (coll.fields as any[]).find((f) => f.name === 'topics')
}

describe('topics relationship field', () => {
  it.each([['Exams', Exams], ['Posts', Posts]])('%s has topics → tags hasMany', (_n, coll) => {
    const f = topicsField(coll)
    expect(f).toBeTruthy()
    expect(f.type).toBe('relationship')
    expect(f.relationTo).toBe('tags')
    expect(f.hasMany).toBe(true)
  })

  it('Exams keeps its tags group (hot/hay) untouched', () => {
    const grp = (Exams.fields as any[]).find((f) => f.name === 'tags')
    expect(grp.type).toBe('group')
  })
})
