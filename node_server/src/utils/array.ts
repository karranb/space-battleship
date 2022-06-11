export function getLastItem<SomeType>(list: SomeType[]): SomeType | undefined {
  return list?.slice(-1)[0]
}
