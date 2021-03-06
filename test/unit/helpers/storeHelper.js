import store from '@/store/modules/hots'

export function resetHotStore() {
  store.state = {
    hotTabs: {},
    packageProperties: {},
    provenanceProperties: { markdown: '' }
  }
}

export function stubSimpleTabStore(hot) {
  const stubbedStore = {
    state: {
      tabs: [],
      activeTab: '',
      tabObjects: {},
      tabIndex: -1,
      activeTitle: '',
      hotTabs: {},
      hot: hot
    },

    getters: {
      getTabs: state => {
        return ['tab0']
      },
      getActiveTab: state => {
        return 'tab0'
      },
      tabTitle: (state, getters) => (tabId) => {
        return `title`
      },
      getTabIndex: state => {
        return 0
      },
      getHotSelection: (state, getters) => (hotId) => {
        return [0, 0, 0, 0]
      },
      getHotColumnProperty: (state, getters) => (property) => {
        let hotColumnProperties = {}
        return hotColumnProperties[property.key]
      },
      getHotIdFromTabId: (state, getters) => (tabId) => {
        return state.hot
      },
      getAllHotTablesColumnNames: (state, getters) => () => {
        return ['stubbed Column names']
      }
    },
    mutations: {
      pushTabTitle(state, tab) {
        _.set(state.tabObjects, `tab0.title`, 'title')
      },
      incrementTabIndex(state) {
        state.tabIndex++
      },
      setActiveTab (state, tabId) {
        state.activeTitle = 'title'
      },
      pushTab (state, tabId) {
        state.tabs.push('tab0')
      },
      pushPackageProperty(state, property) {
        _.set(state.packageProperties, property.key, property.value)
      },
      pushHotTab(state, hotTab) {
        _.set(state.hotTabs, `${hotTab.hotId}.tabId`, hotTab.tabId)
      },
      pushTableProperty(state, property) {
        _.set(state.hotTabs, `${property.hotId}.tableProperties.${property.key}`, property.value)
      },
      pushHotSelection(state, property) {
        _.set(state.hotTabs, `${property.hotId}.selected`, property.selected)
      },
      pushColumnProperty(state, property) {
        _.set(state.hotTabs, `${property.hotId}.columnProperties[${property.columnIndex}].${property.key}`, property.value)
      }
    }
  }
  return stubbedStore
}
