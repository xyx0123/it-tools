export interface CKeyValueListItem {
  label: string
  value: string | string[] | number | boolean | undefined | null
  displayedValue?: string
  hideOnNil?: boolean
  placeholder?: string
  showCopyButton?: boolean
}

export type CKeyValueListItems = CKeyValueListItem[];
