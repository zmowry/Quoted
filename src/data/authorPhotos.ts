// Static requires only — Metro can't resolve a dynamic require(path).
// Add a matching image to assets/authors/<id>.jpg and a line below whenever you add a new author.
export const authorPhotos: Record<string, number> = {
  einstein: require('@/assets/authors/einstein.jpg'),
  angelou: require('@/assets/authors/angelou.jpg'),
  twain: require('@/assets/authors/twain.jpg'),
  wilde: require('@/assets/authors/wilde.jpg'),
  keller: require('@/assets/authors/keller.jpg'),
  austen: require('@/assets/authors/austen.jpg'),
  baldwin: require('@/assets/authors/baldwin.jpg'),
  elegant: require('@/assets/authors/elegant.jpg'),
  emerson: require('@/assets/authors/emerson.jpg'),
  gibran: require('@/assets/authors/gibran.jpg'),
  king: require('@/assets/authors/king.jpg'),
  'lao-tzu': require('@/assets/authors/lao-tzu.jpg'),
  lord: require('@/assets/authors/lord.jpg'),
  'marcus-aurelius': require('@/assets/authors/marcus-aurelius.jpg'),
  roosevelt: require('@/assets/authors/roosevelt.jpg'),
  rumi: require('@/assets/authors/rumi.jpg'),
  seneca: require('@/assets/authors/seneca.jpg'),
  shakespeare: require('@/assets/authors/shakespeare.jpg'),
  thoreau: require('@/assets/authors/thoreau.jpg'), 
  woolf: require('@/assets/authors/woolf.jpg')
};