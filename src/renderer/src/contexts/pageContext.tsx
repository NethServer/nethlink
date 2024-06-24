import { PAGES, PageType } from "@shared/types"
import { log } from "@shared/utils/logger"
import { getPageFromQuery, isDev } from "@shared/utils/utils"
import { createContext, useContext, useEffect, useState } from "react"

export const PageCtx = createContext<PageType | undefined>(undefined)

export const usePageCtx = () => {
  return useContext(PageCtx)
}
export const PageContext = ({ children }) => {
  const [page, setPage] = useState<PageType | undefined>()

  const getQuery = (): string => {
    return location.search || location.hash
  }

  useEffect(() => {

    const query = getQuery()
    const props =
      query
        .split('?')[1]
        ?.split('&')
        ?.reduce<any>((p, c) => {
          const [k, v] = c.split('=')
          return {
            ...p,
            [k]: v
          }
        }, {}) || {}
    const pageData: PageType = {
      query,
      page: props.page,
      props
    }
    isDev() && log(pageData)
    setPage(() => pageData)
    window.document.title = pageData.page
  }, [])

  return (
    <PageCtx.Provider value={page}>
      {children}
    </PageCtx.Provider>
  )

}
