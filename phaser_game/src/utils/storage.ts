export const getFromLocalStorage = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch (err) {
    return null
  }
}

export const setToLocalStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch (err) {
    null
  }
}
