import { RESOURCE_LINKS, type ResourceLink } from '../../../../shared/links'
import { useApi } from '../../api/ApiContext'
import { describeFailure } from '../../commands/defaultCommands'
import { Icon } from '../../components/Icon'
import { useStatus } from '../../state/AppStateProvider'
import './resources.css'

const CATEGORIES: readonly ResourceLink['category'][] = Array.from(new Set(RESOURCE_LINKS.map((link) => link.category)))

function categoryHeadingId(category: string): string {
  return `resources-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

/**
 * Reference links, grouped by category. Opening one asks the main process,
 * which only hands allow-listed https URLs to the system browser (Electron
 * security checklist item 13), so a refusal is reported rather than ignored.
 */
export function ResourcesView(): React.JSX.Element {
  const api = useApi()
  const setStatus = useStatus()

  const open = async (link: ResourceLink): Promise<void> => {
    try {
      const opened = await api.openExternal(link.url)
      if (!opened) setStatus('That link can’t be opened.', 'warning')
    } catch (error) {
      setStatus(`That link can’t be opened: ${describeFailure(error)}`, 'error')
    }
  }

  return (
    <div className="view resources" data-region="main">
      <p className="resources__intro">Trusted references for accessible, patient-centred care. Each link opens in your web browser.</p>
      {CATEGORIES.map((category) => {
        const headingId = categoryHeadingId(category)
        return (
          <section key={category} className="resources__group" aria-labelledby={headingId}>
            <h2 id={headingId} className="view__heading">
              {category}
            </h2>
            <ul className="resource-grid" aria-labelledby={headingId}>
              {RESOURCE_LINKS.filter((link) => link.category === category).map((link) => (
                <li key={link.id} className="card resource-card">
                  <h3 className="resource-card__title">{link.title}</h3>
                  <p className="resource-card__description">{link.description}</p>
                  <p className="resource-card__host">
                    <Icon name="lock" />
                    {new URL(link.url).hostname}
                  </p>
                  <button
                    type="button"
                    className="button button--small resource-card__open"
                    aria-label={`Open ${link.title} (opens in your browser)`}
                    onClick={() => void open(link)}
                  >
                    Open
                    <Icon name="external" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
