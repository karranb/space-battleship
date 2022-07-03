export function getLastItem<SomeType>(list: SomeType[]): SomeType | undefined {
  return list?.slice(-1)[0]
}

export function getRandomItem<SomeType>(list: SomeType[]): SomeType {
  return list[Math.floor(Math.random() * list.length)]
}
