/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

const windowActions = require('../../../js/actions/windowActions')
const ImmutableComponent = require('../../../js/components/immutableComponent')

const suggestionTypes = require('../../../js/constants/suggestionTypes')
const cx = require('../../../js/lib/classSet')
const locale = require('../../../js/l10n')
const {isForSecondaryAction} = require('../../../js/lib/eventUtil')

class UrlBarSuggestions extends ImmutableComponent {
  get activeIndex () {
    if (this.props.suggestionList === null) {
      return -1
    }
    return this.props.selectedIndex
  }

  blur () {
    window.removeEventListener('click', this)
    windowActions.setUrlBarSuggestions(null, null)
  }

  clickSelected (e) {
    windowActions.activeSuggestionClicked(isForSecondaryAction(e), e.shiftKey)
  }

  // Whether the suggestions box should be rendered
  shouldRender () {
    return this.props.suggestionList && this.props.suggestionList.size > 0
  }

  render () {
    window.removeEventListener('click', this)

    if (!this.shouldRender()) {
      return null
    }

    // Add an event listener on the window to hide suggestions when they are shown.
    window.addEventListener('click', this)

    // If there is a URL suffix that means there's an active autocomplete for the first element.
    // We should show that as selected so the user knows what is being matched.

    const suggestions = this.props.suggestionList
    const bookmarkSuggestions = suggestions.filter((s) => s.type === suggestionTypes.BOOKMARK)
    const historySuggestions = suggestions.filter((s) => s.type === suggestionTypes.HISTORY)
    const aboutPagesSuggestions = suggestions.filter((s) => s.type === suggestionTypes.ABOUT_PAGES)
    const tabSuggestions = suggestions.filter((s) => s.type === suggestionTypes.TAB)
    const searchSuggestions = suggestions.filter((s) => s.type === suggestionTypes.SEARCH)
    const topSiteSuggestions = suggestions.filter((s) => s.type === suggestionTypes.TOP_SITE)

    let items = []
    let index = 0
    const addToItems = (suggestions, sectionKey, title, icon) => {
      if (suggestions.size > 0) {
        items.push(<li className='suggestionSection'>
          {
            icon
            ? <span className={cx({
              suggestionSectionIcon: true,
              [sectionKey]: true,
              fa: true,
              [icon]: true
            })} />
            : null
          }
          <span className='suggestionSectionTitle'>{title}</span>
        </li>)
      }
      items = items.concat(suggestions.map((suggestion, i) => {
        const currentIndex = index + i
        const selected = this.activeIndex === currentIndex || (!this.activeIndex && currentIndex === 0 && this.props.hasLocationValueSuffix)
        return <li data-index={currentIndex}
          onMouseOver={this.onMouseOver.bind(this)}
          onClick={suggestion.onClick}
          key={`${suggestion.location}|${index + i}`}
          ref={(node) => { selected && (this.selectedElement = node) }}
          className={cx({
            selected,
            suggestionItem: true,
            [suggestion.type]: true
          })}>
          {
            suggestion.type !== suggestionTypes.TOP_SITE && suggestion.title
            ? <div className='suggestionTitle'>{suggestion.title}</div>
            : null
          }
          {
            suggestion.type !== suggestionTypes.SEARCH && suggestion.type !== suggestionTypes.ABOUT_PAGES
            ? <div className='suggestionLocation'>{suggestion.location}</div>
            : null
          }
        </li>
      }))
      index += suggestions.size
    }
    addToItems(historySuggestions, 'historyTitle', locale.translation('historySuggestionTitle'), 'fa-clock-o')
    addToItems(bookmarkSuggestions, 'bookmarksTitle', locale.translation('bookmarksSuggestionTitle'), 'fa-star-o')
    addToItems(aboutPagesSuggestions, 'aboutPagesTitle', locale.translation('aboutPagesSuggestionTitle'), null)
    addToItems(tabSuggestions, 'tabsTitle', locale.translation('tabsSuggestionTitle'), 'fa-external-link')
    addToItems(searchSuggestions, 'searchTitle', locale.translation('searchSuggestionTitle'), 'fa-search')
    addToItems(topSiteSuggestions, 'topSiteTitle', locale.translation('topSiteSuggestionTitle'), 'fa-link')
    const documentHeight = Number.parseInt(window.getComputedStyle(document.querySelector(':root')).getPropertyValue('--navbar-height'), 10)
    const menuHeight = this.props.menubarVisible ? 30 : 0
    return <ul className='urlBarSuggestions' style={{
      maxHeight: document.documentElement.offsetHeight - documentHeight - 2 - menuHeight
    }}>
      {items}
    </ul>
  }

  onMouseOver (e) {
    this.updateSuggestions(parseInt(e.target.dataset.index, 10))
  }

  componentDidMount () {
  }

  componentWillUpdate (nextProps) {
    if (this.selectedElement) {
      this.selectedElement.scrollIntoView()
    }
  }

  updateSuggestions (newIndex) {
    const suggestions = this.suggestionList || this.props.suggestionList
    if (!suggestions) {
      return
    }
    // Update the urlbar preview content
    if (newIndex === 0 || newIndex > suggestions.size) {
      newIndex = null
    }
    windowActions.setUrlBarSuggestions(suggestions, newIndex)
  }
}

module.exports = UrlBarSuggestions
