/**
 * External links. The main process only hands an https URL to the OS browser
 * when its host is on this list (Electron security checklist item 13), so a
 * compromised or confused renderer cannot open arbitrary URLs or protocols.
 */
export const ALLOWED_EXTERNAL_HOSTS: readonly string[] = [
  'www.w3.org',
  'www.nvaccess.org',
  'support.microsoft.com',
  'learn.microsoft.com',
  'www.electronjs.org',
  'medlineplus.gov'
]

export function isAllowedExternalUrl(value: string): boolean {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  return (
    url.protocol === 'https:' &&
    url.username === '' &&
    url.password === '' &&
    url.port === '' &&
    ALLOWED_EXTERNAL_HOSTS.includes(url.hostname)
  )
}

export interface ResourceLink {
  id: string
  title: string
  description: string
  url: string
  category: 'Accessibility' | 'Clinical reference' | 'Product'
}

export const RESOURCE_LINKS: readonly ResourceLink[] = [
  {
    id: 'wcag-quickref',
    title: 'WCAG 2.2 quick reference',
    description: 'How to meet each Web Content Accessibility Guidelines success criterion.',
    url: 'https://www.w3.org/WAI/WCAG22/quickref/',
    category: 'Accessibility'
  },
  {
    id: 'nvda-guide',
    title: 'NVDA user guide',
    description: 'Commands and settings for the NVDA screen reader on Windows.',
    url: 'https://www.nvaccess.org/files/nvda/documentation/userGuide.html',
    category: 'Accessibility'
  },
  {
    id: 'narrator-guide',
    title: 'Complete guide to Narrator',
    description: 'Microsoft’s guide to the screen reader built into Windows.',
    url: 'https://support.microsoft.com/windows/complete-guide-to-narrator-e4397a0d-ef4f-b386-d8ae-c172f109bdb1',
    category: 'Accessibility'
  },
  {
    id: 'contrast-themes',
    title: 'Contrast themes in Windows',
    description: 'Turn on a Windows contrast theme to check CareConnect in high contrast.',
    url: 'https://support.microsoft.com/windows/change-color-contrast-in-windows-fedc744c-90ac-69df-aed5-c8a90125e696',
    category: 'Accessibility'
  },
  {
    id: 'medlineplus',
    title: 'MedlinePlus health topics',
    description: 'Plain-language health information from the U.S. National Library of Medicine.',
    url: 'https://medlineplus.gov/healthtopics.html',
    category: 'Clinical reference'
  },
  {
    id: 'electron-accessibility',
    title: 'Electron accessibility',
    description: 'How Electron exposes app content to assistive technology.',
    url: 'https://www.electronjs.org/docs/latest/tutorial/accessibility',
    category: 'Product'
  }
]
